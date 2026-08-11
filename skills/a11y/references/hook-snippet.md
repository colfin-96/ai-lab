# Optional: wiring the check to file writes

By default this skill triggers the way every skill does — the model decides from the description,
which means it fires on accessibility-shaped requests and at natural boundaries. That is the
recommended setup and it needs no configuration.

If you want something deterministic instead, a `PostToolUse` hook can nudge after every edit to a
frontend file. Read the trade-off first, because it is real.

## The trade-off

**What a hook buys you:** it fires every time, regardless of how the request was phrased or
whether the model judged it relevant. No missed edits.

**What it costs:** it fires *every* time. Renaming a CSS variable, adjusting a margin, fixing a
typo in a comment — each one gets an accessibility nudge. The predictable outcome is that the
nudge becomes wallpaper, and then the hook gets deleted along with the habit of thinking about
accessibility at all.

If you add the hook, keep the light-path behaviour: a single quick pass over the touched code,
silent when clean. A seven-member fan-out on every keystroke is how this ends up switched off.

The middle path most people actually want is no hook plus a habit: run `/a11y` before you push.

## The snippet

Add to `.claude/settings.json` in the project (or `settings.local.json` to keep it personal and
out of the repo). Merge into an existing `hooks` object rather than replacing it — a settings
file already carrying a `SessionStart` hook will lose it if you paste over the whole key.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "f=$(jq -r '.tool_input.file_path // empty'); case \"$f\" in *.html|*.component.ts|*.scss|*.css|*.vue|*.jsx|*.tsx) echo \"Frontend file changed: $f — run the a11y light check on this edit (single pass over the touched code, stay silent if clean).\" ;; esac"
          }
        ]
      }
    ]
  }
}
```

How it works: `matcher` filters on the **tool name**, not the file path, so the command itself
does the path filtering. Claude Code passes the tool call as JSON on stdin; `jq` pulls out
`file_path`, the `case` statement checks the extension, and anything echoed becomes context for
the model. Non-matching files produce no output and cost nothing.

Requires `jq` on `PATH` (`brew install jq`).

## Verify it before trusting it

Hook payload shapes and field names change between Claude Code versions, and a hook that silently
does nothing is indistinguishable from a codebase with no problems — the same false-comfort
failure this skill is built to avoid.

Test it deliberately: add the hook, edit a template with a genuine violation (an icon `<button>`
with no accessible name), and confirm you get the nudge. If nothing happens, check that `jq` is
installed and that the field is still `.tool_input.file_path` in your version — `echo` the raw
stdin to a file to see what you are actually being handed.

## Narrowing it

Sharper triggers, if the every-edit version proves too noisy:

- **Templates only** — drop `*.scss|*.css` from the `case` pattern. Most real violations live in
  markup, and stylesheet-only changes mostly touch contrast, which the full run catches better.
- **One directory** — match on a path fragment: `*/src/app/features/*.html`.
- **Pre-commit instead of per-edit** — move it to a git `pre-commit` hook running `/a11y` once per
  commit rather than once per file. Better signal-to-noise, and it lines up with where you would
  actually want to act on findings.

Whatever you wire up: **it must not block.** A hook that fails a commit on an accessibility
finding will be bypassed with `--no-verify` within a week, and you will have traded a real habit
for a ritual.
