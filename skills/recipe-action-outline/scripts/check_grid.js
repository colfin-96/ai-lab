#!/usr/bin/env node
// Checks that the rowspan/colspan arithmetic of an action-outline table adds up.
// Usage: node check_grid.js recipe.html
// Exit 0 and "OK ..." when every row of <tbody> fills the same number of columns
// with no overlapping cells and no rowspan running past the last row.
const fs = require('fs');

const file = process.argv[2];
if (!file) {
  console.error('Usage: node check_grid.js recipe.html');
  process.exit(2);
}
const html = fs.readFileSync(file, 'utf8');

const theadMatch = html.match(/<thead[\s\S]*?<\/thead>/i);
const tbodyMatch = html.match(/<tbody[\s\S]*?<\/tbody>/i);
const body = tbodyMatch ? tbodyMatch[0] : html;
const rows = [...body.matchAll(/<tr\b[\s\S]*?<\/tr>/gi)].map((m) => m[0]);

const attr = (attrs, name) => {
  const m = attrs.match(new RegExp(name + '\\s*=\\s*"?(\\d+)', 'i'));
  return m ? Number(m[1]) : 1;
};

const occupied = [];
const problems = [];

rows.forEach((tr, r) => {
  occupied[r] = occupied[r] || new Set();
  let col = 0;
  for (const m of tr.matchAll(/<t[dh]\b([^>]*)>/gi)) {
    const rowspan = attr(m[1], 'rowspan');
    const colspan = attr(m[1], 'colspan');
    while (occupied[r].has(col)) col++;
    if (r + rowspan > rows.length) {
      problems.push(`row ${r + 1}: rowspan ${rowspan} at column ${col + 1} runs past the last row (${rows.length})`);
    }
    for (let dr = 0; dr < rowspan; dr++) {
      occupied[r + dr] = occupied[r + dr] || new Set();
      for (let dc = 0; dc < colspan; dc++) {
        if (occupied[r + dr].has(col + dc)) {
          problems.push(`row ${r + 1}: a cell overlaps another at column ${col + dc + 1}`);
        }
        occupied[r + dr].add(col + dc);
      }
    }
    col += colspan;
  }
});

let width = 0;
if (theadMatch) {
  width = [...theadMatch[0].matchAll(/<t[dh]\b([^>]*)>/gi)].reduce((n, m) => n + attr(m[1], 'colspan'), 0);
}
if (!width) {
  width = Math.max(0, ...occupied.slice(0, rows.length).map((s) => Math.max(-1, ...s) + 1));
}

for (let r = 0; r < rows.length; r++) {
  const used = occupied[r] ? occupied[r].size : 0;
  if (used !== width) {
    const missing = [];
    for (let c = 0; c < width; c++) if (!occupied[r] || !occupied[r].has(c)) missing.push(c + 1);
    problems.push(`row ${r + 1}: fills ${used} of ${width} columns` + (missing.length ? ` (empty at column ${missing.join(', ')})` : ''));
  }
}

if (problems.length) {
  console.error('PROBLEMS:\n- ' + problems.join('\n- '));
  process.exit(1);
}
console.log(`OK: ${rows.length} rows x ${width} columns`);
