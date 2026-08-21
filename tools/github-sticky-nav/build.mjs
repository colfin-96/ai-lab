#!/usr/bin/env node
/* Generates githubstickynav.user.js from the extension sources.
 *
 * The extension folder is the single source of truth: sticky-nav.css and
 * sticky-nav.js are real, separately editable files, and the userscript is a
 * mechanical assembly of them — the CSS inlined into a template literal, the
 * behaviour appended verbatim, both behind the metadata block from
 * userscript-header.txt. Generation only ever runs in that direction, because
 * inlining is trivial and un-inlining is not.
 *
 *   node build.mjs           write githubstickynav.user.js
 *   node build.mjs --check   verify the committed file matches a fresh build
 *
 * Zero dependencies, no package.json, nothing to install.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const file = (...p) => join(here, ...p);

const HEADER = file('userscript-header.txt');
const MANIFEST = file('extension', 'manifest.json');
const CSS = file('extension', 'sticky-nav.css');
const JS = file('extension', 'sticky-nav.js');
const OUT = file('githubstickynav.user.js');

const read = (path) => readFileSync(path, 'utf8');

/* ---------------- metadata block ---------------- */

// @match lines are generated from the manifest so the extension and the
// userscript can never disagree about which hosts they cover. The padding
// matches the rest of the metadata block.
const matchLines = (matches) => matches.map((m) => `// @match        ${m}`).join('\n');

const buildHeader = (manifest) => {
  let header = read(HEADER);

  const matches = manifest.content_scripts?.[0]?.matches;
  if (!Array.isArray(matches) || matches.length === 0) {
    throw new Error('manifest.json: content_scripts[0].matches is missing or empty');
  }
  if (!manifest.version) throw new Error('manifest.json: version is missing');

  for (const token of ['{{version}}', '{{matches}}']) {
    if (!header.includes(token)) {
      throw new Error(`userscript-header.txt: ${token} placeholder is missing`);
    }
  }

  header = header.replaceAll('{{version}}', manifest.version);
  header = header.replaceAll('{{matches}}', matchLines(matches));
  // The blank line between the metadata block and the body comes from the
  // join below, so the template's own trailing newline would double it.
  return header.replace(/\n+$/, '');
};

/* ---------------- assembly ---------------- */

// The CSS is emitted inside a template literal, so anything that would end it
// early has to be escaped. There is nothing to escape today; this keeps a
// stray backtick in a future stylesheet from silently producing a broken file.
const forTemplateLiteral = (css) => css.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');

const build = () => {
  const manifest = JSON.parse(read(MANIFEST));

  return [
    buildHeader(manifest),
    '',
    "/* ---- styles (identical to the extension's sticky-nav.css) ---------------- */",
    '(() => {',
    "  'use strict';",
    '  const CSS = `',
    forTemplateLiteral(read(CSS)) + '`;',
    "  const style = document.createElement('style');",
    "  style.id = 'ghsn-styles';",
    '  style.textContent = CSS;',
    '  // document.head may not exist yet at document-start.',
    '  (document.head || document.documentElement).appendChild(style);',
    '})();',
    '',
    "/* ---- behaviour (identical to the extension's sticky-nav.js) ------------- */",
    read(JS),
  ].join('\n');
};

/* ---------------- entry point ---------------- */

let built;
try {
  built = build();
} catch (err) {
  // These are all "you edited a source file wrong" mistakes, so report them as
  // a plain message rather than a stack trace.
  console.error(`build failed: ${err.message}`);
  process.exit(1);
}

if (process.argv.includes('--check')) {
  const committed = read(OUT);
  if (committed === built) {
    console.log('githubstickynav.user.js is up to date.');
  } else {
    console.error('githubstickynav.user.js is out of date — run: node build.mjs');
    process.exitCode = 1;
  }
} else {
  writeFileSync(OUT, built);
  console.log(`Wrote githubstickynav.user.js (${built.length} bytes).`);
}
