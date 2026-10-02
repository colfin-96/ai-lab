# WCAG 2.2 — Level A + AA criteria map

Every Level A and AA success criterion in WCAG 2.2: **55 rows — 31 Level A, 24 Level AA.**
Generated from the normative spec at <https://www.w3.org/TR/WCAG22/>, not from recall.

This file is the map, not the method. It answers *which* criteria exist, *who* owns each one, and
*what breaks for a person* when it fails. How to actually check a criterion lives in the owning
playbook — that split keeps each member's read small.

**Why A is in scope for an AA target:** AA conformance requires satisfying Level A as well. A
missing `alt` is a Level A failure and still sinks an AA claim, so A criteria are not optional here.

**On version columns:** WCAG versions are cumulative — 2.2 contains all of 2.1, which contains all
of 2.0. Conforming to 2.2 AA means you have conformed to 2.1 AA and 2.0 AA. There is nothing to
audit separately per version, which is why there is one file rather than one per version. When 2.3
arrives, replace this file wholesale. The `Since` column exists only because criteria added in 2.2
are the ones tooling and habit most often miss — treat those rows as the highest-yield reads.

4.1.1 Parsing was removed in WCAG 2.2 and is deliberately absent. Do not report it.

**Reading the `Linter` column:** it names the `@angular-eslint/eslint-plugin-template` rule that
touches the criterion, and in brackets what it can actually see. Nearly every one checks *presence*
or *validity*, never *quality* — `alt-text` cannot tell you the alt text is wrong, and `valid-aria`
cannot tell you the role is inappropriate. A criterion with a rule is only skippable when the
profile confirms that rule genuinely runs here, and even then the quality half stays yours.

