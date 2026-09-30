# keyboard-focus

**Owns** 2.1.1, 2.1.2, 2.1.4, 2.4.3, 2.4.7, 2.4.11, 2.5.1, 2.5.2, 2.5.4, 2.5.7, 3.2.1 —
keyboard operation, focus management, pointer alternatives.

Two of your criteria are new in WCAG 2.2 (2.4.11, 2.5.7) and one more (2.5.8, owned by
`visual-contrast`) came with them. These are the criteria most likely to be missed, because
almost no tooling checks them and most code predates them.

## The highest-yield question

**Does anything here only work with a pointer?** Drag, swipe, resize, hover-to-reveal,
press-and-hold, pinch, path-tracing. If yes, that is a finding, and it is usually `critical` —
not "harder for some users" but *impossible* for them.

Ask it first, on every diff. Nothing else in this playbook catches as many real defects.

## 2.1.1 Keyboard

Every interaction must be reachable and operable from a keyboard alone.

- `(click)` on a non-interactive element: not focusable, not activatable. Native `<button>` is
  the fix; `tabindex="0"` + `role` + key handlers is the fallback when the element genuinely
  cannot be a button.
- `(mouseover)` / `(mouseenter)` with no focus equivalent — content that only appears on hover
  is unreachable.
- Custom widgets need their pattern's full key set, not just Enter. A listbox needs arrows,
  Home/End, and type-ahead; a menu needs arrows plus Escape. The ARIA Authoring Practices Guide
  defines the expected keys per pattern — cite the pattern name in your fix so the developer
  has somewhere concrete to go.

## 2.1.2 No Keyboard Trap

Focus must be able to leave anything it can enter. Real traps come from hand-rolled focus
cycling in modals, embedded editors and third-party widgets. A modal *should* trap Tab while
open — that is correct and expected — but Escape must release it, and it must be released on
close. A trap with no exit is `critical`.

## 2.4.3 Focus Order

Tab order must follow a sequence that preserves meaning. Check for:

- `tabindex` greater than 0. It jumps the element ahead of everything in document order and
  compounds with every other positive value on the page. Nearly always a defect; the fix is
  DOM order.
- CSS visual reordering (`order`, `row-reverse`, absolute positioning) with unchanged DOM
  order, so focus jumps around the screen unpredictably.
- Focus left stranded after a dynamic change: a dialog opens and focus stays behind it; a
  dialog closes and focus goes to `<body>` instead of returning to the trigger; content is
  removed while focused, dropping focus to the document. Losing focus position mid-task is
  disorienting in a way that is easy to underestimate from a mouse user's chair.
- New content inserted before the focused element, shifting the sequence under the user.

## 2.4.7 Focus Visible

Every focusable element needs a visible indicator.

- `outline: none` or `outline: 0` with no replacement is the classic failure. Search for it
  directly in any stylesheet in the diff.
- Prefer `:focus-visible` so the ring shows for keyboard users without appearing on mouse
  clicks — that combination is what usually tempts people to remove the outline in the first
  place.
- The indicator must be visible against its actual background. A custom ring can technically
  exist and be invisible; contrast of the indicator itself is `visual-contrast`'s criterion
  (1.4.11) but flag the coupling when you see it.
- Removing the outline only on `:focus` while leaving `:focus-visible` intact is fine. Read
  carefully before flagging.

## 2.4.11 Focus Not Obscured (Minimum) — new in 2.2

When an element receives focus, it must not be entirely hidden by other content. The usual
culprits are `position: sticky` headers and footers, cookie banners, and floating toolbars: Tab
into an element near the viewport edge and the sticky bar covers it. The user is now typing
into something they cannot see.

Check any diff that adds or changes sticky/fixed positioning. The fix is usually
`scroll-margin-top` matching the sticky element's height, or `scroll-padding-top` on the
scroll container. This is genuinely hard to catch by reading, so it is a strong argument for
the runtime arm when one is available.

## 2.5.7 Dragging Movements — new in 2.2

Anything achieved by dragging needs a single-pointer, non-dragging alternative — unless the
drag is essential to the function (a drawing canvas). Sliders, sortable lists, resize handles,
kanban boards, range pickers, map panning, swipe-to-delete.

The alternative can be modest: arrow keys once focused, numeric inputs, up/down buttons, a
"move to…" menu. It does not have to be elegant, it has to exist.

