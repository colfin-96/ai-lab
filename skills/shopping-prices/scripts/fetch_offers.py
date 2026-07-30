#!/usr/bin/env python3
"""Fetch current grocery offers from aktionspreis.de and emit a validated JSON index.

One job: turn N shop pages into a flat, normalised offer list. No matching, no
clustering, no decisions -- that is the skill's work. This script knows nothing
about the Obsidian vault; shop slugs are passed in.

Usage:
    fetch_offers.py --shops aldi-sued,rewe,penny --out index.json
    fetch_offers.py --verify                 # parse saved fixtures, no network
    fetch_offers.py --shops aldi-sued --no-cache --pretty

Exit codes:
    0  all requested shops parsed cleanly
    1  at least one shop failed (index still written, shops[].ok is false)
    2  nothing usable at all / bad invocation
"""

from __future__ import annotations

import argparse
import html
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

BASE = "https://www.aktionspreis.de"

# Descriptive UA. Note two hard-won constraints:
#   * robots.txt names "Python-urllib" in its denylist, so the default UA is out.
#   * Sending an "Accept" header makes the server return an empty 0-byte body.
#     Do not add one.
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "obsidian-shopping-prices/0.1 (personal use; low volume)"
)

REQUEST_DELAY_S = 1.5      # sequential, never parallel
MAX_RETRIES = 3
CACHE_MAX_AGE_H = 12

# Homepage promo cards bleed into every page; they are not offers of this shop.
NOISE_SLUGS = {
    "landliebe-butter-250g",
    "moevenpick-eis-850-900ml",
    "syoss-color-115ml",
    "vio-biolimo-1l",
    "weihenstephan-butter-250g",
    "weihenstephan-frische-butter-250g",
}

# Shop slug -> geographic cluster, for the skill's trip logic. Mirrors
# "01 Atlas/Home/Läden.md"; passed through untouched for unknown shops.
CLUSTERS = {
    "aldi-sued": "Pesch",
    "dm": "Pesch",
    "lidl": "Pesch",
    "kaufland": "Pulheim",
    "netto-marken-discount": "Pulheim",
    "penny": "Pulheim",
    "rewe": "Pulheim",
    "rossmann": "Pulheim",
    "edeka": "Köln",
    "globus": "Lindenthal",
    "handelshof": "Ehrenfeld",
    "selgros": "Ossendorf",
    "marktkauf": "Frechen",
    "hit": "Dormagen",
}

DEFAULT_SHOPS = list(CLUSTERS)


# --------------------------------------------------------------------------- #
# parsing
# --------------------------------------------------------------------------- #

# Product links on a shop page are SHOP-SCOPED and two-segment, and may carry a
# #fragment. A '"'-terminated pattern silently matches nothing -- that bug cost
# real time, hence the explicit fragment branch.
OFFER_HREF = re.compile(
    r'href="/angebote/([a-z0-9-]+)/([a-z0-9-]+)(?:[#?][^"]*)?"([^>]*)'
)
CATEGORY_H3 = re.compile(r"<h3>(.*?)</h3>", re.S)
LD_JSON = re.compile(
    r'<script[^>]*application/ld\+json[^>]*>(.*?)</script>', re.S
)
HEADER_COUNT = re.compile(
    r"(\d+)\s*aktuelle.{0,40}?Angebote(?:\s*davon\s*(\d+)\s*Tiefstpreise)?"
)

# Some shops publish no leaflet at all (dm) or simply have nothing indexed this
# week (Globus). The page says so explicitly. That is a legitimate empty result
# and must not be confused with a broken parser.
EMPTY_STATE = re.compile(
    r"liegen\s+derzeit\s+noch\s+keine\s+Angebote\s+vor", re.I
)

RE_PRICE = re.compile(r"(\d+,\d{2})\s*€")
RE_UNIT = re.compile(r"(\d+,\d{2})\s*€\s*je\s*([^\s,<]+)")
RE_PCT = re.compile(r"(\d{1,2})\s*%")
RE_TITLE = re.compile(r'title="([^"]+)"')
RE_ALT = re.compile(r'alt="([^"]+)"')
RE_SIZE = re.compile(r"\(([^)]{1,24})\)\s*$")