| SC | Name | Level | Since | Owner | Linter | What breaks for a person |
|---|---|---|---|---|---|---|
| 1.1.1 | Non-text Content | A | 2.0 | `media-alt` | `alt-text` (presence only) | a screen-reader user gets "image" or a filename instead of the information the image carries |
| 1.2.1 | Audio-only and Video-only (Prerecorded) | A | 2.0 | `media-alt` | — | someone who cannot hear the audio or see the video has no equivalent to read |
| 1.2.2 | Captions (Prerecorded) | A | 2.0 | `media-alt` | — | a deaf user cannot follow prerecorded speech |
| 1.2.3 | Audio Description or Media Alternative (Prerecorded) | A | 2.0 | `media-alt` | — | a blind user misses information the video only shows |
| 1.2.4 | Captions (Live) | AA | 2.0 | `media-alt` | — | a deaf user cannot follow a live stream |
| 1.2.5 | Audio Description (Prerecorded) | AA | 2.0 | `media-alt` | — | a blind user misses what the video shows but never says |
| 1.3.1 | Info and Relationships | A | 2.0 | `semantics-aria` | `table-scope`, `label-has-associated-control` (partial) | structure that exists only visually (bold pseudo-headings, layout tables) vanishes for a screen-reader user |
| 1.3.2 | Meaningful Sequence | A | 2.0 | `semantics-aria` | — | reading and tab order do not match the visual order, so content arrives scrambled |
| 1.3.3 | Sensory Characteristics | A | 2.0 | `visual-contrast` | — | instructions say "the round button on the right", which means nothing without sight |
| 1.3.4 | Orientation | AA | 2.1 | `visual-contrast` | — | content locks to one orientation, unusable on a mounted device or wheelchair tray |
| 1.3.5 | Identify Input Purpose | AA | 2.1 | `forms-errors` | — | autofill cannot identify the field, so it has to be typed by hand every time |
| 1.4.1 | Use of Color | A | 2.0 | `visual-contrast` | — | colour alone marks the error or state, invisible to a colour-blind user |
| 1.4.2 | Audio Control | A | 2.0 | `media-alt` | — | audio that starts on load drowns out the screen reader |
| 1.4.3 | Contrast (Minimum) | AA | 2.0 | `visual-contrast` | — | low-contrast text is unreadable with low vision or in bright light |
| 1.4.4 | Resize Text | AA | 2.0 | `visual-contrast` | — | text breaks or clips when zoomed to 200% |
| 1.4.5 | Images of Text | AA | 2.0 | `visual-contrast` | — | text baked into an image turns to mush when enlarged |
| 1.4.10 | Reflow | AA | 2.1 | `visual-contrast` | — | content needs horizontal scrolling at 320px, so a zoomed user pans every line |
| 1.4.11 | Non-text Contrast | AA | 2.1 | `visual-contrast` | — | a control border, focus ring or icon is too faint to locate |
| 1.4.12 | Text Spacing | AA | 2.1 | `visual-contrast` | — | increasing line, letter or word spacing clips or overlaps the text |
| 1.4.13 | Content on Hover or Focus | AA | 2.1 | `dynamic-live` | — | a tooltip or popover vanishes before it can be read, or covers what is underneath |
| 2.1.1 | Keyboard | A | 2.0 | `keyboard-focus` | `click-events-have-key-events`, `interactive-supports-focus`, `mouse-events-have-key-events` (handler shape only) | a keyboard-only user cannot operate the control at all |
| 2.1.2 | No Keyboard Trap | A | 2.0 | `keyboard-focus` | — | focus enters a widget and cannot get out, stranding the keyboard user |
| 2.1.4 | Character Key Shortcuts | A | 2.1 | `keyboard-focus` | — | a single-key shortcut fires by accident for someone using speech input |
| 2.2.1 | Timing Adjustable | A | 2.0 | `dynamic-live` | — | a session, carousel or countdown expires faster than someone can act |
| 2.2.2 | Pause, Stop, Hide | A | 2.0 | `dynamic-live` | `no-distracting-elements` (`<blink>`/`<marquee>` only) | moving content cannot be paused, making the text beside it unreadable |
| 2.3.1 | Three Flashes or Below Threshold | A | 2.0 | `dynamic-live` | — | flashing content can trigger a seizure |
| 2.4.1 | Bypass Blocks | A | 2.0 | `semantics-aria` | — | a keyboard user tabs through the entire nav on every page before reaching content |
| 2.4.2 | Page Titled | A | 2.0 | `semantics-aria` | — | a screen-reader user with many tabs open cannot tell which page is which |
| 2.4.3 | Focus Order | A | 2.0 | `keyboard-focus` | — | tab order jumps around and the keyboard user loses their place |
| 2.4.4 | Link Purpose (In Context) | A | 2.0 | `semantics-aria` | `elements-content` (empty link only) | "click here" out of context tells someone browsing by link list nothing |
| 2.4.5 | Multiple Ways | AA | 2.0 | `consistency` | — | there is only one route to a page, and it is the one this user cannot use |
| 2.4.6 | Headings and Labels | AA | 2.0 | `semantics-aria` | — | a vague heading or label gives no clue what the section or field is for |
| 2.4.7 | Focus Visible | AA | 2.0 | `keyboard-focus` | — | a keyboard user cannot see where they are |
| 2.4.11 | Focus Not Obscured (Minimum) | AA | 2.2 | `keyboard-focus` | — | a sticky header, toolbar or cookie banner hides the focused element |
| 2.5.1 | Pointer Gestures | A | 2.1 | `keyboard-focus` | — | a path-based or multi-finger gesture is the only way to act |
| 2.5.2 | Pointer Cancellation | A | 2.1 | `keyboard-focus` | — | the action fires on press-down, so a slip cannot be taken back |
| 2.5.3 | Label in Name | A | 2.1 | `semantics-aria` | — | a voice-control user speaks the visible label and nothing happens |
| 2.5.4 | Motion Actuation | A | 2.1 | `keyboard-focus` | — | shaking or tilting the device is the only way to trigger something |
| 2.5.7 | Dragging Movements | AA | 2.2 | `keyboard-focus` | — | dragging is the only way, locking out anyone without fine pointer control |
| 2.5.8 | Target Size (Minimum) | AA | 2.2 | `visual-contrast` | — | a tap target too small to hit reliably with a tremor or a thumb |
| 3.1.1 | Language of Page | A | 2.0 | `semantics-aria` | — | the screen reader pronounces the page with the wrong language rules |
| 3.1.2 | Language of Parts | AA | 2.0 | `semantics-aria` | — | a foreign phrase is read with the wrong pronunciation |
| 3.2.1 | On Focus | A | 2.0 | `keyboard-focus` | `no-autofocus` (autofocus only) | merely focusing a field changes the page, disorienting whoever just tabbed in |
| 3.2.2 | On Input | A | 2.0 | `forms-errors` | — | changing a field submits or navigates with no warning |
| 3.2.3 | Consistent Navigation | AA | 2.0 | `consistency` | — | navigation moves between pages, so learned positions stop working |
| 3.2.4 | Consistent Identification | AA | 2.0 | `consistency` | — | the same function is named or iconed differently in different places |
| 3.2.6 | Consistent Help | A | 2.2 | `consistency` | — | help sits somewhere different on each page, so it cannot be found reliably |
| 3.3.1 | Error Identification | A | 2.0 | `forms-errors` | — | the form failed but does not say which field or why |
| 3.3.2 | Labels or Instructions | A | 2.0 | `forms-errors` | `label-has-associated-control` (association only) | a field with no label leaves the user guessing what to type |
| 3.3.3 | Error Suggestion | AA | 2.0 | `forms-errors` | — | the error says "invalid" without saying what would be valid |
| 3.3.4 | Error Prevention (Legal, Financial, Data) | AA | 2.0 | `forms-errors` | — | a legal commitment, financial transaction, change or delete of stored user data, or test-response submission offers no undo, error check or confirmation; not other destructive actions |
| 3.3.7 | Redundant Entry | A | 2.2 | `forms-errors` | — | the same information must be re-entered from memory later in the same flow |
| 3.3.8 | Accessible Authentication (Minimum) | AA | 2.2 | `forms-errors` | — | logging in demands solving a puzzle or recalling a code, with no alternative |
| 4.1.2 | Name, Role, Value | A | 2.0 | `semantics-aria` | `valid-aria`, `role-has-required-aria`, `elements-content` (validity only, never name quality) | a custom control announces as "clickable" with no name, role or state |
| 4.1.3 | Status Messages | AA | 2.1 | `dynamic-live` | — | a result count, save confirmation or validation summary appears silently for a screen-reader user |

