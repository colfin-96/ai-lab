---
name: travel-packing
description: >-
  Generate a trip-tailored packing checklist as a new note in the user's Obsidian
  vault. Given a destination, dates, and (optionally) trip purpose, it reads the
  user's master packing template from the vault, looks up weather for the
  destination/dates, and produces a customized list — quantities scaled to trip
  length, inapplicable items struck through with a reason, and trip-specific items
  added. Use this whenever the user mentions packing, a packing list/checklist,
  "what to pack", preparing or getting ready for a trip, travel prep, or names a
  specific trip and wants it organized (e.g. "pack for Goodwood", "packing list
  for my Lisbon weekend", "help me get ready for the Berlin trip"). Trigger even
  if they don't say the word "packing" but clearly want trip preparation captured
  in their vault.
---

# Travel Packing Checklist Generator

Produce a packing checklist tailored to a specific trip and write it as a note in
the user's Obsidian vault. The value is in the tailoring: the master template is a
superset of everything the user might bring, and each trip is a decision about
what to actually take, how much, and what extra the destination/weather/activity
demands. Your job is to make those decisions transparently, mirroring how the user
does it by hand.

## Vault paths

Vault root (note the `(OneDrive)` suffix — it is part of the real path):

```
/Users/colin.finger/Library/CloudStorage/OneDrive-Personal/Obsidian/Personal (OneDrive)/
```

- **Master template (source of truth):** `01 Atlas/Travel/Travel Packing Checklist.md`
- **Fallback bare template:** `Templates/Things to Pack.md`
- **Output directory:** `01 Atlas/Travel/`

Always read the master template at runtime and build from it. Never bake a copy of
the item list into this skill — the user edits their template over time, and those
edits must flow through automatically. If the master is missing, fall back to the
bare template.

## Inputs — ask if missing

You need three things:

1. **Destination** — city/region and country (enough to look up weather).
2. **Dates** — start and end, or start + number of nights.
3. **Purpose / activity** (optional but valuable) — e.g. festival, beach, business,
   hiking, wedding. This drives what to add and what to skip.

If the user hasn't given destination and dates, ask for them before proceeding.
Purpose is optional — if they don't offer it, infer what you reasonably can from the
destination and season, and note any assumption you made.

## Weather logic

Packing decisions are driven by conditions, so look them up — don't guess.

- Web-search the weather for the destination across the trip dates.
- **If the trip start is within forecast range (~10–14 days out):** use the actual
  forecast. State it as a forecast in the note.
- **If it's further out:** use typical/historical weather patterns for that location
  and time of year, and say so explicitly. Never present a historical pattern as if
  it were a live forecast — the user relies on knowing which it is so they can
  re-check closer to the date.

Let the conditions drive the list. Some examples of the reasoning (not an exhaustive
rulebook — think about the actual trip):

- Hot + dry + outdoor → sun cream, cap/hat, sunglasses, fewer layers, more T-shirts.
- Cold → extra jumpers, warmer layers, maybe skip shorts.
- Rain likely → waterproof jacket, and reconsider suede/light shoes.
- Evenings cooler than days → one layer for evenings even in a warm forecast.

## Tailoring rules

Mirror the user's own hand-built style (see `03 Effort/FoS Goodwood Trip.md` in the
vault for a reference example — match its level of annotation and tone). Preserve the
master's **section structure and heading order** exactly: `Pre-Trip Todos`, `Clothes`,
`Toiletries`, `Electronics`, `Other`. Within a section you may reorder items so the
things being taken sit at the top and the struck items sit below — the reference does
this — but don't invent or drop sections.

**Quantities — scale to nights.** For consumable/repeated clothing, append `— <n>`.
Rule of thumb: roughly one per night for pants, socks, T-shirts, capped by what's
sensible for the trip length and laundry access. Example:

```
- [ ] Pants — 3
- [ ] Socks — 3
- [ ] T-Shirts — 3
```

**Applicable items stay as unchecked tasks** so the user can tick them while packing:

```
- [ ] Deodorant
```

Add a short parenthetical or `—` note where the reason isn't obvious (e.g.
`- [ ] Belt (only if wearing trousers)`).

**Skipped items stay visible, struck through, with a short reason.** Keep them in the
list rather than deleting them — the user wants to see the decision was considered,
not silently dropped. Struck items drop the checkbox:

```
- ~~Swimming Trunks~~ — skip, no pool/swim planned
- ~~Dressing Gown~~ — skip, short trip
```

**Trip-specific additions** — items not in the master that the destination/weather/
activity call for. Keep them as tasks and annotate why:

```
- [ ] Sun cream — add, sunny outdoor event
- [ ] Cap/hat — add, sun exposure
- [ ] Adapter (Small) — UK plug adapter needed
```

Keep annotations terse — a few words on the "why", matching the reference. The goal is
a list the user can scan and trust, seeing at a glance both what's coming and what was
deliberately left behind.

## Output note

Write a new note to `01 Atlas/Travel/`.

**Filename:** trip start date in `YYMMDD` format, a space, then a short trip name.
Example: Goodwood Festival of Speed starting 9 July 2026 → `260709 FoS Goodwood.md`.
Keep the short name recognizable (abbreviate long event names).

**Frontmatter:**

```yaml
---
tags: [personal, travel]
---
```

**Body** — an `# <Trip Name>` H1, then a `## Context` section, then the tailored
sections in master order. The Context section states the trip dates, number of nights,
destination, and the weather assumption, being explicit about forecast vs. historical:

```markdown
# FoS Goodwood Trip

## Context

Trip: **9–11 July 2026** (2 nights), Goodwood Festival of Speed, West Sussex, England.
Weather forecast: sunny, warm (~28°C / 82°F), dry, light NE wind. Outdoor event, lots
of walking/standing.
```

For a trip beyond forecast range, phrase the weather line as a pattern, e.g.:
`Weather (historical pattern for mid-October, no live forecast yet): typically cool,
~14°C, frequent rain — re-check nearer the date.`

## After writing

Tell the user the filename and path, and confirm which weather source you used
(live forecast or historical pattern) so they know whether to re-check closer to the
trip.