# The listing renders a product's *unit* price as a second pseudo-product with
# its own slug: "Asbach (0,7l) 9,99 €" is followed by "Asbach (1l) 14,27 €".
# The second is not purchasable. Signature: size is exactly 1l/1kg, no discount
# badge, and an empty grundpreis span. Flagged rather than dropped -- the script
# normalises, the skill decides.
DERIVED_SIZES = {"1l", "1 l", "1kg", "1 kg", "1liter", "1 liter", "1stück", "1 stück"}


def strip_comments(page: str) -> str:
    """Drop HTML comments before any parsing.

    Comments can contain literal markup (a commented-out <h3>, a sample block),
    which would otherwise be picked up as a real category heading or offer.
    """
    return re.sub(r"<!--.*?-->", "", page, flags=re.S)


def strip_tags(fragment: str) -> str:
    """Visible text of an HTML fragment, whitespace-collapsed."""
    fragment = re.sub(
        r"<script.*?</script>|<style.*?</style>", "", fragment, flags=re.S | re.I
    )
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", fragment))).strip()


def cents(german_price: str) -> int:
    """'2,79' -> 279"""
    return int(round(float(german_price.replace(".", "").replace(",", ".")) * 100))


def parse_sale_event(page: str) -> dict:
    """Offer validity window from the SaleEvent JSON-LD block."""
    for block in LD_JSON.findall(strip_comments(page)):
        try:
            obj = json.loads(block, strict=False)
        except (ValueError, TypeError):
            continue
        if isinstance(obj, dict) and obj.get("@type") == "SaleEvent":
            return {"start": obj.get("startDate"), "end": obj.get("endDate")}
    return {"start": None, "end": None}


def parse_shop_page(page: str, shop: str) -> tuple[list[dict], int | None]:
    """Extract offers from one /prospekt/<shop>-angebote page.

    Offers sit under <h3> category headings, so category comes from the nearest
    preceding heading in document order. Returns (offers, count_claimed_by_page).
    """
    page = strip_comments(page)
    marks: list[tuple[int, str, object]] = []
    for m in CATEGORY_H3.finditer(page):
        marks.append((m.start(), "cat", strip_tags(m.group(1))))
    for m in OFFER_HREF.finditer(page):
        marks.append((m.start(), "offer", (m.group(2), m.group(3))))
    marks.sort(key=lambda t: t[0])

    positions = [p for p, _, _ in marks]
    by_slug: dict[str, dict] = {}
    category: str | None = None

    for idx, (pos, kind, payload) in enumerate(marks):
        if kind == "cat":
            category = payload  # type: ignore[assignment]
            continue

        slug, attrs = payload  # type: ignore[misc]
        if slug in NOISE_SLUGS:
            continue

        end = positions[idx + 1] if idx + 1 < len(positions) else pos + 1600
        block = page[pos:min(end, pos + 1600)]
        text = strip_tags(block)

        price = RE_PRICE.search(text)
        if not price:
            continue

        title = RE_TITLE.search(attrs) or RE_TITLE.search(block)
        alt = RE_ALT.search(block)
        unit = RE_UNIT.search(text)
        pct = RE_PCT.search(text)

        title_text = title.group(1) if title else ""
        size_match = RE_SIZE.search(title_text)
        size = size_match.group(1).strip() if size_match else None
        derived = (
            pct is None
            and unit is None
            and size is not None
            and size.lower().replace(",", ".") in DERIVED_SIZES
        )

        record = {
            "shop": shop,
            "cluster": CLUSTERS.get(shop),
            "category": category,
            "desc": (alt.group(1) if alt else None)
            or (title.group(1) if title else slug),
            "title": title.group(1) if title else None,
            "slug": slug,
            "brand": slug.split("-")[0],
            # Slugs are NOT stable -- observed renaming inside one offer week
            # (heinz-1-170l -> heinz-tomato-ketchup-1-170l, coca-cola -> cola).
            # Brand matching should use this instead of the slug prefix.
            "match_text": " ".join(
                filter(None, [(alt.group(1) if alt else None), title_text, slug])
            ).lower(),
            "section": "category" if category else "tiefstpreis_highlight",
            "size": size,
            "price_cents": cents(price.group(1)),
            "price": price.group(1) + " €",
            "unit_price": unit.group(0) if unit else None,
            "pct_off": int(pct.group(1)) if pct else None,
            "tiefstpreis": "Tiefstpreis" in text,
            "derived_unit_row": derived,
            "url": f"{BASE}/angebote/{shop}/{slug}",
        }

        # Dedupe on slug+price+size, not slug alone: slugs are reused and are not
        # stable, so two genuinely different products can share one. Prefer a
        # categorised copy over an uncategorised one, keeping the Tiefstpreis flag.
        key = (slug, record["price_cents"], size)
        prior = by_slug.get(key)
        if prior is None:
            by_slug[key] = record
        elif prior["category"] is None and record["category"] is not None:
            record["tiefstpreis"] = record["tiefstpreis"] or prior["tiefstpreis"]
            by_slug[key] = record
        elif record["tiefstpreis"]:
            prior["tiefstpreis"] = True

    offers = list(by_slug.values())

    # The page's "N aktuelle Angebote" counts the CATEGORY listing only. Items in
    # the Tiefstpreis highlight block above the first <h3> are duplicates of
    # category rows -- under different slugs, so slug dedupe cannot catch them.
    # Propagate the Tiefstpreis signal onto the real row, matching on price+size.
    highlights = [o for o in offers if o["section"] == "tiefstpreis_highlight"]
    for hl in highlights:
        for o in offers:
            if (o["section"] == "category"
                    and o["price_cents"] == hl["price_cents"]
                    and o["size"] == hl["size"]):
                o["tiefstpreis"] = True

    page_text = strip_tags(page)
    claimed_match = HEADER_COUNT.search(page_text)
    claimed = int(claimed_match.group(1)) if claimed_match else None
    empty = bool(EMPTY_STATE.search(page_text))
    return offers, claimed, empty


