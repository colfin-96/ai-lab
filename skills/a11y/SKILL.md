---
name: a11y
description: >-
  Audit and fix frontend code against WCAG 2.2 Level A + AA — the accessibility
  conformance target for most web software. Runs the template linter first, then
  dispatches specialist checkers over the parts a linter is blind to: ARIA and
  semantics, keyboard and focus order, colour contrast and target size, form
  labels and error handling, live regions and status messages, media
  alternatives, and cross-file consistency. Findings land in a per-repo ledger
  with stable IDs, so `/a11y fix F-03` applies a fix and then explains how to
  test it by hand. Use this whenever accessibility, a11y, WCAG, ARIA, screen
  readers, keyboard navigation, focus order, colour contrast, alt text, form
  labels, or BITV/BFSG/EN 301 549/Section 508 conformance come up — and also
  when the user is writing or reviewing Angular templates, HTML, or CSS and asks
  whether it is accessible, even if they never say the word "accessibility".
  Reach for it at feature and commit boundaries ("does this look right before I
  push?", "review my template changes"), not on every keystroke. Primary target
  is Angular plus plain HTML/CSS, and the criteria themselves are
  framework-agnostic.
argument-hint: "[nothing = working diff | init | fix <ids|all> | verify [ids] | <path|component|PR|url>]"
---

# a11y — WCAG 2.2 A + AA

Conformance target: **WCAG 2.2 Level A and AA**, 55 criteria, mapped in
`references/wcag-22.md`. Level A is included because AA conformance requires it.

Accessibility work fails in two opposite ways, and this skill is shaped to avoid both. It
fails by *noise* — an audit that reports forty theoretical issues on a three-line diff, which
teaches the developer to stop reading. And it fails by *false comfort* — a clean report from a
linter that never ran, or a checker that skipped a criterion nobody owned. So: check what the
diff actually touches, prove the coverage, and say plainly what was not looked at.

## Dispatch

Resolve the argument first. Members are matched before paths, so `/a11y keyboard-focus` runs
one member rather than looking for a folder by that name.

| Argument | Action |
|---|---|
| *(none)* | Audit the working diff against the default branch |
| `init` | Profile the repo → `playbooks/init.md` |
| `fix <ids…>` or `fix all` | Apply fixes + manual test guide → `playbooks/fix.md` |
| `verify [ids]` | Re-audit fixed findings → `playbooks/verify.md` |
| a member name | Run that member alone (see the table below) |
| a path, glob, or component name | Audit that target instead of the diff |
| a URL | Audit the running page (runtime arm below) |
| a PR number or URL | Audit that PR's changed files |
| anything unrecognised | List these options and stop — do not guess |

For a PR, pick the host from the git remote rather than habit: a GitHub remote takes
`gh pr diff <n>`; other hosts need their own tooling or MCP server, and `gh` will simply fail
against them. If the PR branch is not checked out, say so and skip the lint step — do not
fetch or build a worktree unprompted.

## Step 1 — profile

Read `.claude/a11y/profile.md` in the repo under audit. No profile means no idea whether the
linter has a11y rules, which framework idioms apply, or which jurisdictions matter, so run
`playbooks/init.md` first and then continue.

The profile records a date but is not self-invalidating. If it looks inconsistent with what
you see — it says no Angular Material but you are reading `mat-` components — say so and
suggest `/a11y init`. Do not silently audit against a profile you have reason to doubt.

Load `references/regional/<code>.md` for each jurisdiction the profile lists. Multiple
jurisdictions are normal for software sold in several markets; load them all and merge.
A jurisdiction with no file yet is a research task, not a guess — see `init.md`.

## Step 2 — lint first, and prove it ran

A linter is faster, cheaper and more consistent than any amount of reasoning, so it goes
first. What makes this step worth the care is that **a clean lint result is ambiguous**: it
means either "no violations" or "nothing was checked", and those look identical.

Run the project's template lint command from the profile over the changed template files.
Then confirm it actually inspected them:

- Output like `File ignored because of a matching ignore pattern` means the templates are
  excluded in this checkout. Report that as the first finding and check the linter-covered
  criteria by hand.
- The `@angular-eslint/template/recommended` preset contains **no** accessibility rules at
  all — only the `accessibility` preset does. A repo on `recommended` alone will lint clean
  forever while failing Level A. The profile records which preset is actually in use; when it
  says the a11y rules are absent or unverified, treat every criterion as yours to check.

When coverage *is* confirmed, the `Linter` column in `references/wcag-22.md` tells you what
to skip — but read the bracketed caveats. Those rules check presence and validity, never
quality. `alt-text` proves an `alt` exists, not that it describes the image; `valid-aria`
proves the attribute is spelled right, not that the role belongs there. The quality half of
those criteria stays with the members.

Lint violations become findings like any other, tagged `source: eslint` with the rule id.

## Step 3 — select members

Seven checkers. Each owns a disjoint slice of the 55 criteria; the map in
`references/wcag-22.md` is the authority and its coverage table is the proof.

| Member | Owns | Model |
|---|---|---|
| `playbooks/semantics-aria.md` | structure, roles, accessible names, language | inherit |
| `playbooks/keyboard-focus.md` | keyboard operation, focus order, pointer alternatives | inherit |
| `playbooks/visual-contrast.md` | contrast, colour, reflow, zoom, target size | Haiku |
| `playbooks/forms-errors.md` | labels, autofill, validation, auth | Sonnet |
| `playbooks/dynamic-live.md` | status messages, timing, motion, hover content | Sonnet |
| `playbooks/media-alt.md` | text alternatives, captions, audio description | Haiku |
| `playbooks/consistency.md` | cross-file: navigation, naming, help placement | inherit |

Cheap models where the work is arithmetic and presence-checking; the session's model where
the judgement is "is this role right, and does this label say something useful". Pass the
model explicitly when spawning. If a pinned model is unavailable, inherit instead of failing —
a checked criterion beats a skipped one.

Select by what changed, and **print the selection with its reasoning before spawning**:

```
Selected: visual-contrast, keyboard-focus
Skipped:  media-alt (no media elements touched), forms-errors (no form controls in diff),
          consistency (single file changed — no cross-file surface)
```

Silent skipping is the false-comfort failure mode: a report that omits what it never looked at
reads exactly like a report that found nothing. Rough guide — templates pull in semantics,
keyboard, forms; stylesheets pull in visual-contrast; component logic pulls in dynamic-live
and keyboard; two or more files touching the same pattern pull in consistency. Media elements
pull in media-alt. When genuinely unsure, run the member; a wasted Haiku call is cheaper than
a missed Level A failure.

Spawn the selected members in parallel. Each gets: the diff or target files, the profile, its
own playbook path, `references/wcag-22.md`, `references/framework-notes.md`, any regional
overlay, and the confirmed lint coverage so it knows what not to re-check.

## Step 4 — runtime, when it is cheap

Static reading cannot compute a rendered contrast ratio or prove focus order matches the
visual order. Use whatever the profile says is present, in this order: browser automation
against an already-running dev server, then an axe CLI, then a Playwright + axe setup. The
browser path is worth preferring because it is the only one that can actually press Tab and
watch where focus goes, rather than inferring it from source.

Install nothing without asking, and never block on a missing tool — a static-only audit is a
real audit, it just says so in the footer.

## Step 5 — synthesise and report

Read `references/report-format.md` for the finding card, the summary table and the ledger
schema. In short: dedup across members, grade each finding on two independent axes
(`AA-violation` vs `advisory`, and `critical`…`minor`), reconcile against the existing ledger
so IDs stay stable, write the cards to `.claude/a11y/findings.md`, and echo the summary table.

Two axes rather than one because they answer different questions: whether you are legally
non-conformant, and how badly it hurts. A minor Level A failure still breaks the claim; a
serious advisory issue still deserves attention. Collapsing them hides one or the other.

The footer names the profile, the jurisdictions loaded, whether lint coverage was confirmed,
whether the runtime arm ran, and — when a regional overlay applies — the obligations that
cannot be checked from code at all. That last part matters: a code review cannot establish
legal conformance, and a report that implies otherwise is worse than no report.

If a diff genuinely has no accessibility surface, say so in one line. Most diffs do not
violate anything, and inventing findings to look thorough destroys the skill's usefulness
faster than missing one would.

## Auto-invoked runs are different

When this skill fires on its own while someone is mid-feature rather than being asked, run
the light path: a single pass over just the code being touched, no member fan-out, no runtime
arm. Stay silent when there is nothing to report — write to the ledger only if you actually
find something, and close with one line pointing at `/a11y` for the full audit.

The reasoning is simple: a seven-agent audit interrupting every template edit gets this skill
switched off within a week, and a skill that is off finds nothing. Prefer natural boundaries —
the user says a feature is done, or is about to commit — over per-keystroke checking.

**Never block a commit.** Report, and let the developer decide. `references/hook-snippet.md`
has an opt-in hook for anyone who wants the check wired to file writes.

## Reference files

| File | Read when |
|---|---|
| `references/wcag-22.md` | always — the criteria map, owners, and impact glosses |
| `references/report-format.md` | writing findings or the ledger |
| `references/framework-notes.md` | auditing Angular, or any framework-specific idiom |
| `references/regional/de.md` | profile lists `DE` |
| `references/regional/us.md` | profile lists `US` |
| `references/hook-snippet.md` | the user wants automatic enforcement on file writes |
