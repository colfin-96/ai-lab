---
name: obsidian-note-processor
description: |
  Process unsorted notes captured on phone. Reads files from New Unsorted Notes folder, applies spell-check, routes to destination (append to existing note or create new), prepends a #new-capture task above each filed note, and logs results. Unmatched or nonsense notes are left untouched in the folder and logged. Use when you have captured quick voice/text notes on your phone that Obsidian synced to the unsorted folder and you want to organize them into your vault structure. Triggered by "process unsorted notes", "organize captured notes", "file my notes", "process captured notes", or mentions of organizing the unsorted notes folder.
compatibility:
  - tools: Read, Write, Edit, Bash
  - requires: Obsidian vault at ~/Library/CloudStorage/OneDrive-Personal/Obsidian/Personal (OneDrive)/
---

## Overview

This skill processes notes captured on your phone (in `New Unsorted Notes/` folder) and files them into the vault:

1. **Spell-check** — light pass (typos, capitalization)
2. **Route** — match against context map, LLM fallback
3. **File** — prepend `#new-capture` task + content, append to existing note or create new
4. **Delete** — remove original from `New Unsorted Notes/`
5. **Log** — markdown table of what moved where, unsorted notes listed separately

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

**Example log:**

```markdown
# Processing Log — 2026-06-18

**Runs today**: 2 | **Total processed**: 4 | **Unsorted**: 1

## Run 1 (14:30)

Processed 3 notes. 1 left unsorted.

| Note          | Destination               | Action | Status | Details                            |
| ------------- | ------------------------- | ------ | ------ | ---------------------------------- |
| Untitled.md   | [[Project Ideas]]         | append | ✓      | App idea appended to ### App Ideas |
| Untitled 2.md | [[Schreinerei D. Stefan]] | append | ✓      | Appended to ## Notes section       |
| Untitled 1.md | —                         | unsorted | ⚠️   | Could not reliably route — left in New Unsorted Notes |

## Run 2 (17:45)

Processed 1 note.

| Note          | Destination       | Action | Status | Details           |
| ------------- | ----------------- | ------ | ------ | ----------------- |
| Untitled 3.md | [[Project Ideas]] | append | ✓      | App idea appended |
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

### Routing Logic

1. Read context map from `routing-context.md`
2. For each unsorted note:
   a. Spell-check
   b. Try keyword matching against routes (case-insensitive)
   c. If match found (confidence high) → prepend task + file to destination → delete original → log ✓
   d. If no match or low confidence → leave in `New Unsorted Notes/` → log ⚠️ with reason
3. Write log

**No interactive prompts.** Anything the skill can't route stays in the folder for manual review.

### File Cleanup

After skill run:

- **Processed notes**: original deleted from `New Unsorted Notes/` (content lives at destination)
- **Unsorted notes**: stay in `New Unsorted Notes/` untouched, logged with reason

### Unsorted / Skip Handling

**Unsorted** (no keyword match, low LLM confidence, or nonsense/malformed content):

- Leave file exactly as-is in `New Unsorted Notes/`
- Log with reason: e.g. "Could not reliably route", "Incomplete capture", "Unreadable"
- Do NOT modify, do NOT add task marker

### Error Handling

- **Routing ambiguous**: treat as unsorted, leave + log
- **Destination file missing**: create new note at that path (with proper frontmatter)
- **Malformed note**: flag as unsorted, leave + log
- **Context map missing**: halt and tell user to create `routing-context.md`

## Examples

### Example 1: Simple append

**Input note:**

```
i was thinking about creating an app for my watch that vibrates to tell the time
```

**Processing:**

- Spell-check: "I was thinking about creating an app for my watch that vibrates to tell the time"
- Route: keywords ["idea", "app", "feature"] → matches "Project ideas" → Action: `append`
- Prepend task + append to `Project Ideas.md` under `### App Ideas`:
  ```
  - [ ] #new-capture "I was thinking about creating an app for my watch that vibr..."
  - I was thinking about creating an app for my watch that vibrates to tell the time
  ```
- Delete original from `New Unsorted Notes/`
- Log: `| Untitled.md | [[Project Ideas]] | append | ✓ | Appended to ### App Ideas |`

### Example 2: Unsorted note

**Input note:**

```
asdfjkl maybe something idk
```

**Processing:**

- No keyword match, LLM confidence low
- Leave in `New Unsorted Notes/` untouched
- Log: `| Untitled 1.md | — | unsorted | ⚠️ | Could not reliably route — left in New Unsorted Notes |`

### Example 3: New note

**Input note:**

```
Stefan said kitchen will be delayed two weeks
```

**Processing:**

- Spell-check: no changes needed
- Route: keywords ["Stefan"] → matches "Stefan (Colfin client)" → Action: `append`, Format: `bullet`
- Prepend task + append to `01 Atlas/Colfin Studio/Kunden/Schreinerei D. Stefan.md` under `## Notes`:
  ```
  - [ ] #new-capture "Stefan said kitchen will be delayed two weeks"
  - Stefan said kitchen will be delayed two weeks
  ```
- Delete original
- Log: `| Untitled 2.md | [[Schreinerei D. Stefan]] | append | ✓ | Appended to ## Notes |`

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
