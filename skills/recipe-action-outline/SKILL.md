---
name: recipe-action-outline
description: Render a recipe as "action outlines", the Cooking for Engineers style tables (one small outline per component) where ingredients run down the left and each cooking step is a column whose box spans the ingredients it uses. Adds a flow diagram when components feed each other or run at the same time. Use whenever the user asks to show, render, chart or lay out a recipe as an action outline, a recipe grid, a recipe chart or "that recipe table where steps span the ingredients", or hands over a recipe and wants a visual, scannable cooking layout. Output is an HTML artifact page (default) or HTML tables inside an Obsidian note.
---

# Recipe action outline

An action outline reads like a spreadsheet: ingredients down the left (amount, name, prep), one column per step going left to right, and each step's box stretched down every ingredient row it involves. Time runs left to right, so ingredients that join late have empty cells in the early columns, and parallel work (veg roasting while chicken bakes) sits in the same columns on different rows.

A recipe is never one big grid. Like Cooking for Engineers, split it into **one outline per component** (roast, jus, batter; chicken, veg and rice, sauce), each a small table of its own with a heading. Small tables stay readable on a phone and each one fills with real steps instead of filler.

## Files in this skill

| Path | Use |
|---|---|
| `assets/outline.css` | All styling: light and dark tokens, track colours `--c1`..`--c8` (classes `.t1`..`.t8`), table, sideways tooltip cells, chips, flow diagram, note cards. Never edit per recipe. |
| `scripts/build_page.js` | `node scripts/build_page.js body.html out.html` wraps a body fragment into a full page (title from the first `<h1>`, fonts, `outline.css` inlined), then runs the checker. |
| `scripts/build_note.js` | `node scripts/build_note.js body.html note.md --snippet action-outline.css` writes an Obsidian note (frontmatter, title, one HTML block) and the scoped CSS snippet, then runs the checker. See Obsidian below. |
| `scripts/check_grid.js` | `node scripts/check_grid.js page.html` checks every table's span arithmetic and every `href="#id"`. Exit 1 with `table N, row R` on failure. Node, no dependencies. |
| `references/karaage.body.html` | Worked example, three outlines that run at the same time and merge at the end. Copy this for simple recipes. |
| `references/wellington.body.html` | Worked example, four outlines in a chain with a parallel pair, carried-over rows, tall sideways steps. Copy this for complex recipes. |

You write only a **body fragment** (`<main class="page">…</main>`), never the CSS.

## Procedure

1. **Get the recipe.** From text, a vault note, or a URL. If a site blocks plain fetches (403), open it in the user's browser instead of working around the block. Extract: servings, every ingredient with amount and prep, and the steps with times and temperatures. Never invent amounts: if the source has none, say so or mark them as estimates in a note card.
2. **Split into components.** A component is a part you cook as one unit: the main dish, a sauce made from its drippings, a batter, a side. Name each one, in the order the user starts them. An ingredient that comes out of another component (drippings, stock) is an ordinary row in the consuming table, marked as carried over.
3. **Order the rows.** Inside a component, group ingredients into tracks (chicken and its marinade; veg and its seasoning; rice). Order rows so every step's ingredients are adjacent. Rows have no required order.
4. **Lay out the columns.** One column per sequential step. Parallel tracks share columns on different rows.
   - A setup instruction for the whole component (preheat, line the tray) is a first body row with one `td.pre`, `colspan` = every column.
   - A step cell gets `rowspan` = ingredient rows it uses. A long step gets `colspan` = columns it lasts.
   - Steps that involve every ingredient (cool, pack, serve) go in the last columns with `rowspan` = all ingredient rows.
   - An ingredient that joins at step N gets filler cells for steps 1 to N-1 (`td.f`, with `colspan` where adjacent).
   - Every table has a `<thead>` with column headers; the checker takes its width from it.
5. **Sideways steps.** A step cell whose label is one short word (about 12 characters or fewer) and whose `rowspan` is 3 or more gets `v` and `tabindex="0"`. Label runs vertically, detail goes in `<span class="d">` and shows as a tooltip on hover and focus. Use for the last columns (cool, pack, rest, carve), not for the first steps.
6. **Show how components connect** (only with two or more components that feed each other or run together):
   - **Flow diagram** under the legend, inline SVG, one column per point in time. Outlines that run at the same time share a column on a tinted "at the same time" band. Arrows only where one outline feeds or precedes another; an outline that needs nothing earlier gets no incoming arrow, only its column. Elbows (`Q`) join several outlines into one next step.
   - **Needs / Makes line** under each `<h2>`: `<p class="meta">`, every outline reference a chip.
   - **Carried-over rows** get `class="carry"` and a prep cell chip `↳ from N`.
   - **Parallel outlines** go inside `<div class="together" role="group">` with a "⇄ At the same time" label, and each says "Runs alongside N".
   - All-parallel recipes that merge at the end: one band, all chips stacked, no arrows between them, one elbow from each into an "Assemble" node linking to a note card with `id="assembly"`.
7. **Write the body, build, check.**
   ```bash
   node scripts/build_page.js recipe.body.html recipe.html
   ```
   Fix every reported `table N, row R` problem and rerun until `OK`. The checker decides, not a visual guess.
