# dynamic-live

**Owns** 1.4.13, 2.2.1, 2.2.2, 2.3.1, 4.1.3 — status messages, timing, motion, hover content.

Your criteria share a theme: **things that change without the user asking.** A sighted mouse
user notices a toast appear, a spinner stop, a count update. A screen-reader user notices none
of it unless the change is announced, and someone who reads slowly or cannot move quickly is
harmed by changes that expire.

## 4.1.3 Status Messages

The one you will find most often. A status message is any content that reports a change of
state, progress, or the result of an action *without* moving focus. If it does not move focus,
it must be announced through a live region.

Real cases, all common:

- "3 results found" after a filter or search
- "Saved", "Copied to clipboard", toasts and snackbars
- Form validation summaries appearing after submit
- Loading and progress states, and their completion
- "Item added to cart", counters, badge updates
- Errors surfaced from an async call

The mechanics:

- `role="status"` or `aria-live="polite"` for most things — waits for a pause in speech.
- `role="alert"` or `aria-live="assertive"` for urgent, time-sensitive messages only.
  Assertive interrupts whatever the user is reading mid-sentence; overusing it is its own
  accessibility problem, so flag inappropriate `assertive` as an `advisory` finding.
- **The live region container must exist in the DOM before the message is inserted.** This is
  the single most common implementation bug: creating the element and its content at the same
  time means the region is never observed, and nothing is announced. The code looks entirely
  correct. Check whether the container is rendered up front and only its *contents* change — an
  `@if` that creates the whole live region along with the message will not announce.
- `aria-atomic="true"` when the whole message should be re-read rather than only the changed
  node.
- A progress element needs `role="progressbar"` with `aria-valuenow`/`min`/`max`, or a text
  status; a bare animated bar announces nothing.

Do not demand a live region for changes that move focus — a dialog opening and taking focus is
announced by virtue of the focus move, and adding a live region there causes double-speaking.

## 1.4.13 Content on Hover or Focus

Tooltips, popovers and hover cards must be:

- **Dismissible** without moving the pointer or focus — Escape must close it.
- **Hoverable** — the pointer can move onto the revealed content without it vanishing. A gap
  between trigger and tooltip that closes it on the way is a real failure for anyone with
  imprecise pointer control.
- **Persistent** — it stays until dismissed, the trigger is left, or it stops being valid. No
  auto-hide timeout.

Also: hover-only content is unreachable by keyboard entirely — that is 2.1.1 and belongs to
`keyboard-focus`, but note the coupling when you see it.

Custom tooltips are far more likely to fail this than a component-library tooltip. Prioritise
hand-rolled ones.

## 2.2.1 Timing Adjustable

Any time limit needs turn-off, adjustment, or extension (at least 20 seconds' warning, ten
times extendable) — unless it is real-time by nature (an auction, a live event) or longer than
20 hours.

Look for session timeouts, auto-advancing carousels, toasts that carry information and
disappear, countdowns, and "your booking is held for 5 minutes". A toast that carries the *only*
copy of an error message and vanishes in 3 seconds fails this and 4.1.3 together.

## 2.2.2 Pause, Stop, Hide

Anything moving, blinking, scrolling or auto-updating for more than 5 seconds needs a pause,
stop or hide control. Auto-playing carousels, marquees, animated backgrounds, live-updating
feeds, looping video. Motion beside text makes the text unreadable for many people, and there
must be a way to stop it — not just a preference buried in settings.

`prefers-reduced-motion` is the right companion habit and worth raising as `advisory` — or as a
`convention` finding when the repo's accessibility convention makes reduced motion a required
rule — but it does not substitute for a control: respecting the media query helps only users
who have set it.

## 2.3.1 Three Flashes or Below Threshold

Nothing may flash more than three times per second unless it is small and low-contrast enough to
fall under the threshold. Rare in business software, but check any diff introducing rapid
animation, strobing, or flashing alert states. This one is `critical` when it happens — it can
induce a seizure.

## Angular specifics

- **`LiveAnnouncer`** (`@angular/cdk/a11y`) is the correct tool for imperative announcements
  from TypeScript. It manages a single persistent live region correctly, which sidesteps the
  container-created-too-late bug entirely. When the profile says the CDK is present, "inject
  `LiveAnnouncer` and call `announce()`" is a better fix than hand-rolled markup, and worth
  recommending by name.
- **`cdkAriaLive`** is the declarative equivalent for a region whose content changes.
- Angular Material's `<mat-snack-bar>` announces via `LiveAnnouncer` already — do not report a
  Material snackbar as unannounced. `politeness` and `announcementMessage` are configurable, so
  check those rather than the mechanism.
- Signals and `OnPush` change detection mean the moment content actually lands in the DOM may
  differ from when the value changes. Announcements dispatched before render can be missed; this
  is worth flagging when you see an announce call in the same tick as a state change.
- `@if` / `@for` wrapping a live region: the region must persist. Put the control flow *inside*
  the live region, not around it. This is the Angular-shaped version of the container bug and
  the highest-value thing to look for in this framework.
- RxJS-driven state (loading, error, success from a `switchMap`) frequently updates the view
  with no announcement at all. Async pipes render silently.

## What the linter covers

`no-distracting-elements` catches `<blink>` and `<marquee>` — effectively nothing in a modern
codebase. Everything in this playbook is yours regardless of the lint result.

## Traps

- A dialog that takes focus does not need a live region. Reporting one causes double
  announcements.
- `role="alert"` on a static error rendered at page load will announce on arrival, which is
  usually unwanted. Distinguish "appears in response to an action" from "was always there".
- Not every DOM change is a status message. A value updating inside a form field the user is
  typing in is not, and announcing it would be hostile.
- Spinners that are purely decorative alongside an announced text status do not need their own
  announcement.
