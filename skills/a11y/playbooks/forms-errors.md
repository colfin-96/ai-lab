# forms-errors

**Owns** 1.3.5, 3.2.2, 3.3.1, 3.3.2, 3.3.3, 3.3.4, 3.3.7, 3.3.8 — labels, autofill,
validation, error recovery, authentication.

Forms are where accessibility failures cost the most, because a form is usually the point where
the user is trying to actually accomplish something — pay, apply, book, log in. A blocked form
is a blocked outcome.

Two of your criteria are new in WCAG 2.2: 3.3.7 Redundant Entry and 3.3.8 Accessible
Authentication (Minimum). Almost no existing code was written with them in mind, so look
specifically.

## 3.3.2 Labels or Instructions

Every input needs a programmatically associated label.

- `<label for>` matching a real, unique `id` — the standard and best answer.
- A wrapping `<label>` also works.
- `aria-labelledby` pointing at a visible heading, legend or adjacent text that already says
  what to enter.
- `aria-label` or a visually hidden `<label>` gives the field a name (4.1.2) but is not enough
  on its own: 3.3.2 needs a label or instruction sighted users can *see*. A field whose only
  label is invisible fails 3.3.2 unless visible text nearby does the job — a search box beside a
  visible "Search" button, a column header above a row of inputs.
- **Placeholder is not a label.** It disappears on input, is usually low contrast, and is not
  reliably exposed. A placeholder-only field is a real violation, and a very common one.
- Required, format and constraint information must be available *before* the error — "must be
  at least 12 characters" belongs with the field, associated via `aria-describedby`, not only
  in the error that appears after a failed attempt.

## 3.3.1 Error Identification / 3.3.3 Error Suggestion

- The error must **name the field and describe the problem in text.** A red border alone fails
  1.4.1 as well.
- Associate it: `aria-describedby` pointing at the message, plus `aria-invalid="true"` on the
  control while invalid. Without the association, a screen-reader user hears the field and
  never the reason.
- **3.3.3** requires a *suggestion* when one is knowable. "Invalid date" fails; "Use
  DD.MM.YYYY" passes. If the system knows what valid looks like, it must say so.
- An error summary at the top of the form is good practice and needs care: it should be
  focusable or announced when it appears, and each entry should link to its field.
- Errors that appear only on submit leave a keyboard user hunting. Errors that fire on every
  keystroke are their own problem — validating on blur is usually the humane middle.

## 1.3.5 Identify Input Purpose

Fields collecting common personal data need the right `autocomplete` token — `name`, `email`,
`tel`, `street-address`, `postal-code`, `cc-number`, `current-password`, `new-password`,
`one-time-code`. This is not a convenience feature: it is how password managers and autofill
work, and it is what lets someone with a motor or cognitive disability avoid typing their
address by hand for the hundredth time. Missing tokens on a checkout or profile form are a real
AA failure.

Note `autocomplete="off"` on password fields actively breaks password managers, which pushes
users toward weaker, memorable passwords. Flag it.

## 3.3.7 Redundant Entry — new in 2.2

Information already provided in the same process must not have to be re-entered from memory. It
must be auto-populated or available to select.

The classic failures: a multi-step checkout asking for the address again at the shipping step;
a wizard asking for an email already given at step 1; a "confirm your details" step that clears
the fields. Re-entry is permitted when it is essential — confirming a password, or where
re-entry is the security purpose.

Look at any multi-step flow in the diff, and at step-to-step state handling.

## 3.3.8 Accessible Authentication (Minimum) — new in 2.2

No cognitive function test in a login step unless an alternative exists. A cognitive function
test means remembering, transcribing, or solving a puzzle:

- Puzzle CAPTCHAs ("select all the traffic lights") — object recognition and transcription are
  both explicitly *permitted* as alternatives, but a puzzle with no alternative fails.
- Blocking paste into password or OTP fields — this forces transcription from memory and is a
  direct failure. Search for paste prevention specifically; it is often added deliberately in
  the belief it improves security.
