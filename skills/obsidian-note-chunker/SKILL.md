---
name: obsidian-note-chunker
description: |
  Chunk unstructured pasted text into logical semantic pieces and interactively file each into your Obsidian vault. Reads vault MoC/SubMoC structure to suggest placement, presents one chunk at a time for approve/override, auto-names files, and logs all decisions.
  Use when: "chunk this text into my vault", "file these notes", "organize my brain dump into Obsidian", "I pasted a block of text to file", "break this into vault notes", "process captured thoughts".
  Do NOT use for: processing existing .md files (use obsidian-note-processor), restructuring vault folders, or bulk imports.
  Cross-references: obsidian-note-processor.
compatibility:
  tools: [Read, Write, Bash]
  requires: Obsidian vault path in CLAUDE.md (obsidian_vault_path key)
---

## Overview

Converts unstructured text into organized vault notes through an interactive chunking → placement → approval workflow.

**Input**: Pasted text block  
**Output**: Filed notes in vault + processing log  
**Interaction**: One chunk at a time; user approves location or suggests alternative

## When to Use This vs obsidian-note-processor

- **This skill**: You have raw pasted text to chunk + file interactively
- **obsidian-note-processor**: You have existing capture files in an inbox folder to batch process

## Setup: Vault Path

Requires `obsidian_vault_path` in project's CLAUDE.md. Example:

```yaml
obsidian_vault_path: /Users/yourname/Obsidian/MyVault
```

If missing, request user adds it before proceeding.

## Workflow

### Step 1: Accept Input & Validate Vault

1. Ask user to paste text block to process
2. Read CLAUDE.md for `obsidian_vault_path`
3. If missing, halt and request user to add it
4. Verify vault path exists and is readable

### Step 2: Analyze Vault Structure

Scan vault for Maps of Contents (MoCs) and Sub-MoCs to understand placement hierarchy:
- Find all files ending in `MOC.md` or containing "MOC" in name (case-insensitive)
- Read each to understand vault structure and topic organization
- Extract relationships: which topics connect, what subtopics exist

This context informs placement suggestions later.

### Step 3: Chunk Text into Logical Pieces

Split input text into semantic chunks (not fixed size):
- Identify topic/idea boundaries
- Example: "AABCDA" → chunks "AAA" (related A's), "B", "C", "D"
- Group related content together
- Preserve meaning within each chunk

Create internal list: `[chunk_1, chunk_2, chunk_3, ...]`

### Step 4: Present & Approve Chunks (One at a Time)

For each chunk:

1. **Show chunk content** (quoted block or formatted)
2. **Suggest placement** based on vault structure:
   - Format: `📍 Suggested: Path/To/SubTopic.md`
   - Use MoC/SubMoC structure to pick most relevant location
3. **Ask for approval**:
   ```
   Accept suggested location?
   - Type "yes" or the path (e.g., "yes" or "Path/To/SubTopic.md")
   - Type "no" to suggest alternative (e.g., "no, I'd prefer Different/Path/Topic.md")
   ```

4. **Handle response**:
   - If yes/approved: move to Step 5 (file it)
   - If no + user provides alternative: use that path, move to Step 5
   - If user says discard: skip this chunk, move to next

### Step 5: Auto-File Approved Chunks

1. Generate filename from chunk content:
   - Extract first 3–5 words or key topic
   - Format: `YYYY-MM-DD_keyword-keyword.md`
   - Example: `2025-06-24_obsidian-note-chunker-workflow.md`

2. Write to vault at approved location (or user-suggested override)

3. Log filing (see Step 7)

### Step 6: Offer Post-Processing

After filing, ask if user wants to post-process this note:
- **Summarize**: Convert to paragraph or bullet points? (ask which)
- **Adjust**: Reword, clarify, reformat? (brief description of changes)
- **Translate**: To German? (only if user explicitly requests; never auto-translate)

Apply changes if requested; re-save note. Update log.

### Step 7: Processing Log

Create a processing log file with structure like `obsidian-note-processor`:

**Location**: `{vault_path}/_processing-logs/note-chunker-YYYYMMDD.log.md`

**Format**:

```markdown
# Note Chunker Processing Log — 2025-06-24

## Summary
- Total chunks: 5
- Filed: 4
- Discarded: 1
- Time: 3m 12s

## Processed Chunks

### Chunk 1: [First 5 words of content...]
- Status: ✅ Filed
- Location: `PKM/Obsidian/Vault-Setup.md`
- Filename: `2025-06-24_vault-setup-tutorial.md`
- Post-processing: Summarized to bullets

### Chunk 2: [First 5 words...]
- Status: ❌ Discarded
- Reason: User rejected

### Chunk 3: [First 5 words...]
- Status: ✅ Filed (Alternative Location)
- Suggested: `PKM/Tools/Note-Taking.md`
- User Override: `Tools/Personal/Note-Experiments.md`
- Filename: `2025-06-24_note-experiments.md`
- Post-processing: Translated to German

## Notes
- [Any issues, patterns, or user feedback]
```

## Interaction Example

```
📍 Chunk 1 of 3: "The main idea is to have MOCs for each area of life."
📍 Suggested: PKM/Obsidian/Vault-Structure.md
Accept? (yes / no + alternative path):
```

User: `yes` → files with auto-name `2026-06-24_vault-structure.md`

User: `no, PKM/Organization/MOC-Hierarchy.md` → files at user-specified path

User: `discard` → skips chunk, moves to next

---

## Key Principles

1. **Semantic chunking**: Respect idea boundaries, not character/word count
2. **Vault-aware**: Read vault structure (MoCs) to make smart placement suggestions
3. **User override**: Suggestions are just that — user always has final say on location
4. **One at a time**: Present chunks sequentially so user isn't overwhelmed
5. **Log everything**: Transparent record of what was filed, rejected, modified, and where
6. **Optional post-processing**: Only if user asks — no forced edits
7. **Auto-naming**: Consistent timestamp + keywords for easy scanning

## Limitations & Notes

- Vault structure scanned once at start; if user modifies vault during session, re-scan not automatic
- File naming based on content; if multiple chunks have similar keywords, names may overlap slightly (user can rename after)
- Translation only EN ↔ DE; not available for other languages
- Post-processing applied immediately; changes are saved to vault
