# ai-lab

Private sandbox for AI-related experiments, skills, prompts, and tooling. Not a single product — a collection. Finished, publishable work moves to the public `ai-skills` repo.

## Structure

| Path | Contents |
|------|----------|
| `skills/` | Claude Code slash command skills (`.claude/skills/` format). Copy or reference from here into projects. |
| `prompts/` | Reusable prompt templates — system prompts, user prompts, chains. |
| `agents/` | Agent definitions, configs, and orchestration scripts. |
| `obsidian/templates/` | Obsidian note templates. |
| `obsidian/rules/` | Obsidian automation rules (Templater, QuickAdd, etc.). |
| `obsidian/settings/` | Vault config snapshots (`.obsidian/` exports). |
| `docs/` | Research notes, how-tos, decision records. |
| `scratch/` | Throwaway experiments. Ignore contents. |

## Conventions

- Skills follow Claude Code skill format: `skills/<name>/SKILL.md` as entrypoint.
- Prompts use frontmatter for metadata (model, purpose, tags).
- No single owner per folder — dump first, organize later.
- Colfin Studio-specific items live here permanently (never published).
