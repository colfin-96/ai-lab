---
name: obsidian-note-processor
version: 3
model: claude-haiku-4-5-20251001
description: |
  v3 — Process unsorted notes captured on phone. Splits each file into blocks (blank-line-separated), routes each block independently to destination (append to existing note or create new), prepends a #new-capture task above each filed block, rewrites original with only unrouted blocks remaining (deletes if all routed), and logs results with one row per block. Triggered by "process unsorted notes", "organize captured notes", "file my notes", "process captured notes", or mentions of organizing the unsorted notes folder.
compatibility:
  - tools: Read, Write, Edit, Bash
  - requires: Obsidian vault at ~/Library/CloudStorage/OneDrive-Personal/Obsidian/Personal (OneDrive)/
---

## Overview

Process notes in `New Unsorted Notes/`:

1. **Split** — split each file into blocks (blank-line-separated)
2. **Spell-check** — light pass per block (typos, capitalization)
3. **Route** — keyword match against `routing-context.md`, LLM fallback
4. **File** — prepend `#new-capture` task + content, append to destination or create new
5. **Clean** — remove routed blocks from original; delete original if all blocks routed
6. **Log** — markdown table, one row per block

## Prerequisites

Context map at vault root: `routing-context.md`. Halt and tell user to create it if missing.

### Context Map Format

```markdown
# Routing Context

## Personal

| Name          | Keywords               | Destination      | Action | Format |
| ------------- | ---------------------- | ---------------- | ------ | ------ |
| Project ideas | idea, feature, app     | Project Ideas.md | append | bullet |
| Tidy Life     | tidy, house, clean     | Tidy Life.md     | append | bullet |
```

Columns: **Name** (label), **Keywords** (comma-sep, case-insensitive, ANY match wins), **Destination** (vault-relative path), **Action** (`append`/`new`), **Format** (`bullet`/`raw`/`timestamp_bullet`).

## Task Marker

Every successfully filed block gets a task prepended:

```
- [ ] #new-capture "First 60 chars of spell-checked content..."
```

For `append`: task line immediately before the appended content.
For `new`: task is the first line of the new file.

## Output

Log: `01 Atlas/Note Processing Logs/Processing-Log-YYYYMMDD.md` — one file per day, append each run.

**Destination column**: relative markdown link (not wikilink). Log lives at `01 Atlas/Note Processing Logs/`.
- Vault-root file: `[Name](../../File%20Name.md)`
- `01 Atlas/` subdir: `[Name](../Subdir/File%20Name.md)`

Encode spaces as `%20`. Never use `[[wikilinks]]`.

**Log format:**

```markdown
# Processing Log — YYYY-MM-DD

**Runs today**: 1 | **Total blocks processed**: 3 | **Blocks unsorted**: 1 | **Files deleted**: 1 | **Files kept**: 1

## Run 1 (14:30)

Processed 2 files → 3 blocks. 1 block unsorted. 1 file kept.

| File          | Block # | Block preview (60 chars)       | Destination                               | Action | Status | Details                    |
| ------------- | ------- | ------------------------------ | ----------------------------------------- | ------ | ------ | -------------------------- |
| Untitled.md   | 1       | I was thinking about an app... | [Project Ideas](../../Project%20Ideas.md) | append | ✓      | Appended to ### Ideas      |
| Untitled 2.md | 1       | picked up milk, return book... | [Tidy Life](../../Tidy%20Life.md)         | append | ~      | Semantic guess (no keyword) |
```

## Implementation Details

### Spell-check

- Capitalize first letter of sentences
- Fix obvious typos (repeated chars, common misspellings)
- Trim whitespace
- Do NOT rewrite for style or grammar

### Block Splitting

- Delimiter: one or more blank lines (2+ consecutive newlines)
- Trim leading/trailing whitespace per block
- Discard whitespace-only blocks
- No blank lines in file = one block

### Routing Logic

1. Read `routing-context.md`
2. For each file: split → for each block:
   - Spell-check
   - **Keyword match** (case-insensitive): scan block text against all routes; if ANY keyword matches, use that route. If multiple routes match, use the first match in the context map. → log `✓`
   - **No keyword match → semantic fallback**: reason about the block's topic and pick the best-fitting route from the context map.
     - Confidence ≥70% → file to that route + log `~` (semantic guess, worth reviewing)
     - Confidence <70% → unsorted + log `⚠️`
3. After all blocks: all routed → delete original; any unrouted → rewrite original with only unrouted blocks (joined by blank lines)
4. Write log

No interactive prompts. Unrouted blocks stay for manual review.

### Append Position

1. File has `## Quick captures` or `## Notes` → append there
2. File has `## Action Items` and content is action-like → append there
3. Otherwise → append to end of file before any metadata

### Append Formats

- **bullet**: `- [content]`
- **raw**: `[content]`
- **timestamp_bullet**: `- YYYY-MM-DD — [content]`

### Auto-titling (action: `new`)

Extract first sentence or phrase, max 60 chars, using note's own words.

### Error Handling

- Ambiguous routing → unsorted, leave + log
- Destination file missing → create at that path with frontmatter
- Malformed note → unsorted, leave + log
- Context map missing → halt, tell user to create `routing-context.md`
