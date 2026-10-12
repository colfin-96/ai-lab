#!/usr/bin/env node
// Wraps a recipe body fragment into a complete, self-contained HTML page and checks it.
// Usage: node build_page.js body.html out.html
//   body.html  the <main class="page"> ... </main> fragment (headings, flow diagram, tables, notes)
//   out.html   the finished page: charset, viewport, <title> from the first <h1>, fonts,
//              and assets/outline.css inlined in a <style> block
// After writing, runs check_grid.js on out.html and exits with its status.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const [bodyFile, outFile] = process.argv.slice(2);
if (!bodyFile || !outFile) {
  console.error('Usage: node build_page.js body.html out.html');
  process.exit(2);
}

const root = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'assets', 'outline.css'), 'utf8');
const body = fs.readFileSync(bodyFile, 'utf8');

const h1 = body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
const title = (h1 ? h1[1].replace(/<[^>]+>/g, '') : 'Recipe').trim();

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=DM+Mono:wght@400;500&display=swap">
<style>
${css}</style>
</head>
<body>
${body}</body>
</html>
`;
fs.writeFileSync(outFile, page);
console.log(`wrote ${outFile} (${title})`);

const check = spawnSync(process.execPath, [path.join(__dirname, 'check_grid.js'), outFile], { stdio: 'inherit' });
process.exit(check.status === null ? 1 : check.status);