- Requiring a memorised code with no copy/paste, no password-manager support, no email/SMS
  fallback.
- Two-factor flows where the code must be typed from another device and paste is blocked.

Support for password managers — correct `autocomplete` tokens, no paste blocking — is the
cheapest path to conformance here and usually the whole fix.

## 3.2.2 On Input

Changing a field's value must not change context unexpectedly: no auto-submit on select, no
navigation on blur, no dialog opening because a checkbox was ticked. If a change must trigger
something significant, warn beforehand or require an explicit action.

An auto-submitting `<select>` is the canonical failure — a keyboard user arrowing through
options triggers a submit on every one.

## 3.3.4 Error Prevention (Legal, Financial, Data)

Applies only to pages that do one of three things:

1. cause a legal commitment or a financial transaction (contract, order, payment, transfer);
2. modify or delete user-controllable data in a data storage system (saved records, account
   data, uploaded files — not unsaved client-side state);
3. submit the user's responses to a test.

For those submissions, at least one of: reversible, checked for input errors with a chance to
correct, or confirmed (review step or confirmation) before finalising. Look for a payment,
contract, stored-data delete or overwrite, or test submission that commits on a single
activation with no undo, no review and no confirmation.

It does not cover destructive actions in general. Closing a panel, resetting a filter, clearing
a form or removing an unsaved row is not a 3.3.4 finding, however hard it is to undo — never
cite 3.3.4 for it.

**Best practice (not a WCAG criterion):** an action that discards real user effort outside those
three triggers — clearing a long form, removing an unsaved row with typed content, closing a
dirty editor — benefits from a confirmation or an undo. Grade it `advisory` with `SC` `—`, or
`convention` when the repo's accessibility convention requires it; never `AA-violation`.

## Angular specifics

- **Reactive forms**: validation state lives on the `FormControl`, but nothing about
  `control.invalid` reaches assistive technology on its own. The template still has to bind
  `[attr.aria-invalid]` and `[attr.aria-describedby]`. A control with `Validators.required` and
  no template wiring is a real finding — the validation works and is invisible.
- **Template-driven forms**: same gap via `ngModel` and the exported directive state.
- `Validators.required` does not add `required` or `aria-required` to the DOM. Bind it.
- **Angular Material**: `<mat-form-field>` wires `<mat-label>`, `<mat-error>` and `<mat-hint>`
  to the control automatically — `mat-error` becomes `aria-describedby` when the control is
  invalid. So a Material form field with `mat-label` and `mat-error` is usually conformant, and
  reporting it is a false positive. What *does* fail: a bare `<input matInput>` with only a
  `placeholder`, a custom error element outside `mat-form-field`, or an error rendered by
  `@if` in a way that never associates. Check which shape you are looking at before reporting.
- A custom form control implementing `ControlValueAccessor` must expose name, role, state,
  disabled and invalid itself — the interface handles values, not semantics.
- `@if`-toggled error elements change the `aria-describedby` target's existence. The reference
  must point at something that exists when the error is shown; a stale ID fails silently.
- Announcing errors dynamically is `dynamic-live`'s criterion (4.1.3). Note the coupling when
  an error appears without a live region, but let that member own it.

## What the linter covers

With the `accessibility` preset: `label-has-associated-control` — association only. It cannot
tell you the label text is meaningless, that a placeholder is standing in for a label in a way
it fails to detect, or anything at all about errors, autofill, redundant entry or
authentication. Everything else here is yours.

## Traps

- A `<mat-form-field>` with `<mat-label>` is properly labelled. Do not report it as unlabelled
  because there is no `<label for>`.
- Search inputs with a visible adjacent button and an `aria-label` are fine without a visible
  label.
- Not every field needs an `autocomplete` token — only those collecting the defined
  user-information types. A quantity field or a free-text comment does not.
- Confirming a password is permitted re-entry, not a 3.3.7 failure.
