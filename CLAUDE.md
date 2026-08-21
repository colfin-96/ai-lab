# ai-lab

**This repository is public** (`github.com/colfin-96/ai-lab`). Everything committed here is world-readable, and git history keeps it readable even after a later cleanup commit.

Sandbox for AI-related experiments, skills, prompts, and tooling. Not a single product — a collection. Finished, polished work also moves to the `ai-skills` repo.

## Structure

| Path | Contents |
|------|----------|
| `skills/` | Claude Code slash command skills (`.claude/skills/` format). Copy or reference from here into projects. |
| `prompts/` | Reusable prompt templates — system prompts, user prompts, chains. |
| `agents/` | Agent definitions, configs, and orchestration scripts. |
| `tools/` | Standalone utilities that aren't skills — browser extensions, userscripts, small scripts. One folder per tool, each with its own README. |
| `obsidian/templates/` | Obsidian note templates. |
| `obsidian/rules/` | Obsidian automation rules (Templater, QuickAdd, etc.). |
| `obsidian/settings/` | Vault config snapshots (`.obsidian/` exports). |
| `docs/` | Research notes, how-tos, decision records. |
| `scratch/` | Throwaway experiments. Ignore contents. |

## Conventions

- Skills follow Claude Code skill format: `skills/<name>/SKILL.md` as entrypoint.
- Prompts use frontmatter for metadata (model, purpose, tags).
- No single owner per folder — dump first, organize later.

## Public-Repo Rules

Everything in this repo is written for strangers to read. Before committing anything:

- **No employer, client, or project names**, and nothing that identifies them indirectly (internal tool names, team names, ticket IDs, internal URLs or hostnames).
- **No colleague names.** Use placeholders or invented names in examples.
- **No internal decisions, roadmaps, budgets, or licence terms.** Real meeting content becomes a fictional example that shows the same shape.
- **No personal data** beyond the repo owner's own public identity — no vault paths with private content, no addresses, no calendar or contact details.
- **No credentials of any kind** — API keys, tokens, cookies, session IDs. Even in an example, use an obvious dummy value.

Skills that process private input (Obsidian vaults, meeting notes, shopping data) are fine to publish; their *examples* must be synthetic. When a skill needs a real-world sample to make sense, invent one.

If real content lands in a commit anyway, note that scrubbing the working tree is not enough — the old commit stays readable via its SHA, including after a force-push. Tell the user, and let them decide between rewriting history and leaving it.

## Local Skills Setup

Skills in `skills/` aren't automatically available. To make them loadable as local skills:

**macOS / Linux:**
1. Create `.claude/skills/` directory (if it doesn't exist)
2. Symlink from project skills:
   ```bash
   ln -s ../../skills/<skillname> .claude/skills/<skillname>
   ```
3. Run `/reload-skills` in Claude Code

**Windows:**
1. Create `.claude/skills/` directory (if it doesn't exist)
2. Copy skills or create junction (requires admin):
   ```powershell
   # Option A: Copy
   Copy-Item skills\<skillname> -Destination .claude\skills\<skillname> -Recurse
   
   # Option B: Junction (admin required)
   cmd /c mklink /J ".claude\skills\<skillname>" "skills\<skillname>"
   ```
3. Run `/reload-skills` in Claude Code
