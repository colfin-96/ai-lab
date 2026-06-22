---
name: obsidian-note-processor
version: 2
description: |
  v2 — Process unsorted notes captured on phone. Splits each file into blocks (blank-line-separated), routes each block independently to destination (append to existing note or create new), prepends a #new-capture task above each filed block, rewrites original with only unrouted blocks remaining (deletes if all routed), and logs results with one row per block. Triggered by "process unsorted notes", "organize captured notes", "file my notes", "process captured notes", or mentions of organizing the unsorted notes folder.
compatibility:
  - tools: Read, Write, Edit, Bash
  - requires: Obsidian vault at ~/Library/CloudStorage/OneDrive-Personal/Obsidian/Personal (OneDrive)/
---

## Overview

This skill processes notes captured on your phone (in `New Unsorted Notes/` folder) and files them into the vault:

1. **Split** — split each file into blocks (separated by blank lines)
2. **Spell-check** — light pass per block (typos, capitalization)
3. **Route** — match each block against context map, LLM fallback
4. **File** — prepend `#new-capture` task + content, append to existing note or create new
5. **Clean** — remove routed blocks from original file; delete original entirely if all blocks routed
6. **Log** — markdown table with one row per block

## Prerequisites

Before running this skill, create a **context map** at the vault root: `routing-context.md` (format shown below). This tells the skill where notes should go.

### Context Map Format

Create `routing-context.md` with routing rules, organized by major blocks (Personal, Serviceware, Colfin). Template:

```markdown
# Routing Context

## Personal

| Name          | Keywords               | Destination      | Action | Format |
| ------------- | ---------------------- | ---------------- | ------ | ------ |
| Project ideas | idea, feature, product | Project Ideas.md | append | bullet |
| Tidy Life     | tidy, house, clean     | Tidy Life.md     | append | bullet |

## Serviceware

| Name       | Keywords                  | Destination               | Action | Format |
| ---------- | ------------------------- | ------------------------- | ------ | ------ |
| Work notes | work, meeting, refinement | 01 Atlas/Work/Work MOC.md | append | raw    |

## Colfin Studio

| Name         | Keywords                | Destination                          | Action | Format |
| ------------ | ----------------------- | ------------------------------------ | ------ | ------ |
| Colfin notes | colfin, client, website | 01 Atlas/Colfin Studio/Colfin MOC.md | append | raw    |
```

**Columns:**

- **Name**: short name for this rule (for logging)
- **Keywords**: comma-separated; if note text matches ANY keyword, use this route
- **Destination**: path relative to vault root
- **Action**: `append` (add to existing note) or `new` (create new note in `03 Effort/`)
- **Format**: `bullet` (add as `- `), `raw` (append text as-is), `timestamp_bullet` (timestamp + bullet)

If a note doesn't match any keyword and LLM routing confidence is low, it is left untouched in `New Unsorted Notes/` and logged.

## Workflow

1. Review `New Unsorted Notes/` folder — any notes there?
2. Invoke skill: "process unsorted notes"
3. Skill reads each file, spell-checks, routes via context map
4. Matched notes: prepend task + file to destination, delete original
5. Unmatched/nonsense notes: leave in folder, log with reason

## Task Marker

Every successfully filed note gets a task prepended above its content at the destination:

```
- [ ] #new-capture "I was thinking about creating an app for my watch..." 
```

The preview is the first ~60 characters of the spell-checked note content.

### Finding processed notes (Todos page filter)

Add this query block to your todos page to surface all unreviewed captures:

````markdown
```tasks
not done
tags include #new-capture
```
````

Mark the task done once you've reviewed the note.

## Output

### Log Format

One log file per day: `01 Atlas/Note Processing Logs/Processing-Log-YYYYMMDD.md`

Each run appends a new timestamped section with its own results table.

**Destination column**: always use the full vault-relative path from `routing-context.md` wrapped in `[[ ]]` (e.g. `[[01 Atlas/Work/Work MOC.md]]`). Never strip to filename-only — the wiki-link must resolve to the correct file even when duplicate names exist.

**Example log:**

```markdown
# Processing Log — 2026-06-18

**Runs today**: 2 | **Total blocks processed**: 6 | **Blocks unsorted**: 2 | **Files deleted**: 2 | **Files kept**: 1

## Run 1 (14:30)

Processed 3 files → 5 blocks. 2 blocks unsorted. 1 file kept (has unrouted blocks).

| File          | Block # | Block preview (60 chars)       | Destination                              | Action   | Status | Details                            |
| ------------- | ------- | ------------------------------ | ---------------------------------------- | -------- | ------ | ---------------------------------- |
| Untitled.md   | 1       | I was thinking about an app... | [[02 Areas/Personal/Project Ideas.md]]   | append   | ✓      | Appended to ### App Ideas          |
| Untitled 2.md | 1       | Stefan said kitchen delayed... | [[03 Effort/Schreinerei D. Stefan.md]]   | append   | ✓      | Appended to ## Notes               |
| Untitled 4.md | 1       | Colfin website header needs... | [[01 Atlas/Colfin Studio/Colfin MOC.md]] | append   | ✓      | Appended to ## Quick captures      |
| Untitled 4.md | 2       | good recipe chicken pasta...   | —                                        | unsorted | ⚠️    | Could not reliably route           |
| Untitled 4.md | 3       | PC setup drivers install...    | —                                        | unsorted | ⚠️    | Could not reliably route           |

Files deleted: Untitled.md, Untitled 2.md
Files kept (partial): Untitled 4.md
```

