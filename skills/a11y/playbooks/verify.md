# verify — re-audit what was fixed

`/a11y verify` · `/a11y verify F-07 F-12`

The final pass, run once a batch of fixes has been applied. With no arguments it operates on
every row in the ledger with status `fixed`; with IDs it narrows to those.

`fix` applies a change and explains how to test one finding. `verify` asks a different and
harder question: **did the fixes actually hold, and did they break anything?** A fix written from
a finding description can satisfy the letter of a criterion while missing its point, and a fix in
a shared component can resolve one finding and introduce three elsewhere. Neither shows up in the
run that produced the fix.

If there are no `fixed` rows, say so and stop. Nothing to verify is a good state, not a problem.

## Step 1 — re-audit each fixed finding

For each row, re-run the *owning member's* check against the current code — not a text
comparison against the old finding, and not a diff review. The question is whether the criterion
is satisfied now, judged fresh.

Three outcomes:

- **Confirmed** — the criterion is satisfied. Prune the row.
- **Regressed** — the violation is present again. Set status `regressed` and report it
  prominently; something undid the fix, and that is more interesting than the original finding.
- **Partially fixed** — the specific instance is resolved but the criterion still fails nearby:
  one icon button named, three others in the same template still bare. Keep the row `open` with
  an updated description. This is the most common real outcome and the one a shallow check
  misses, because the original line number now looks fine.

## Step 2 — check for collateral damage

Accessibility fixes touch shared components, focus behaviour and DOM order — all of which reach
beyond the file that changed. Look at what the fixes touched and re-check around them:

- A **shared component** changed: check its other call sites. A hardcoded `aria-label` added to
  fix one usage is wrong at every other usage, and a name that reads well in one context can be
  actively misleading in another.
- **DOM order or structure** changed to fix focus order (2.4.3) or relationships (1.3.1): re-check
  reading order and any `aria-labelledby` / `aria-describedby` references that may now point
  across a boundary or at a removed element.
- **Focus management** added: check for a new trap (2.1.2), and that focus still returns
  sensibly on close.
- **A live region** added: check it does not double-announce alongside a focus move, and that
  `assertive` was not used where `polite` belongs.
- **Colour or size** changed to fix contrast or target size: check the new value did not break a
  different pair, or push a layout past a reflow threshold.
- **A label or name** changed: check 2.5.3 Label in Name still holds — the accessible name must
  still contain the visible text. Adding an `aria-label` to a control that already had visible
  text is the classic way to fix one criterion and break another.

New violations found here enter the ledger as new findings with new IDs. Do not fold them into
the row being verified — they are separate defects and deserve separate tracking.

## Step 3 — run the tooling arms again

Re-run the linter over the touched files: a fix can trip a rule that previously had nothing to
say. If the runtime arm is available, re-run it too — contrast and focus-obscuring fixes are
exactly the class that static reading verifies poorly, and this is the moment where the cost of
starting a dev server is most clearly worth it.

## Step 4 — prune and report

Remove confirmed rows from the ledger. This is where the file shrinks: as a *result* of passing
verification, not by hand. Keep `regressed`, `open` and `accepted` rows.

```
Verified 6 fixed findings.

Confirmed and pruned:  F-05, F-07, F-09, F-11
Regressed:             F-08 — sticky header returned in header.component.scss:22, focus
                       obscured again (2.4.11)
Partially fixed:       F-06 — icon-button.html:12 named, but three sibling buttons at :19,
                       :26, :33 are still bare (4.1.2). Row kept open, description updated.
New from collateral:   F-13 — aria-label added in F-05's fix is hardcoded "Close dialog" but
                       shared-modal is also used as a side panel, where it reads wrong.

Ledger: 3 open · 1 regressed · 2 accepted (hidden)
Lint: clean over 7 touched files · Runtime: axe on :4200, 0 violations
Not checkable from code: see references/regional/de.md § Not checkable here
```

## Step 5 — the combined walkthrough

One guide covering the whole verified batch, so the fixes can be checked against a comparison
environment in a single sitting. Grouped **by page rather than by finding**, because that is how
someone actually tests: open a page, exercise it, move on.

Use the dev-server URL from the profile for the new code and the comparison-environment pattern
for the old. Per page: what changed, the two or three keystrokes that show it, and what should
look and behave exactly as before.

Keep it to what a person will really do. A walkthrough long enough to feel like a chore gets
skipped, and a skipped walkthrough verifies nothing.

Close by naming what verification could not establish — anything needing a real screen reader, a
translated string, a design decision, or a regional obligation that is not checkable from code.
`verify` confirms that criteria are satisfied in code. It is not a conformance certificate, and
it should never read like one.