Note the overlap with 2.1.1 — a drag-only control usually fails both. Report the one that
describes the defect most directly and mention the other rather than filing twice.

## 2.5.1 Pointer Gestures / 2.5.2 Pointer Cancellation / 2.5.4 Motion Actuation

- **2.5.1** — path-based or multi-point gestures (swipe, pinch, two-finger rotate) need a
  single-pointer alternative.
- **2.5.2** — activate on `up`, not `down`. Acting on `mousedown`/`pointerdown` means a
  mis-press cannot be aborted by moving away before release. Destructive actions triggered on
  press-down are `serious` at minimum.
- **2.5.4** — device motion (shake, tilt) as the only trigger, and no way to disable it.

## 3.2.1 On Focus

Merely focusing something must not change context — no auto-submit, no navigation, no dialog
on focus. `autofocus` is a milder version of the same problem: it moves the user somewhere they
did not ask to be, and in a SPA it fires on every route entry. The linter's `no-autofocus`
covers the attribute; it does not cover a programmatic `.focus()` in `ngOnInit`.

## 2.1.4 Character Key Shortcuts

Single-character shortcuts with no modifier must be disableable, remappable, or active only
while a component has focus. Someone using speech input triggers them constantly by accident.
Check global `@HostListener('document:keydown')` handlers.

## Angular specifics

Angular CDK's `a11y` package exists for most of this, and "use the CDK primitive" is a much
better fix than hand-rolled ARIA when the profile says the CDK is available:

| Need | CDK |
|---|---|
| Trap Tab inside a modal | `cdkTrapFocus`, with `cdkFocusInitial` for the starting element |
| Arrow-key navigation in a list/menu | `FocusKeyManager` (real focus) or `ActiveDescendantKeyManager` (`aria-activedescendant`) |
| Tree navigation | `TreeKeyManager` |
| Know *how* an element was focused | `FocusMonitor` / `cdkMonitorElementFocus`, emits `FocusOrigin` (mouse, keyboard, touch, program) |
| Is this element actually focusable? | `InteractivityChecker` |
| Hide visually, keep for AT | the repo's own class first (see below); `.cdk-visually-hidden` only when CDK a11y styles are confirmed loaded |

For visually hidden text, recommend the class recorded under the profile's "In-house a11y
utilities" (`sr-only`, `visually-hidden` or the like) before anything else. `.cdk-visually-hidden`
is not a global stylesheet: the CDK injects its CSS at runtime only once one of its a11y services
(`LiveAnnouncer`, `FocusMonitor` and friends) loads it, or when the app includes the
`a11y-visually-hidden` Sass mixin or the prebuilt CDK a11y CSS. Used on its own in a template,
the class can render the "hidden" text in plain sight. Recommend it only when one of those is
confirmed in the repo, and otherwise use the repo's class or name the mixin as part of the fix.

`FocusMonitor` is the principled answer to "style focus differently for keyboard vs mouse" — it
applies `.cdk-keyboard-focused` and friends, which beats guessing with `:focus-visible`
fallbacks when you need the origin in TypeScript.

Other Angular notes: a hand-rolled focus trap where `cdkTrapFocus` is available is worth
flagging as a maintenance and correctness risk. Router navigation does not move focus by
default — after route changes, focus should go somewhere sensible (usually the new `<main>` or
its heading), or a keyboard user stays parked in the old page's nav. And a `.focus()` call in
`ngOnInit` may run before the element exists; `afterNextRender` or `ngAfterViewInit` is the
right hook.

## What the linter already covers

With the `accessibility` preset active: `click-events-have-key-events`,
`interactive-supports-focus`, `mouse-events-have-key-events`, `no-autofocus`. These check
*handler shape* — that a click has a key partner, that a handler target is focusable. They do
not check whether the key handler implements the right keys, whether focus order makes sense,
whether focus is managed across dynamic changes, or anything at all about dragging, obscuring,
or pointer alternatives. Most of your value is in what they cannot see.

## Traps

- A modal trapping Tab is correct. Do not report it as 2.1.2 unless Escape fails to release it.
- `tabindex="-1"` is correct for programmatic focus targets (a dialog container, a route
  landing heading). Only positive values are the smell.
- Not every element needs to be focusable. Making static text focusable adds noise to the Tab
  sequence and is its own defect.
- Read the whole component before reporting a missing key handler — it may be in a host
  listener, a directive, or a base class.
