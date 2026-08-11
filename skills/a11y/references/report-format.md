# Report format, severity, and the findings ledger

Three artefacts: a summary table echoed in chat, a finding card written to the ledger, and the
ledger itself. They exist because accessibility findings get acted on days after they are
found, often by someone else, and a chat message that scrolled away cannot be acted on at all.

## Where things live

| Path | Committed? | Purpose |
|---|---|---|
| `.claude/a11y/profile.md` | **yes** | facts about the repo — see `playbooks/init.md` |
| `.claude/a11y/findings.md` | **no**, gitignored | the ledger |

The profile is committed because it describes the project, not the person: a teammate running
`/a11y` should get the same rules. The ledger is gitignored because it is working state, it
churns every run, and it would turn every PR into a diff of somebody's todo list.

Add the ignore entry if it is missing, but **ask before editing `.gitignore`** — it is a
tracked file and a silent edit will surprise someone in review.

## Severity: two independent axes

Every finding carries both. They answer different questions and collapsing them into one scale
loses whichever the reader needed.

**Conformance** — is this a failure of the target?

- `AA-violation` — fails a Level A or AA criterion. Blocks a WCAG 2.2 AA claim.
- `advisory` — real accessibility problem, no criterion failed. Best practice, AAA, or a
  regional obligation that is not a WCAG criterion.

**Impact** — how badly does it hurt someone?

- `critical` — a group of users cannot complete the task at all
- `serious` — completable, but with substantial difficulty or a workaround
- `moderate` — noticeable friction or confusion
- `minor` — technically wrong, small practical effect

A `minor` + `AA-violation` still sinks a conformance claim. A `serious` + `advisory` still
deserves a fix. Report both and let the reader weigh them.

## Summary table (chat)

```
| ID | Conformance | Impact | SC | File | Finding |
|------|---------------|----------|-----------|--------------------------|----------------------------|
| F-07 | AA-violation | critical | 2.5.7 | panel-resizer.html:34 | resize is drag-only |
| F-08 | AA-violation | serious | 4.1.2 | icon-button.html:12 | icon button has no name |
| F-09 | advisory | moderate | 2.4.6 | filter-panel.html:8 | heading text says "Section" |
```

Then the footer, which is not optional:

```
Profile: .claude/a11y/profile.md (2026-08-11) · Jurisdictions: DE, US
Lint: @angular-eslint accessibility preset confirmed active — 11 rules, 2 findings
Runtime: axe via dev server on :4200 — 1 finding
Members: semantics-aria, keyboard-focus, visual-contrast (skipped: media-alt, forms-errors,
         dynamic-live, consistency — no matching surface in diff)
Not checkable from code: see references/regional/de.md § Not checkable here
```

Every line of that footer exists to stop a specific misreading — that the profile is current,
that the linter really ran, that the runtime arm was used, that unlisted members were skipped
on purpose, and that this is a code review rather than a conformance certificate.

## Finding card (ledger)

```markdown
### F-07 · AA-violation · critical · SC 2.5.7 Dragging Movements (AA, new in 2.2)

**Where** `src/app/panels/panel-resizer.component.html:34`
**Source** ai (`keyboard-focus`)
**Status** open

**Defect** The resize handle is driven entirely by `(mousedown)` → `(mousemove)` → `(mouseup)`.
There is no keyboard handler, and no non-drag path to set the panel width.

**Impact** Anyone who cannot perform a sustained precise drag — tremor, RSI, switch access,
head pointer, or just a trackpad on a train — cannot resize the panel at all. There is no
slower way to do it; the capability is simply absent for them.

**Fix** Make the handle focusable (`tabindex="0"`, `role="separator"`,
`aria-orientation="vertical"`, `aria-valuenow`) and handle ArrowLeft/ArrowRight to step the
width. The drag path stays as it is — this adds an alternative rather than replacing anything.
The APG "Window Splitter" pattern is the canonical shape for this control.

**Test it** `/a11y fix F-07`
```

Field notes:

- **Impact** is the field most often written badly. It is not a restatement of the defect in
  softer words — it names *who* is affected and *what they cannot do*. The one-clause glosses
  in `references/wcag-22.md` are the starting point; extend them with what this specific code
  does. "Violates 2.5.7" is not an impact. "Cannot resize the panel at all" is.
- **Fix** should be specific enough to act on and should say what stays. Fixes that read like
  rewrites get deferred forever.
- **Source** is `eslint` (with the rule id) or `ai` (with the member name). Worth recording
  because it tells the next reader how much to trust it: a linter finding is deterministic, a
  member finding is judgement.
- Cite the criterion by number *and* name — the number alone is unreadable to anyone who has
  not memorised the spec, and the name alone is ambiguous between minimum and enhanced.

## Ledger schema

`.claude/a11y/findings.md` opens with a table, followed by the cards.

```markdown
# a11y findings

Ledger for /a11y. Gitignored working state. Hand-editable: delete a row to forget it, or set
status to `accepted` to keep it from resurfacing.

| ID | Status | Conformance | Impact | SC | File | Finding | First seen |
|------|----------|---------------|----------|-------|-----------------------|--------------------|------------|
| F-07 | open | AA-violation | critical | 2.5.7 | panel-resizer.html:34 | drag-only resize | 2026-08-11 |
| F-05 | fixed | AA-violation | serious | 4.1.2 | icon-button.html:12 | unnamed icon button | 2026-08-09 |
| F-02 | accepted | advisory | minor | 2.4.6 | legacy-grid.html:88 | vague heading | 2026-08-04 |
```

**IDs are monotonic and never reused.** `F-07` means one thing forever. This is what makes
`/a11y fix F-07` safe to type from yesterday's scrollback, and it is why re-runs reconcile
rather than renumber.

**Statuses**

| Status | Meaning |
|---|---|
| `open` | found, not addressed |
| `fixed` | a fix was applied, not yet re-audited |
| `regressed` | was `fixed`, detected again |
| `accepted` | deliberately not fixing — never resurface this |

## Reconciliation on re-run

The ledger is durable and hand-edited, so a re-run merges rather than overwrites:

1. Match each newly detected violation against existing rows by file, criterion, and element
   identity — not by line number, which shifts with every unrelated edit above it.
2. A match to an `open` row: keep the ID, refresh the line number.
3. A match to a `fixed` row: set it to `regressed`. Something undid the fix, and that is worth
   flagging loudly rather than quietly reopening.
4. A match to an `accepted` row: stay silent. That is what accepted means.
5. No match: new row, next ID.
6. Rows with no corresponding violation this run: leave them alone. `verify` prunes confirmed
   fixes; the audit does not, because absence of detection is not proof of a fix — the file
   might simply not have been in scope this time.

Open the report with the reconciliation line, because the delta is usually the most
informative thing in the whole run:

```
3 new · 1 regressed · 2 still open · 4 fixed awaiting /a11y verify · 1 accepted (hidden)
```

A user who deleted rows by hand after fixing them will see those violations return as new IDs
if the fix did not hold — which is the correct behaviour, and the reason deleting rows is safe
rather than destructive.
