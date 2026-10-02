# Framework notes

WCAG criteria are framework-agnostic: they describe what reaches the user, and the browser does
not know what built the DOM. What changes per framework is *where the defect hides* and *what
the idiomatic fix looks like* — and getting the idiom wrong is how a correct finding gets
dismissed in review.

Read the section for the stack in the profile. The agnostic part applies everywhere.

## Agnostic: where component frameworks lose accessibility

**Semantics dissolve at component boundaries.** `<app-button>`, `<Button>`, `<my-button>` have
no implicit role. Whatever accessibility exists lives in what the component *renders*, so the
call site tells you almost nothing. Always read the component's own template before concluding a
name or role is missing — and when a name might arrive from the consumer via slots or
projection, say the finding is conditional rather than asserting it.

**Conditional rendering breaks references.** `aria-labelledby` and `aria-describedby` point at
IDs. Any conditional that removes the target leaves a dangling reference: nothing errors, no
warning appears, the name is simply gone. This is one of the highest-yield things to look for in
any framework with declarative control flow.

**Generated IDs collide.** A component rendered in a loop with a hardcoded `id="email-error"`
produces duplicate IDs, and `aria-describedby` resolves to whichever the browser picks first.
Use the framework's unique-ID facility.

**Client-side routing skips what the browser used to do.** A full page load moves focus to the
top, resets the reading position, and re-announces the page. Client-side navigation does none of
it. Two consequences worth checking on every routing change: the document title must update per
route (2.4.2), and focus must move somewhere sensible — usually the new main region or its
heading — or a keyboard user stays parked in the nav they just left (2.4.3).

**Reactive state and the accessibility tree drift apart.** Visual state comes from one binding
and `aria-expanded` from another, and eventually they disagree. Bind both to the same source.

**Async updates are silent.** Data arriving from a request re-renders the view without
announcing anything. Loading, success, error and result-count states all need a live region if
they do not move focus (4.1.3).

**Portals and overlays escape their DOM context.** Content teleported to the body loses its
ancestor relationships — `aria-labelledby` across the boundary, `lang` inheritance, and
`aria-hidden` on the background all need explicit handling.

**Shadow DOM breaks ID references entirely.** `aria-labelledby` cannot cross a shadow boundary.
Web components need `aria-label` or delegated internals instead.

## Angular

**Attribute vs property binding.** ARIA attributes are not DOM properties, so they need the
`attr.` prefix: `[attr.aria-label]="label"`, not `[aria-label]="label"`. The second silently
does nothing on a plain element — it looks correct in review and fails at runtime. This is worth
searching for directly.

**`[attr.aria-label]` on a component names its host, not its control.** On a third-party wrapper
the host tag (`<lib-button>`) usually has no role; the real `<button>` or `<input>` is inside
its template. An `aria-label` on a role-less host names nothing and fails 4.1.2 while looking
correct in review. Supply a name in this order, taking the first that applies:

1. **The component's own aria input** — the library's documented `ariaLabel` /
   `ariaLabelledBy`-style input, which it forwards to the inner element.
2. **`[attr.aria-label]` / `[attr.aria-labelledby]` on a native element** you render yourself —
   `button`, `input`, `section`, `fieldset`.
3. **The library's pass-through to an inner element**, for a component with no aria input: a
   pass-through or slot-props API that sets attributes on a named inner part. Check the key in the
   rendered DOM — a wrong part name is silently ignored.
4. **`aria-labelledby` pointing at a visible heading** on a wrapper you own, in preference to a
   visually hidden label.

PrimeNG shows the shape: `ariaLabel` on `p-button` is step 1, its `pt` pass-through is step 3.
Other libraries name these differently; the order is the rule, not the input names. Whatever the
route, inspect the rendered DOM to confirm the name landed on the element that has the role.

**Names may live in TypeScript.** `@HostBinding('attr.aria-label')`, a directive, or a base
class can supply what the template appears to be missing. Check the class before reporting.

**Control flow around live regions.** `@if` / `*ngIf` wrapping an `aria-live` container means the
container is created at the same moment as its content — so nothing observes the change and
nothing is announced. Put the control flow *inside* the region. This is the Angular-shaped
version of the generic live-region bug and it is extremely common.

**`OnPush` and signals** change *when* the DOM updates relative to state. An announcement
dispatched in the same tick as a state change can fire before the content exists. `afterNextRender`
is the reliable hook for anything that must observe rendered output; `.focus()` in `ngOnInit`
may run before the element exists.

### Angular CDK — `@angular/cdk/a11y`

When the profile says the CDK is present, prefer these over hand-rolled ARIA. They are tested
across screen readers, and "use the CDK primitive" is a fix that gets merged.

