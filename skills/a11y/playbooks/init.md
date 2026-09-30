# init — profile the repo

Writes `.claude/a11y/profile.md` in the repo under audit. Every later run reads it.

The profile exists because the same finding can be correct in one repo and a false positive in
the next. Whether a hand-rolled focus trap is a defect depends on whether the CDK is available.
Whether you re-check ARIA validity depends on whether the linter really runs. Whether German law
adds obligations depends on who the software is sold to. None of that is inferable from a diff,
and guessing at it produces confident nonsense.

**Commit this file.** It describes the project, not the person — a teammate running `/a11y`
should get the same rules. (The findings ledger is the opposite: gitignored working state.)

## What to detect

Read files; do not ask the user things you can read.

**Framework and version** — `package.json` for `@angular/core`. Standalone components or
`NgModule`s (look at `main.ts` / `bootstrapApplication` vs `AppModule`). Signals or RxJS-based
state. Note the actual version: what the CDK offers, and what template syntax is available
(`@if` vs `*ngIf`), both depend on it.

**Component library** — `@angular/material`, `@angular/cdk`, or a third-party library. The CDK
matters most: with it present, half of all keyboard and live-region fixes become "use the CDK
primitive" instead of hand-rolled ARIA. Record the version.

**Lint reality — the part most worth getting right.** Find the ESLint config and record, as
separate facts:

1. Is `@angular-eslint/eslint-plugin-template` installed?
2. Which preset is extended? `plugin:@angular-eslint/template/recommended` contains **no**
   accessibility rules; only `.../template/accessibility` does. A repo on `recommended` alone
   lints clean forever while failing Level A. This distinction is the single highest-value line
   in the whole profile.
3. Are individual a11y rules enabled, disabled, or downgraded to warnings in overrides?
4. Are template files covered, or excluded by an ignore pattern?
5. What is the exact command to lint them?

Then **actually run it once** on a template file and record what happened. A config that looks
right and an ignore pattern that silently excludes `**/*.html` are indistinguishable on paper.
If the run shows `File ignored because of a matching ignore pattern`, that is a fact worth
writing down permanently.

The eleven accessibility rules in that preset, for reference: `alt-text`,
`click-events-have-key-events`, `elements-content`, `interactive-supports-focus`,
`label-has-associated-control`, `mouse-events-have-key-events`, `no-autofocus`,
`no-distracting-elements`, `role-has-required-aria`, `table-scope`, `valid-aria`.

**Forms** — reactive, template-driven, or both. Which validation-message pattern the repo uses,
with a file reference so later runs can compare against the house style rather than an abstract
ideal.

**Colour source** — where the palette lives: Sass variables, CSS custom properties, a Material
theme, a design-token file. `visual-contrast` needs this to resolve a token to a hex value; the
difference between a precise ratio and "unresolvable" is this one line.

**Dev server** — the command and port. Without it the runtime arm cannot run, and the manual
test guides in `fix.md` cannot give a real URL.

**Runtime tooling** — is `@axe-core/cli`, `axe-core`, `jest-axe`, `@axe-core/playwright`, or a
Playwright setup already present? Only record what exists. Do not install anything.

**In-house a11y utilities** — existing directives, services, pipes, or visually-hidden classes.
A fix that reuses the repo's own helper will actually get merged; one that introduces a parallel
approach will not. Search for `aria`, `a11y`, `focus`, `announce`, `visually-hidden`,
`sr-only`.

**Known debt** — suppression comments, disabled a11y rules, TODOs referencing accessibility.
Recording these stops every future run from re-reporting the same accepted problems.

**i18n** — `@angular/localize`, a translation library, or none; the locale set. Affects `lang`
attribute handling and whether hardcoded strings in templates are a finding. With a library,
also record how a template reads a key (`'key.path' | translate`, `i18n` attributes, `$localize`)
and where the key files live, one per locale — `fix` needs both to draft a name as a key rather
than a literal.

**Testing** — the test runner, and whether any a11y assertions already exist.

**Accessibility convention** — whether the repo already writes down its own accessibility rules:
a convention or guideline file with a rule and a reviewer checklist, which its PR review
enforces. Look where the repo points its agents and reviewers first — `AGENTS.md`, `CLAUDE.md`,
`CONTRIBUTING.md`, a `docs/` conventions or guidelines folder — then search file names and
headings for `accessibility` / `a11y`. Record the path relative to the repo root:

```
convention: docs/accessibility.md (linked from AGENTS.md:42)
```

Every audit and fix reads it and defers to it where it is stricter than a playbook, so it is the
line that keeps `/a11y` from contradicting the repo's own review. If there is none, record
`convention: none` — **do not create one.** A convention is a team decision, and a profile
states facts; writing rules for the team is not what `init` is for.

## What to ask

Two things, because they are not in the code and they change what conformance means.

**Jurisdictions.** Where is this software sold or deployed? Multiple answers are normal and
expected for commercial software — `DE + US` is a perfectly ordinary answer, and each overlay is
loaded additively.