## Coverage by member

| Member | Criteria owned | Count |
|---|---|---|
| `media-alt` | 1.1.1, 1.2.1, 1.2.2, 1.2.3, 1.2.4, 1.2.5, 1.4.2 | 7 |
| `semantics-aria` | 1.3.1, 1.3.2, 2.4.1, 2.4.2, 2.4.4, 2.4.6, 2.5.3, 3.1.1, 3.1.2, 4.1.2 | 10 |
| `keyboard-focus` | 2.1.1, 2.1.2, 2.1.4, 2.4.3, 2.4.7, 2.4.11, 2.5.1, 2.5.2, 2.5.4, 2.5.7, 3.2.1 | 11 |
| `visual-contrast` | 1.3.3, 1.3.4, 1.4.1, 1.4.3, 1.4.4, 1.4.5, 1.4.10, 1.4.11, 1.4.12, 2.5.8 | 10 |
| `forms-errors` | 1.3.5, 3.2.2, 3.3.1, 3.3.2, 3.3.3, 3.3.4, 3.3.7, 3.3.8 | 8 |
| `dynamic-live` | 1.4.13, 2.2.1, 2.2.2, 2.3.1, 4.1.3 | 5 |
| `consistency` | 2.4.5, 3.2.3, 3.2.4, 3.2.6 | 4 |
| **total** | | **55** |

Exactly one owner per criterion, and every criterion owned. That is the point of the table: when a
run reports clean, the coverage is provable rather than assumed. If you add a member or move a
criterion, keep the invariant — an unowned criterion is one nobody checks and nobody notices.

New in 2.2 and in scope (six, not four — two are Level A): 2.4.11, 2.5.7, 2.5.8, 3.2.6, 3.3.7, 3.3.8