| Need | Use |
|---|---|
| Trap Tab inside a modal or drawer | `cdkTrapFocus`, with `cdkFocusInitial` on the element to focus first, `cdkFocusRegionStart` / `cdkFocusRegionEnd` to bound it |
| Arrow-key navigation with real focus | `FocusKeyManager` (options implement `FocusableOption`) |
| Arrow-key navigation via `aria-activedescendant` | `ActiveDescendantKeyManager` (options implement `Highlightable`) |
| Tree / treegrid navigation | `TreeKeyManager` |
| Announce a message imperatively | `LiveAnnouncer.announce()` — manages one persistent region correctly, sidestepping the container-created-too-late bug |
| Declarative live region | `cdkAriaLive` |
| Know *how* focus arrived | `FocusMonitor` / `cdkMonitorElementFocus` / `cdkMonitorSubtreeFocus`, emitting `FocusOrigin` (`mouse`, `keyboard`, `touch`, `program`); applies `.cdk-focused`, `.cdk-keyboard-focused` and friends |
| Test whether an element is really focusable | `InteractivityChecker` |
| Hide visually, keep for assistive tech | the repo's own visually-hidden class first; `.cdk-visually-hidden` only when CDK a11y styles are confirmed loaded (see below) |
| Style for forced-colors / high-contrast mode | the `high-contrast` Sass mixin |

**`.cdk-visually-hidden` is not always styled.** Its CSS is not global: the CDK injects it at
runtime only once one of its a11y services loads it, or the app ships it through the
`a11y-visually-hidden` Sass mixin or the prebuilt CDK a11y CSS. A template that uses the class
without any of those renders the "hidden" text visibly. So recommend the class recorded under the
profile's "In-house a11y utilities" (`sr-only`, `visually-hidden` or the like) first, and
`.cdk-visually-hidden` only when the repo is confirmed to load its styles.

`FocusMonitor` deserves special mention: it is the principled answer to "show the focus ring for
keyboard but not mouse", better than juggling `:focus-visible` fallbacks when the origin is
needed in TypeScript.

### Angular Material

Material components carry tested accessibility, which cuts both ways: it removes whole classes
of finding, and it makes overrides the likeliest place a defect lives.

- `<mat-form-field>` associates `<mat-label>`, `<mat-error>` and `<mat-hint>` with the control
  automatically, wiring `aria-describedby` when invalid. A Material field with a label and error
  is usually conformant — **do not report it as unlabelled for lacking `<label for>`.** What does
  fail: a bare `<input matInput placeholder="...">` with no `mat-label`, or an error element
  outside the form field.
- `<mat-snack-bar>` announces through `LiveAnnouncer` already. Check its `politeness` and
  `announcementMessage` rather than reporting it as silent.
- `::ng-deep` overrides of Material colours are a far likelier contrast defect than the component
  defaults. Prioritise them.
- Icon-only `<button mat-icon-button>` still needs an `aria-label` — Material does not invent one.
  A bare `<mat-icon>` also announces its ligature text as content, which is usually unwanted;
  inside a labelled button it wants `aria-hidden="true"`.

### Angular forms

Validation state lives on the `FormControl` and **none of it reaches assistive technology on its
own.** `Validators.required` does not add `required` or `aria-required` to the DOM;
`control.invalid` does not add `aria-invalid`. Outside `mat-form-field`, the template has to bind
these explicitly. A control with validators and no template wiring is a real finding — the
validation works perfectly and is entirely invisible.

Custom controls implementing `ControlValueAccessor` must expose name, role, state, disabled and
invalid themselves; the interface only carries values.

### Angular i18n

With `@angular/localize` or a translation library, `<html lang>` must follow the active locale
rather than being hardcoded. Hardcoded user-facing strings in a localised app — including `alt`
text and `aria-label` values — are worth an `advisory`, a `convention` finding when the repo's
accessibility convention requires translated names, and an `AA-violation` of 3.1.2 when the
literal's language differs from the page's and nothing marks it. And the same action reached through two
different translation keys is a latent 3.2.4 inconsistency: the moment one key's text is edited,
they diverge.

## Other frameworks

The criteria and the agnostic section above carry over unchanged. Idiom differences worth
knowing:

**React** — `htmlFor` rather than `for`, `className` rather than `class`; ARIA attributes keep
their hyphens (`aria-label`) and need no prefix. `useId` for unique IDs. Portals for overlays,
with the same escaped-context caveats. `eslint-plugin-jsx-a11y` is the linter analogue and covers
roughly the same presence-and-validity ground.

**Vue** — `:aria-label` binds attributes directly. Single-file components scope styles like
Angular's, so a colour pair may be split across files. `eslint-plugin-vuejs-accessibility` is
the linter analogue.

**Web components** — shadow DOM is the big one: ID-based ARIA references cannot cross the
boundary, so `aria-labelledby` between a light-DOM label and a shadow-DOM input silently fails.
Use `aria-label`, or the element internals API. Slotted content keeps its original scope for
styling but not for ID resolution.
