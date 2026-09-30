# fix — apply a fix, then explain how to test it

`/a11y fix F-07` · `/a11y fix F-07 F-12` · `/a11y fix all`

Two deliverables per finding: the code change, and a short guide the developer can follow to see
the difference with their own hands. The second half is not decoration. An accessibility fix is
usually invisible in the UI — the whole point is that nothing looks different — so without a way
to check it, the developer is trusting a diff they cannot evaluate.

The ID you were given is the consent. Do not ask again before editing; do report exactly what
changed.

## Applying the fix

1. **Read the finding from the ledger**, not from memory. IDs are stable and the ledger is the
   source of truth; a scrollback summary may be stale.
2. **Verify the finding still stands.** Line numbers drift, and the code may have changed since
   the audit. If the violation is gone, mark the row `fixed`, say it was already resolved, and
   move on without editing anything.
3. **Read the profile, and the repo's accessibility convention if the profile names one**,
   before choosing an approach. The right fix in a repo with the Angular CDK is different from
   the right fix without it, and a fix that ignores the repo's existing helper will not survive
   review. The fix must pass the convention's reviewer checklist, not only the playbook: where
   the convention prescribes an order, a helper or a house rule, follow it, because that is the
   checklist the PR will be reviewed against. Only where the convention is looser than WCAG 2.2
   A + AA does the criterion win — and then say so, since the fix will look wrong to a reviewer
   reading the convention.
4. **Make the smallest change that resolves the criterion.** Resist the adjacent refactor. A
   focused diff gets merged; a sprawling one gets deferred, and a deferred fix helps nobody.
5. **Do not change visible behaviour** unless the finding requires it. If it does — adding a
   keyboard path, a visible label, a pause control — say so prominently, because that is a
   product change and somebody may need to weigh in.
6. **`eslint --fix` for linter-sourced findings tagged `auto-fixable`.** Only three of the
   accessibility rules are fixable (`no-autofocus`, `no-distracting-elements`, `table-scope`),
   and the rest need a human decision about wording. Run the fixer where it applies rather than
   hand-editing.
7. **Never invent user-facing copy silently.** Labels, alt text and error messages are product
   voice. Write a sensible draft, then flag it explicitly as needing a real review — the
   difference between `aria-label="Delete"` and `aria-label="Delete invoice 4021"` is a product
   decision, and quietly guessing produces plausible text that silences the linter while
   leaving the user just as stuck.

   **Draft through the repo's i18n, not as a literal.** When the profile records a translation
   library, the draft is a translation key bound the way the repo binds keys —
   `[attr.aria-label]="'invoice.actions.delete' | translate"`, not `aria-label="Delete"` — plus
   the entry in each locale's key file, with the draft wording in the source locale and the other
   locales marked as needing translation. Say which key files you touched or which still need the
   entry. A hard-coded English name in a German UI is read with German pronunciation rules and
   can itself fail SC 3.1.2 Language of Parts, so a literal is not a neutral placeholder. Only
   with no i18n in the profile is a literal the right draft.
8. **Update the ledger**: status `fixed`, and note what changed.

When a finding cannot be fixed in code — it needs a design decision, a translation beyond the
source-locale draft, a
transcript, a backend change — do not force it. Say what is blocked and on whom, and leave the
status `open`. A wrong fix that closes a finding is worse than an open one.

## The manual test guide

Written after the fix, in chat, for a developer who has the app running locally and a comparison
environment available. Keep it short — five steps at most, no assistive-technology expertise
assumed. Its job is to let someone confirm the fix with their own eyes and hands in about a
minute.

Use the URLs from the profile: the dev server for the new code, and the tenant URL pattern for
the unfixed comparison. When the profile has no tenant pattern, say "your comparison
environment" and note that `/a11y init` can record it.

```
## Testing F-07 by hand

What changed: the panel resize handle can now be operated with arrow keys. Dragging works
exactly as before.

1. Open the old behaviour: <comparison-env>/settings/panels
   Click the panel divider, then press Tab until focus reaches it — it never does. There is no
   way in from the keyboard.

2. Open the new behaviour: http://localhost:4200/settings/panels
   Press Tab until the divider has a visible focus ring.

3. Press ArrowLeft and ArrowRight. The panel should resize by 16px per press, and hold at the
   min/max bounds.

4. Drag the divider with the mouse. It should behave exactly as it did before — this fix added
   a path, it did not replace one.

5. Optional, with a screen reader (VoiceOver: Cmd+F5): focusing the divider should announce a
   name, "splitter", and the current value.

Expected difference: before, the resize was mouse-only. After, it works from the keyboard too,
and the mouse behaviour is unchanged.
```

What makes such a guide good:

- **Both sides, old first.** Seeing the failure is what makes the fix legible. A guide that only
  shows the new behaviour proves nothing — the reader has no idea what they are comparing to.
- **Concrete keys and observable outcomes**, not "verify accessibility". "Press Tab until the
  divider has a focus ring" is checkable; "confirm keyboard operability" is not.
- **Say what should be unchanged.** Most of the reader's risk is a regression in the path that
  already worked, and naming it turns a vague worry into a two-second check.
- **Screen reader steps are optional and last.** Requiring an unfamiliar tool up front is how a
  test guide goes unread. Most fixes are verifiable with Tab, arrow keys and eyes.
- **Name the actual routes.** A guide saying "navigate to the affected page" wastes the time it
  was written to save.

## Where a screen reader is genuinely required

For a handful of criteria — 4.1.3 status messages, 1.1.1 alt text quality, 4.1.2 announced name
and role — there is no visual proof and the guide has to use one. Name a concrete tool for the
platform (VoiceOver on macOS with Cmd+F5, NVDA on Windows) and give the two or three keystrokes
needed, rather than assuming familiarity.

## `fix all`

Apply in ledger order, oldest first, and group the output by file so the diff is reviewable. Then
write **one** consolidated test guide rather than a wall of per-finding ones — a reader facing
twelve separate guides reads none of them. Group by page: "on the settings panel, these four
things changed, here is how to check them".

Skip and report anything that needs a product decision instead of guessing at twelve labels in
a row. Close with a summary: fixed, skipped and why, and a reminder that `/a11y verify` re-audits
the batch once the fixes are reviewed.
