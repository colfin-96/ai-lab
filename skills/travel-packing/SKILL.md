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

The `references/` directory holds frozen snapshots (`example-master-template.md`, and
a filled-out `example-output.md`) for development and illustration only. Never read
them at runtime — they will drift from the live vault. The vault paths above are the
only runtime sources.

## Inputs — ask if missing

You need four things:

1. **Destination** — city/region and country (enough to look up weather, and to know
   the plug type / whether it's outside Schengen).
2. **Dates** — start and end, or start + number of nights. Trip length gates several
   items (shaver, nail clippers, floss come in at 5+ days).
3. **Travel mode** — driving, flying, train, ferry. This strongly shapes the list:
   driving means generous space (dressing gown, laptop, extras become easy) plus
   sunglasses and hand sanitizer for the car; flying means tight space, liquid limits,
   and a powerbank for long transit.
4. **Purpose / activity** (optional but valuable) — e.g. festival, beach, business,
   hiking, wedding. Drives what to add and what to skip.

If the user hasn't given destination, dates, and travel mode, ask for them before
proceeding. Purpose is optional — if they don't offer it, infer what you reasonably
can from the destination and season, and note any assumption you made.

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

Mirror the user's own hand-built style (see `references/example-output.md` for a
reference example — match its level of annotation and tone). Preserve the
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

## Item decision guide

This captures how the user actually decides, per item. It's a guide, not a rulebook —
weather, purpose, and travel mode still override. But default to these so the list
feels like the user's own.

**Always take (keep as `- [ ]`, don't strike unless the user says otherwise):**

- Pants, Socks, T-Shirts — the non-negotiable base, scaled to nights.
- One of Trousers *or* Shorts (weather picks which; hot → shorts, cool/smart → trousers),
  plus Belt.
- Toothbrush & Toothpaste, Deodorant, Hair Wax, Perfume.
- Phone, Charger (Phone + Watch), Smartwatch.
- Personalausweis.
- 2 Bin Bags — keep both: one for dirty washing, one to wrap shower gel against leaks.
- Glasses Cloth — lives in the rucksack by default, so it's always there.

**Medicine — always ask.** Don't strike or assume. Ask the user whether they're
currently taking or likely to need any meds for this trip, and reflect their answer.

**Usually take (default in unless there's a reason not to):**

- Jumper — 1, for cooler evenings / a layer.
- Rucksack.
- Shower Gel.

**Conditional — decide from dates / mode / weather / destination:**

- Dressing Gown — take if driving or there's clearly enough luggage space; skip if
  flying light or short trip.
- Sun Glasses — summer, and especially if driving.
- Shaver + Charger — 5+ day trips.
- Nail Clippers, Tooth Floss — 5+ day trips.
- Powerbank + Cable — long transit (especially flying), or photo-heavy event days out
  with no charging.
- Headphones + Case — take if there's space; usual on flights/trains.
- Adapter (Small) — only for non-German/non-EU sockets: UK, US, Canada, etc. Skip for
  Schengen/EU-plug destinations.
- Adapter (Extension Cord) — alternative or addition to the small adapter; same
  destination rule. Only when several devices need charging.
- Laptop + Charger — take when there's space, for the translation side business.
- Keyboard + Mouse — seldom; only if the laptop use and luggage space justify it.
- Tablet — rarely; nice for watching a film on long transit.
- Sun cream, Cap/hat — summer / sunny / lots of sun exposure.
- Hand Sanitizer — when driving.
- Books — if there'll be downtime to read.
- Passport — only when leaving the Schengen area.

**Rarely take:**

- Swimming Trunks — only if a pool / beach / swim is actually planned.

Weather can still add items beyond the master (water bottle for a hot day out,
waterproof for rain) — annotate those as additions, as in the reference.

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
