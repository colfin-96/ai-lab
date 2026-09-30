# semantics-aria

**Owns** 1.3.1, 1.3.2, 2.4.1, 2.4.2, 2.4.4, 2.4.6, 2.5.3, 3.1.1, 3.1.2, 4.1.2 — structure,
roles, accessible names, language.

You are the member whose findings a linter can least replace. `valid-aria` proves an attribute
is spelled correctly; only judgement can tell whether the role is the right one and whether the
name says something a stranger could act on. Spend your effort there.

## The core question

For every interactive or structural element in the diff, ask what a screen reader will
announce: **name, role, state.** If you cannot answer all three from the markup, that is the
finding. If the answer is technically present but useless — `aria-label="button"`,
`alt="image"`, a heading reading "Section" — that is also the finding, and the linter will
never catch it.

## 4.1.2 Name, Role, Value

The highest-yield criterion in the whole set, and the one most often failed by custom
components.

- **Native first.** A `<div (click)>` needs `role`, `tabindex`, keyboard handlers and state
  wiring to equal what `<button>` gives for free — and it will be wrong in some browser or AT
  combination. When you see interactive semantics bolted onto a `div` or `span`, the fix is
  usually "use the native element", not "add three more attributes". Say that.
- **Icon-only controls.** An icon button whose content is a glyph, an `<svg>`, or a font-icon
  span has no accessible name. This is the single most common real violation in component-heavy
  Angular codebases. The name must describe the *action* ("Delete invoice"), not the icon
  ("trash").
- **State.** Toggles, expanders and selections need `aria-expanded`, `aria-pressed`,
  `aria-selected`, `aria-checked` — bound to the same source of truth as the visual state, not
  a duplicate flag that can drift. A visual chevron that rotates while `aria-expanded` stays
  `false` is a real defect.
- **Redundant or conflicting roles.** `<button role="button">` is noise; `<ul role="list">` is
  sometimes needed (Safari drops list semantics when `list-style: none` is applied) — know the
  difference before flagging.

## Accessible name quality

A name exists to let someone identify and speak the control. Judge it against that:

- Does it describe the outcome, not the widget?
- Would it be unambiguous in a list of forty names read aloud in sequence? Six buttons all
  named "Edit" are technically named and practically useless — `aria-label="Edit line item 3"`
  or a visually hidden suffix fixes it.
- **2.5.3 Label in Name.** When a control has visible text, the accessible name must *contain*
  that text. `aria-label="Submit form"` on a button reading "Send" breaks voice control: the
  user says "click Send" and nothing happens. This is a frequent, invisible regression when
  someone adds an `aria-label` to a control that already had visible text, believing they are
  helping.

## 1.3.1 Info and Relationships

Structure that exists only visually does not exist at all for a screen reader.

- Bold or large text acting as a heading instead of `<h1>`–`<h6>`.
- Heading levels skipped (`<h2>` then `<h4>`) — the outline is how screen-reader users navigate
  a page, and a gap reads as a missing section.
- Groups of related controls without `<fieldset>`/`<legend>` or `role="group"` + label.
- Tables: `<th>`, `scope`, `<caption>`. Layout tables should not be tables at all.
- Lists marked up as `<div>`s lose "list, 7 items", which is real navigational information.
- `aria-labelledby` / `aria-describedby` pointing at IDs that do not exist, are duplicated, or
  live in a different shadow root. Verify the target exists in the same DOM scope.

## 1.3.2 Meaningful Sequence

DOM order is what screen readers and Tab follow. When CSS reorders content visually —
`flex-direction: row-reverse`, `order`, `grid-template-areas`, absolute positioning — the two
diverge and the content arrives in an order that does not match what is on screen. Check any
diff that introduces visual reordering.

## Landmarks and page structure — 2.4.1, 2.4.2

- One `<main>`, plus `<nav>`, `<header>`, `<footer>`, `<aside>` where they apply. Multiple
  landmarks of the same type need distinguishing labels.
- A skip link, working, and visible on focus. A skip link that stays hidden when focused is
  worse than none because it looks handled.
- **2.4.2 Page Titled** in a single-page app is a *routing* concern: the title must change on
  navigation. In Angular this means a `Title` service call per route or a resolver — a static
  `index.html` title fails this on every route but the first. Worth checking whenever routes
  are added.

## Links vs buttons — 2.4.4

A link navigates; a button acts. Getting this wrong breaks expectations for keyboard users
(Enter vs Space) and misleads anyone navigating by links list. `<a (click)>` with no `href` is
neither — it is not focusable and not a real link.

Link text must make sense in isolation, because screen-reader users routinely pull up a list of
every link on the page. "Click here", "Read more", "Details" ×12 all fail.

## Language — 3.1.1, 3.1.2

`<html lang>` must be present and correct — it selects the speech synthesiser's pronunciation
rules, and the wrong value makes the whole page unintelligible. In an i18n app the value has to
follow the active locale rather than being hardcoded. Inline foreign-language passages need
`lang` on the wrapping element.

## Angular specifics

- Host bindings and `@HostBinding('attr.aria-*')` mean the name may be set in the component
  class rather than the template. Check both before reporting a missing name.
- A component's own tag (`<app-icon-button>`) has no implicit role — semantics live on what it
  renders internally, so read the component template, not just the call site.
- `ng-content` projection: the accessible name may arrive from the consumer. If it might, say
  the finding is conditional rather than asserting it.
- Structural directives (`@if`, `@for`, `*ngIf`) can remove the element an `aria-labelledby`
  points at. A dangling reference is silent — nothing errors, the name is just gone.
- `attr.` prefix is required for ARIA on non-property attributes: `[attr.aria-label]`, not
  `[aria-label]`. The latter silently does nothing on a plain element, which looks correct in
  review and fails at runtime. Flag it.
- On a third-party component, `[attr.aria-label]` usually lands on a role-less host and names
  nothing. `references/framework-notes.md` § Angular gives the order to supply a name in — the
  component's own aria input first.

## What the linter already covers

When the profile confirms the `accessibility` preset is active: `valid-aria`,
`role-has-required-aria`, `elements-content`, `table-scope`, `alt-text`. Skip re-checking
attribute *validity* and element *emptiness*. Never skip name *quality*, role
*appropriateness*, heading *hierarchy*, or landmark structure — no rule in that preset sees any
of it.

## Traps

- Do not demand ARIA where native semantics already work. Added ARIA that duplicates or
  overrides native roles is a common way to make things worse, and "no ARIA" is often the
  correct answer.
- `aria-hidden="true"` on a focusable element is a real defect (it becomes a focusable
  invisible stop), but `aria-hidden` on decorative icons inside a labelled button is correct —
  do not flag the latter.
- A visually hidden label is a legitimate way to supply an accessible name (4.1.2), not a
  violation. Check it is genuinely clipped rather than `display: none`, which removes it from the
  accessibility tree entirely.
- **Except as the only label on a form input.** 3.3.2 Labels or Instructions (Level A) requires
  a label or instruction sighted users can see; a hidden `<label>` or a bare `aria-label` on an
  `<input>` satisfies 4.1.2 and still fails 3.3.2 when nothing visible says what to enter. A
  visible heading, legend or adjacent text counts — so where one exists, prefer
  `aria-labelledby` pointing at it over a hidden label. 3.3.2 belongs to `forms-errors`; hand it
  over rather than clearing the field here.