# --------------------------------------------------------------------------- #
# fetching
# --------------------------------------------------------------------------- #

def fetch(url: str) -> str:
    """GET with retry/backoff. UA only -- deliberately no Accept header."""
    last: Exception | None = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=30) as resp:
                body = resp.read().decode("utf-8", "replace")
            if not body.strip():
                # Seen for real: sending an Accept header yields a 200 with a
                # 0-byte body. Treat as retryable rather than "no offers".
                raise ValueError("empty response body")
            return body
        except urllib.error.HTTPError as exc:
            last = exc
            if 400 <= exc.code < 500:
                break          # permanent; retrying a 404 just wastes time
            if attempt < MAX_RETRIES:
                time.sleep(REQUEST_DELAY_S * 2 ** attempt)
        except (urllib.error.URLError, ValueError, OSError) as exc:
            last = exc
            if attempt < MAX_RETRIES:
                time.sleep(REQUEST_DELAY_S * 2 ** attempt)
    raise RuntimeError(f"{url}: {last}")


def cache_path(cache_dir: Path, shop: str) -> Path:
    return cache_dir / f"{shop}-{datetime.now().strftime('%Y-%m-%d')}.html"


def load_shop(shop: str, cache_dir: Path | None, max_age_h: float) -> tuple[str, bool]:
    """Return (html, from_cache). Cache is per shop per day."""
    if cache_dir:
        cached = cache_path(cache_dir, shop)
        if cached.exists():
            age_h = (time.time() - cached.stat().st_mtime) / 3600
            if age_h < max_age_h:
                return cached.read_text(encoding="utf-8", errors="replace"), True

    page = fetch(f"{BASE}/prospekt/{shop}-angebote")
    if cache_dir:
        cache_dir.mkdir(parents=True, exist_ok=True)
        cache_path(cache_dir, shop).write_text(page, encoding="utf-8")
    return page, False


# --------------------------------------------------------------------------- #
# orchestration
# --------------------------------------------------------------------------- #