8. **Deliver.**
   - Default: publish `recipe.html` as an Artifact (title = recipe name, icon `recipe`). Each table sits in an `overflow-x: auto` wrapper, so phones scroll sideways inside the table, not the page.
   - For Obsidian, see the next section.
9. **Offer** one follow-up: save the tables into the recipe note, or adjust steps.

## Obsidian

Obsidian renders HTML tables with `rowspan`, so outlines work in reading view, but it strips `<style>` tags from notes. Styling therefore lives in a CSS snippet, and the note holds plain HTML.

1. Build both files:
   ```bash
   node scripts/build_note.js recipe.body.html Recipe.md --snippet action-outline.css
   ```
   `Recipe.md` is frontmatter (`tags: [cooking]`), a `# title` heading and one `<div class="ao">` HTML block with no blank lines (a blank line ends an HTML block in Markdown). To add an outline to an existing note instead, paste only the `<div class="ao">…</div>` block under its own `## Action outline` heading.
2. Install the snippet once per vault as `<vault>/.obsidian/snippets/action-outline.css`, then enable it under Settings > Appearance > CSS snippets (reload the list if it is missing). The snippet is scoped under `.ao`, follows Obsidian's own light and dark theme, uses the Obsidian font, and does not touch other notes. Regenerate and copy it again whenever `assets/outline.css` changes.
3. Open the note in **Reading view**. In editing view Obsidian shows the raw HTML.

Notes from testing:
- On a phone the snippet must reach the phone's `.obsidian/snippets/` folder. Sync tools often skip hidden folders or new folders in `.obsidian`, so check the file is there (size and date), then fully close and reopen Obsidian, which reads snippets only at startup.
- The ingredient column is sticky and the amount scrolls away, so a table that is wider than the screen scrolls inside its own container. Header cells are forced opaque because some themes make them transparent.
- Hover tooltips on sideways steps do not exist on a phone.
- Untested in Obsidian: the SVG flow diagram and the in-page chip links (`#o1`). If a diagram is stripped, drop it and keep the "Needs / Makes" lines.
- Do not widen notes with `cssclasses` and `--file-line-width`; the table scroller already handles wide tables.

## Markup cheat sheet

Page skeleton (`<h1>` gives the page title):

```html
<main class="page">
  <header><h1>Name</h1><p class="sub">Serves 4 · …</p></header>
  <div class="legend" aria-label="Colour key"><span style="--c: var(--c1)"><i></i>Chicken</span> …</div>
  <!-- flow diagram, only when components connect -->
  <section aria-labelledby="o1">
    <h2 id="o1">Component name</h2>
    <p class="meta"><b>Needs</b> … · <b>Makes</b> …</p>   <!-- only with a flow diagram -->
    <div class="wrap"><table>…</table></div>
  </section>
  <section class="notes" aria-label="Notes"><div class="note"><h2>Title</h2><p>Text</p></div></section>
</main>
```

Table, one track per row class (`t1`..`t8`):

```html
<table>
  <thead><tr><th scope="col">Amount</th><th scope="col">Ingredient</th><th scope="col">Prep</th><th scope="col">Step 1</th><th scope="col">Step 2</th></tr></thead>
  <tbody>
    <tr><td class="pre" colspan="5">Preheat the oven to 200 °C.</td></tr>
    <tr class="t1"><td class="a">700 g</td><td class="i">chicken</td><td class="p">cut in chunks</td>
      <td class="s t1" rowspan="3"><b>Marinate</b><span>20 min</span></td>
      <td class="s v t1" rowspan="4" tabindex="0"><b>Pack</b><span class="d">Detail shown as a tooltip.</span></td></tr>
    <tr class="t1"><td class="a">4 tbsp</td><td class="i">soy sauce</td><td class="p"></td></tr>
    <tr class="t1"><td class="a">1 tbsp</td><td class="i">mirin</td><td class="p"></td></tr>
    <tr class="t1"><td class="a">4 tbsp</td><td class="i">starch</td><td class="p"></td><td class="f"></td></tr>
  </tbody>
</table>
```

Chip (flow diagram links, Needs / Makes line, carried-over rows): `<a class="chip" href="#o2" style="--g: var(--c3)">2 Wrap and chill</a>`, at least 24 px tall.

Flow diagram nodes (SVG, see the examples for the full file): `<a class="node" href="#o1" style="--g: var(--c1)"><rect class="bg" …/><rect class="bar" …/><text …>1 Name</text></a>`. Rect width ≈ 7.5 px per character at 13 px, plus 24. Wires are `<path class="wire" d="…" marker-end="url(#arrow)"/>`, rows 36 px apart, chips 28 px tall.

## Rules

- The grid must be correct before it is pretty. Run the checker; do not trust the eye.
- Keep step text short: action word, then time and cue. No paragraphs inside cells, except in tooltips.
- Do not add steps the recipe does not have. Mark estimates ("my estimate") in a note card, never silently.
- Note cards (servings and batches, storage, substitutions) are optional, three at most.
- Not part of this skill: dates, calories, macros.
- Public examples use invented, generic content only.
