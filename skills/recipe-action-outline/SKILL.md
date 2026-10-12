---
name: recipe-action-outline
description: Render a recipe as an "action outline", the Cooking for Engineers style table where ingredients run down the left and each cooking step is a column whose box spans the ingredients it uses. Use whenever the user asks to show, render, chart or lay out a recipe as an action outline, a recipe grid, a recipe chart or "that recipe table where steps span the ingredients", or hands over a recipe and wants a visual, scannable cooking layout. Output is an HTML artifact page (default) or an HTML table inside an Obsidian note.
---

# Recipe action outline

An action outline reads like a spreadsheet: ingredients down the left (amount, name, prep), one column per step going left to right, and each step's box stretched down every ingredient row it involves. Time runs left to right, so ingredients that join late have empty cells in the early columns, and parallel work (veg roasting while chicken bakes) sits in the same columns on different rows.

## Steps

1. **Get the recipe.** From text, a vault note, or a URL. Extract: servings, every ingredient with amount and prep (dice, mince), and the steps with times and temperatures. Never invent amounts: if the source has none, say so or mark them as estimates.
2. **Group ingredients into tracks.** A track is a set of ingredients that are cooked together (chicken and its marinade; veg and its seasoning; rice; sauce; toppings). Order the rows so that every step's ingredients are adjacent. Reorder freely, rows have no required order.
3. **Lay out the columns.** One column per sequential step. Parallel tracks share columns on different rows.
   - A step cell gets `rowspan` = number of ingredient rows it uses.
   - A long step gets `colspan` = number of columns it lasts (rice "Cook 12-15 min" spans two).
   - Steps that involve every ingredient (cool, pack, serve) go in the last columns with `rowspan` = all rows.
   - An ingredient that joins at step N gets empty filler cells for steps 1 to N-1 (`td.f`, with `colspan` where adjacent).
   - Put amount, ingredient and prep in three narrow columns, add the step text as a bold action word plus a short grey detail (time, temperature, doneness cue).
4. **Write the table** as HTML. Use `references/example.html` as the template: same markup, CSS tokens, light and dark mode, legend, notes cards. Colour by track, one colour per track, as tints via `color-mix()`.
5. **Check the span arithmetic. Always.** From the skill folder, every row must fill the same number of columns once spans from rows above are counted. Run:
   ```bash
   node scripts/check_grid.js recipe.html
   ```
   It prints `OK: N rows x W columns` or lists the rows that are short or overlapping. Fix and rerun until it passes.
6. **Deliver.**
   - Default: publish as an Artifact page (plain HTML page, title = recipe name, icon `recipe`). Wide table sits in an `overflow-x: auto` container so the page never scrolls sideways on a phone.
   - If the user wants it in Obsidian: put the same `<table>` (without the page CSS) into the recipe note. Obsidian renders HTML tables with `rowspan` in reading view. Keep the CSS minimal there.
7. **Offer** one follow-up: save the table into the recipe note, or adjust steps.

## Rules

- The grid must be correct before it is pretty. The checker output decides, not a visual guess.
- Keep step text short: action word, then time and cue. No paragraphs inside cells.
- Do not add steps the recipe does not have. Mark estimates ("my estimate") in a note card, never silently.
- Notes cards below the table (servings and batches, storage, substitutions) are optional, three at most.
- Dates, calories and macros: not part of this skill. If the user tracks calories in another app, do not add them.
