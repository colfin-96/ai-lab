---
name: obsidian-note-processor
description: |
  Process unsorted notes captured on phone. Reads files from New Unsorted Notes folder, applies spell-check, routes to destination (append to existing note or create new), and logs results. Use when you have captured quick voice/text notes on your phone that Obsidian synced to the unsorted folder and you want to organize them into your vault structure with minimal effort. Triggered by "process unsorted notes", "organize captured notes", "file my notes", "process captured notes", or mentions of organizing the unsorted notes folder.
compatibility:
  - tools: Read, Write, Edit, Bash
  - requires: Obsidian vault at ~/Library/CloudStorage/OneDrive-Personal/Obsidian/Personal (OneDrive)/
---

## Overview

This skill processes notes captured on your phone (in `New Unsorted Notes/` folder) and files them into the vault:

1. **Spell-check** — quick pass (typos, capitalization)
2. **Route** — match against context map (you maintain), with LLM fallback
3. **File** — move + organize, append to existing note, or create new
4. **Log** — markdown table of what moved where

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
- **Action**: `append` (add to existing note) or `new` (create new note in 03 Effort/)
- **Format**: `bullet` (add as `- `), `raw` (append text as-is), `timestamp_bullet` (timestamp + bullet)

If a note doesn't match any keywords, skill will ask you to classify it interactively.

## Workflow

1. Review `New Unsorted Notes/` folder — any notes there?
2. Invoke skill: "process unsorted notes"
3. Skill reads each file, spell-checks, routes via context map
4. For unmatched notes, skill asks you: "Where should this go?"
5. Files move to destination; log saved as `Processing-Log-YYYYMMDD.md`

## Output

### Log Format

One log file per day: `01 Atlas/Note Processing Logs/Processing-Log-YYYYMMDD.md`

Each run appends a new timestamped section with its own results table.

**Example log (multiple runs same day):**

```markdown
# Processing Log — 2026-06-18

**Runs today**: 2 | **Total processed**: 4 | **Pending**: 1

## Run 1 (14:30)

Processed 3 notes.

| Note          | Destination               | Action | Status | Details                            |
| ------------- | ------------------------- | ------ | ------ | ---------------------------------- |
| Untitled.md   | [[Project Ideas]]         | append | ✓      | App idea appended to ### App Ideas |
| Untitled 1.md | —                         | ask    | ❓     | Fragment, needs clarification      |
| Untitled 2.md | [[Schreinerei D. Stefan]] | append | ✓      | Appended to ## Notes section       |

## Run 2 (17:45)

Processed 1 note, 1 ask resolved, 1 skip.

| Note          | Destination       | Action   | Status | Details                                                                                      |
| ------------- | ----------------- | -------- | ------ | -------------------------------------------------------------------------------------------- |
| Untitled 3.md | [[Project Ideas]] | append   | ✓      | App idea appended                                                                            |
| Untitled 4.md | [[Work MOC]]      | ask→file | ✓      | Work note, user classified as Work, filed                                                    |
| Untitled 5.md | —                 | skip     | ⚠️     | [Untitled 5.md](../../../New Unsorted Notes/Untitled 5.md) — truncated, manual review needed |
```

**Ask note format:** Skill asks user, user picks destination, note files, moved to Done Notes, logged as resolved.

**Skip note format:** Note stays in unsorted folder. Log links to it with flag so user can review manually later.

- **Run timestamp**: HH:MM in section header
- **Summary row**: count of processed/pending at top
- **Destination column**: uses wikilinks (`[[filename]]`)
- **Each run gets own table** for clarity

## Implementation Details

### Spell-check

Light pass only (30s max per note):

- Capitalize first letter of sentences
- Fix obvious typos (common misspellings, repeated chars like "hte" → "the")
- Trim leading/trailing whitespace
- Do NOT rewrite for style or grammar depth

### Auto-titling

For new notes, extract first sentence or phrase (max 60 chars):

- "i was thinking about creating an app" → "App for watch vibration" (or use user's phrasing)
- Use note's own words where possible

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
   c. If match found (confidence high) → file to destination (process complete)
   d. If no match or low confidence → **ask user**:
   - Show 3 best-match destination suggestions (ranked by keyword relevance to note content)
   - User picks one, OR enters "create new route"
   - If new route: user specifies keywords + destination
   - File note to user's chosen destination
     e. Log result

**Ask workflow**: Interactive during skill run. Resolved before logging.

**Skip workflow**: Malformed/truncated notes stay in `New Unsorted Notes/` (not moved). Logged with links for manual review.

### Logging on Multiple Runs

Same-day reruns append to the existing log:

1. Check if `Processing-Log-YYYYMMDD.md` exists
2. If exists: append new `## Run N (HH:MM)` section with results
3. If new day: create fresh log file
4. Update summary counts at top: "Runs today: X | Total processed: Y | Ask: Z | Skipped: W"

### File Cleanup

After skill run:

- **Processed notes**: move to `Daily Notes/Done Notes/` (filed, done)
- **Ask notes**: move to `Daily Notes/Done Notes/` after user classifies + files them
- **Skip notes**: stay in `New Unsorted Notes/` (for manual review). Log links to them.
- Update/append log with run results

### Ask / Skip Handling

**Ask** (no keyword match):

- Show 3 best-match suggestions from `routing-context.md` (by keyword relevance)
- User picks destination or creates new route
- File note immediately
- Log result + move to Done Notes

**Skip** (malformed/truncated):

- Identify: incomplete capture, garbage text, unreadable
- Leave in `New Unsorted Notes/`
- Log with link + flag for manual review
- Do NOT move

### Error Handling

- **Routing ambiguous**: ask user for clarification
- **Destination file missing**: create new note at that path (with proper frontmatter: `#work` or `#personal` tags)
- **Malformed note**: flag as skip, leave in unsorted, log with link
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
- Append to `Project Ideas.md` under `### App Ideas` section as bullet
- Log entry: `| Untitled.md | [[Project Ideas]] | append | ✓ | App idea appended to ### App Ideas section |`

### Example 2: Create new

**Input note:**

```
Stefan said kitchen will be delayed two weeks
```

**Processing:**

- Spell-check: "Stefan said kitchen will be delayed two weeks"
- Route: keywords ["Stefan"] → matches "Stefan (Colfin client)" → Action: `append`, Format: `bullet`
- Append to `01 Atlas/Colfin Studio/Kunden/Schreinerei D. Stefan.md` under `## Notes` section as bullet
- Log entry: `| Untitled 1.md | [[Schreinerei D. Stefan]] | append | ✓ | Appended as bullet to ## Notes section |`

---

## How to Use

### Setup (one-time)

1. Create `routing-context.md` in vault root:
   - Copy the template above
   - Adjust routes to match your vault structure
   - Add keywords for patterns you notice in your captures

2. Test on a few notes first — refine routes based on results

### Routine

1. Capture notes on phone (Obsidian widget syncs to `New Unsorted Notes/`)
2. When ready: "process unsorted notes"
3. Review log and any interactive prompts
4. Adjust context map if new patterns emerge

### Iterate

- Add new routes to `routing-context.md` as you discover capture patterns
- Skill learns from your feedback in interactive prompts
