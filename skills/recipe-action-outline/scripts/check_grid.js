#!/usr/bin/env node
// Checks that the rowspan/colspan arithmetic of every action-outline table in a page adds up.
// Usage: node check_grid.js recipe.html
// Exit 0 and one "OK ..." line per table when every <tbody> row fills the same number of
// columns as the <thead> with no overlapping cells and no rowspan past the last row.
// Also fails on any <a href="#x"> whose target id is missing (flow strip and "from N" badges).
// Exit 1 and a list of "table N, row R: ..." problems otherwise.
const fs = require('fs');

const file = process.argv[2];
if (!file) {
  console.error('Usage: node check_grid.js recipe.html');
  process.exit(2);
}
const html = fs.readFileSync(file, 'utf8');

const attr = (attrs, name) => {
  const m = attrs.match(new RegExp(name + '\\s*=\\s*"?(\\d+)', 'i'));
  return m ? Number(m[1]) : 1;
};
const cells = (s) => [...s.matchAll(/<t[dh]\b([^>]*)>/gi)];

const ids = new Set([...html.matchAll(/\bid\s*=\s*"([^"]+)"/gi)].map((m) => m[1]));
const linkProblems = [...html.matchAll(/<a\b[^>]*\bhref\s*=\s*"#([^"]+)"/gi)]
  .filter((m) => !ids.has(m[1]))
  .map((m) => `link #${m[1]} has no element with that id`);

const tables = [...html.matchAll(/<table\b[\s\S]*?<\/table>/gi)].map((m) => m[0]);
if (!tables.length) {
  console.error('PROBLEMS:\n- no <table> found');
  process.exit(1);
}

const problems = [...linkProblems];
const summary = [];

tables.forEach((table, t) => {
  const label = `table ${t + 1}`;
  const thead = table.match(/<thead[\s\S]*?<\/thead>/i);
  const tbody = table.match(/<tbody[\s\S]*?<\/tbody>/i);
  const rows = [...(tbody ? tbody[0] : table).matchAll(/<tr\b[\s\S]*?<\/tr>/gi)].map((m) => m[0]);

  const occupied = [];
  rows.forEach((tr, r) => {
    occupied[r] = occupied[r] || new Set();
    let col = 0;
    for (const m of cells(tr)) {
      const rowspan = attr(m[1], 'rowspan');
      const colspan = attr(m[1], 'colspan');
      while (occupied[r].has(col)) col++;
      if (r + rowspan > rows.length) {
        problems.push(`${label}, row ${r + 1}: rowspan ${rowspan} at column ${col + 1} runs past the last row (${rows.length})`);
      }
      for (let dr = 0; dr < rowspan; dr++) {
        occupied[r + dr] = occupied[r + dr] || new Set();
        for (let dc = 0; dc < colspan; dc++) {
          if (occupied[r + dr].has(col + dc)) {
            problems.push(`${label}, row ${r + 1}: a cell overlaps another at column ${col + dc + 1}`);
          }
          occupied[r + dr].add(col + dc);
        }
      }
      col += colspan;
    }
  });

  let width = thead ? cells(thead[0]).reduce((n, m) => n + attr(m[1], 'colspan'), 0) : 0;
  if (!width) {
    width = Math.max(0, ...occupied.slice(0, rows.length).map((s) => Math.max(-1, ...s) + 1));
  }

  for (let r = 0; r < rows.length; r++) {
    const used = occupied[r] ? occupied[r].size : 0;
    if (used !== width) {
      const missing = [];
      for (let c = 0; c < width; c++) if (!occupied[r] || !occupied[r].has(c)) missing.push(c + 1);
      problems.push(`${label}, row ${r + 1}: fills ${used} of ${width} columns` + (missing.length ? ` (empty at column ${missing.join(', ')})` : ''));
    }
  }
  summary.push(`${label}: ${rows.length} rows x ${width} columns`);
});

if (problems.length) {
  console.error('PROBLEMS:\n- ' + problems.join('\n- '));
  process.exit(1);
}
console.log(`OK: ${tables.length} table(s)\n` + summary.join('\n'));