def build_index(shops, cache_dir, max_age_h, fixtures=None):
    offers: list[dict] = []
    status: dict[str, dict] = {}
    weeks: list[dict] = []
    first_network = True

    for shop in shops:
        try:
            if fixtures is not None:
                page = (fixtures / f"{shop}.html").read_text(
                    encoding="utf-8", errors="replace"
                )
                from_cache = True
            else:
                if not first_network:
                    time.sleep(REQUEST_DELAY_S)
                page, from_cache = load_shop(shop, cache_dir, max_age_h)
                if not from_cache:
                    first_network = False
        except Exception as exc:                      # one shop must not kill the run
            status[shop] = {"ok": False, "error": f"{type(exc).__name__}: {exc}",
                            "claimed": None, "parsed": 0}
            print(f"  !! {shop}: {exc}", file=sys.stderr)
            continue

        shop_offers, claimed, empty = parse_shop_page(page, shop)
        week = parse_sale_event(page)
        if week.get("start"):
            weeks.append(week)

        catalogued = [o for o in shop_offers if o["section"] == "category"]
        derived = sum(1 for o in catalogued if o["derived_unit_row"])
        buyable = len(catalogued) - derived

        note = None
        if empty and not catalogued:
            # Shop publishes nothing this week -- a real answer, not a failure.
            ok = True
            note = "shop publishes no offers this week"
        elif not catalogued:
            ok = False
            note = "parsed zero offers but page is not an empty-state -- parser broken?"
        else:
            ok = True
            if claimed is not None and claimed != len(catalogued):
                # Parser and page disagree. Usually a handful of blocks carry no
                # price. Not fatal, but never swallow it.
                note = (f"page claims {claimed}, parsed {len(catalogued)} "
                        f"categorised ({claimed - len(catalogued)} missed)")

        status[shop] = {
            "ok": ok, "claimed": claimed, "parsed": len(catalogued),
            "buyable": buyable, "derived_unit_rows": derived,
            "highlight_dupes": len(shop_offers) - len(catalogued),
            "empty_state": empty, "cached": from_cache,
        }
        if note:
            status[shop]["note"] = note

        offers.extend(shop_offers)
        flag = "ok  " if ok else "FAIL"
        print(f"  {flag} {shop:26} {buyable:3} buyable "
              f"({derived} unit-price, {len(shop_offers) - len(catalogued)} dupes)"
              f"{' (cache)' if from_cache else ''}"
              f"{'  <- ' + note if note else ''}", file=sys.stderr)

    week = max(weeks, key=lambda w: w.get("end") or "") if weeks else {
        "start": None, "end": None}
    return {
        "fetched": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": BASE,
        "offer_week": week,
        "shops": status,
        "offer_count": len(offers),
        "buyable_count": sum(1 for o in offers if o["section"] == "category"
                            and not o["derived_unit_row"]),
        "offers": sorted(offers, key=lambda o: (o["shop"], o["category"] or "",
                                                o["price_cents"])),
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--shops", default=",".join(DEFAULT_SHOPS),
                    help="comma-separated aktionspreis slugs (without '-angebote')")
    ap.add_argument("--out", type=Path, help="write JSON here (default: stdout)")
    ap.add_argument("--cache-dir", type=Path,
                    default=Path(os.environ.get("TMPDIR", "/tmp")) / "aktionspreis-cache")
    ap.add_argument("--no-cache", action="store_true")
    ap.add_argument("--max-age-hours", type=float, default=CACHE_MAX_AGE_H)
    ap.add_argument("--verify", action="store_true",
                    help="parse saved fixtures instead of fetching; no network")
    ap.add_argument("--pretty", action="store_true")
    args = ap.parse_args()

    fixtures = None
    if args.verify:
        fixtures = Path(__file__).parent / "fixtures"
        available = sorted(p.stem for p in fixtures.glob("*.html"))
        if not available:
            print(f"no fixtures in {fixtures}", file=sys.stderr)
            return 2
        shops = available
        print(f"verify mode, fixtures: {', '.join(shops)}", file=sys.stderr)
    else:
        shops = [s.strip().removesuffix("-angebote")
                 for s in args.shops.split(",") if s.strip()]
        if not shops:
            print("no shops given", file=sys.stderr)
            return 2

    index = build_index(
        shops,
        None if (args.no_cache or args.verify) else args.cache_dir,
        args.max_age_hours,
        fixtures=fixtures,
    )

    payload = json.dumps(index, ensure_ascii=False,
                         indent=2 if args.pretty else None)
    if args.out:
        args.out.write_text(payload + "\n", encoding="utf-8")
        print(f"wrote {args.out}  ({index['offer_count']} offers)", file=sys.stderr)
    else:
        print(payload)

    shops_status = index["shops"].values()
    if index["offer_count"] == 0:
        # A silent empty index is the failure that actually hurts -- it reads as
        # "nothing is on offer this week". Only accept it when every shop said so
        # explicitly on the page.
        if shops_status and all(s.get("empty_state") for s in shops_status):
            print("all shops report no offers this week", file=sys.stderr)
            return 0
        print("FATAL: zero offers parsed across all shops", file=sys.stderr)
        return 2
    return 0 if all(s["ok"] for s in shops_status) else 1


if __name__ == "__main__":
    sys.exit(main())