You may infer a starting guess (an `Impressum` route, a `de-DE` locale, a currency, a TLD) but
confirm it rather than assuming. Overlay files currently exist for `DE`, `EU` and `US`.

`EU` is the fallback for any member state without its own file, and it is **additive rather than
alternative**: a German repo loads both `eu.md` (the directives and EN 301 549 version state) and
`de.md` (the national transposition and its extra duties). Record every applicable jurisdiction
rather than collapsing them to one.

**Sector — public or private.** This is not in the code and it selects which law applies. In
Germany, public bodies fall under BITV 2.0 while private-sector products fall under the BFSG;
in the US, Section 508 covers federal procurement and the ADA Title II rule covers state and
local government. Same country, materially different obligations.

If the user does not know or does not care, record `jurisdictions: none` — WCAG 2.2 A + AA
alone is the floor and a perfectly reasonable target. Never invent a legal position.

### A jurisdiction with no overlay file

Do not guess at law. Research it from primary sources — the national implementation of the
European Accessibility Act or equivalent statute, the standard it references (EN 301 549 across
the EU), and the WCAG version and level that standard incorporates. Then write
`references/regional/<code>.md` following the shape of the existing files: what applies to whom,
which WCAG version and level, what is added beyond WCAG, and explicitly what cannot be checked
from code. Cite every source with a URL.

Tell the user you created it and what you based it on, so the legal claims get a human's eyes.

## Unknowns are values

When something cannot be determined, write `unknown` and say what you looked at. A profile that
guesses is worse than one with gaps, because later runs treat it as fact. `lint_a11y_rules:
unknown — eslint.config.js extends a shared config outside the repo` tells the next run exactly
how much to trust the lint result.

## Output shape

Markdown, human-readable, reviewable in a PR. Group under headings matching the sections above,
one fact per line, with file references where a fact came from a file. Open with the date and a
line stating the profile is not self-invalidating — re-run `/a11y init` after upgrading Angular,
adding a component library, or changing lint config. Nothing will warn you.

Close with the conformance target: `WCAG 2.2 Level A + AA`, plus jurisdictions and sector.

## Finally — check tracking in both directions

Two files, two opposite requirements, and both need verifying. Checking only one is how the
profile ends up silently untracked.

```bash
git check-ignore -v .claude/a11y/profile.md   # must print NOTHING — it has to be committable
git check-ignore -v .claude/a11y/findings.md  # must print a rule — it has to be ignored
```

**The profile must be trackable.** Plenty of repos ignore `.claude` wholesale, since teams
often exclude agent directories by default. When they do, the profile silently stays untracked:
every teammate re-profiles from scratch, gets different answers, and the audits diverge — which
is the exact failure that committing the profile exists to prevent. A `git check-ignore` that
prints a matching rule is that failure, caught early.

**The ledger must be ignored**, because it is working state that churns every run and would
turn every PR into a diff of somebody's todo list.

### When the profile path is ignored

A single negation does not work, and it is worth understanding why before writing one: **git
does not descend into an excluded directory**, so a negation for a file inside it is never even
considered. Both of these leave the profile ignored:

```gitignore
.claude/                          # ← fails
!.claude/a11y/profile.md

.claude/*                         # ← also fails: .claude/a11y is excluded, so git stops there
!.claude/a11y/profile.md
```

Each directory on the path has to be re-admitted before the file can be:

```gitignore
.claude/*
!.claude/a11y/
.claude/a11y/*
!.claude/a11y/profile.md
```

That shape keeps everything else under `.claude` excluded — `settings.local.json`, `skills/`,
`worktrees/`, and the ledger — while making the profile committable. Adapt it to the repo's
existing rules rather than pasting it blindly: the goal is to preserve every exclusion that is
already there and open exactly one hole.

**Ask before editing `.gitignore`.** It is a tracked file, in both the add-an-entry case and
this un-ignore case, and a silent edit surprises whoever reads the PR. Show the exact lines you
intend to add and why.

### Verify, then record

After any edit, re-run both checks. `check-ignore` is the only thing that settles it — reading
the file and reasoning about precedence is exactly where this goes wrong.

Record the outcome in the profile so a later run does not re-litigate it:

```
profile_tracked: yes — .gitignore re-admits .claude/a11y/profile.md (verified 2026-08-11)
ledger_ignored: yes — .gitignore:12 `.claude/*`
```

### When the user declines

Fine, and not a blocker. The profile stays local and unshared. Record it:

```
profile_tracked: no — user declined the .gitignore change; profile is local-only
```

Then make sure the report footer says so rather than implying teammates share these rules —
`references/report-format.md` covers the wording. A local-only profile still works perfectly for
the person who wrote it; the only thing lost is consistency across the team, and that is worth
stating out loud instead of quietly assuming.

## Report

Close by reporting what you detected, what you had to ask, what came back `unknown`, the
convention found (or `none`), and the tracking state of both files.