## Implementation Details

### Spell-check

Light pass only (30s max per note):

- Capitalize first letter of sentences
- Fix obvious typos (common misspellings, repeated chars like "hte" → "the")
- Trim leading/trailing whitespace
- Do NOT rewrite for style or grammar depth

### Auto-titling

For new notes (action: `new`), extract first sentence or phrase (max 60 chars):

- Use note's own words where possible

### Task Prepend

For `append` action — prepend task block immediately before the appended content:

```
- [ ] #new-capture "First 60 chars of note..."
- Spell-checked note content as bullet/raw/timestamp_bullet
```

For `new` action — task is the first line of the new file:

```
- [ ] #new-capture "First 60 chars of note..."

[rest of note content]
```

### Append Position

- If destination has `## Quick captures` or `## Notes` section → append there
- If destination has `## Action Items` → append there for action-like content
- Otherwise → append to end of file before any metadata

### Append Formats

- **bullet**: `- [spell-checked content]`
- **raw**: `[spell-checked content]` (no bullet, as-is)
- **timestamp_bullet**: `- 2026-06-18 — [content]`

### Block Splitting

Before routing, split each file into blocks:

- Delimiter: one or more blank lines (two or more consecutive newlines)
- Trim leading/trailing whitespace from each block
- Discard empty blocks (whitespace-only)
- A file with no blank lines = one block

### Routing Logic

1. Read context map from `routing-context.md`
2. For each unsorted file:
   a. Split into blocks
   b. For each block:
      - Spell-check
      - Try keyword matching against routes (case-insensitive)
      - If match found (confidence high) → prepend task + file to destination → log ✓
      - If no match or low confidence → log ⚠️ with reason
   c. After all blocks processed:
      - All blocks routed → delete original file
      - Any block unrouted → rewrite original file with only unrouted blocks remaining (joined by blank lines); routed blocks removed
3. Write log

**No interactive prompts.** Anything the skill can't route stays in the folder for manual review.

### File Cleanup

After skill run:

- **All blocks routed**: original deleted from `New Unsorted Notes/`
- **Partial match**: original rewritten with only unrouted blocks (routed blocks stripped out); blank lines preserved between remaining blocks

### Unsorted / Skip Handling

**Unsorted block** (no keyword match, low LLM confidence, or nonsense/malformed content):

- Do NOT modify original file
- Log block with reason: e.g. "Could not reliably route", "Incomplete capture", "Unreadable"
- Do NOT add task marker for this block

### Error Handling

- **Routing ambiguous**: treat as unsorted, leave + log
- **Destination file missing**: create new note at that path (with proper frontmatter)
- **Malformed note**: flag as unsorted, leave + log
- **Context map missing**: halt and tell user to create `routing-context.md`

## Examples

### Example 1: Single-block file

**Input (`Untitled.md`):**

```
i was thinking about creating an app for my watch that vibrates to tell the time
```

**Processing:**

- Split → 1 block
- Spell-check: "I was thinking about creating an app for my watch that vibrates to tell the time"
- Route: keywords ["idea", "app"] → matches "Project ideas" → Action: `append`
- Append to `Project Ideas.md` under `### App Ideas`:
  ```
  - [ ] #new-capture "I was thinking about creating an app for my watch that vibr..."
  - I was thinking about creating an app for my watch that vibrates to tell the time
  ```
- All blocks routed → delete original
- Log: `| Untitled.md | 1 | I was thinking about creating... | [[Project Ideas.md]] | append | ✓ | Appended to ### App Ideas |`

### Example 2: Multi-block file, partial match

**Input (`Untitled 4.md`):**

```
Colfin website needs new header image, ask designer

good recipe pasta with chicken breast and tomatoes tonight

PC setup remember to install GPU drivers after reset
```

**Processing:**

- Split → 3 blocks
- Block 1: route → "Colfin" keyword → [[Colfin MOC]] ✓
- Block 2: no keyword match, LLM low confidence → unsorted ⚠️
- Block 3: no keyword match, LLM low confidence → unsorted ⚠️
- Rewrite original: block 1 removed, blocks 2 + 3 remain (joined by blank line)
- Log rows: 3 (one per block)

### Example 3: Unsorted block

**Block content:**

```
asdfjkl maybe something idk
```

**Processing:**

- No keyword match, LLM confidence low → unsorted
- Log: `| Untitled 1.md | 1 | asdfjkl maybe something idk | — | unsorted | ⚠️ | Could not reliably route |`

---

## How to Use

### Setup (one-time)

1. Create `routing-context.md` in vault root:
   - Copy the template above
   - Adjust routes to match your vault structure
   - Add keywords for patterns you notice in your captures

2. Add the `#new-capture` filter to your todos page (see **Task Marker** section above)

3. Test on a few notes first — refine routes based on results

### Routine

1. Capture notes on phone (Obsidian widget syncs to `New Unsorted Notes/`)
2. When ready: "process unsorted notes"
3. Review log — check unsorted notes listed at bottom
4. On todos page: filter `#new-capture` shows all newly filed notes for review
5. Mark tasks done as you process each note

### Iterate

- Add new routes to `routing-context.md` as you discover capture patterns
- Review `New Unsorted Notes/` manually for anything the skill left behind
