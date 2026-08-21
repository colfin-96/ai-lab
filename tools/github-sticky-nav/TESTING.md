# Testing github-sticky-nav

This tool only means anything inside a real GitHub page: it reads live layout
geometry and reacts to GitHub's own single-page-app navigation. There is no test
suite, because the parts worth testing are exactly the parts a headless DOM
cannot reproduce — jsdom has no layout engine, so every `getBoundingClientRect`
returns zeroes and the entire measurement half of the script goes untested.

So this is a manual checklist. Walk it after any change to `extension/`.

**Status is recorded in the tables below**, so a half-finished pass is not lost.
Legend: ✅ passed · ❌ failed · ⬜ not yet run. Reset a row to ⬜ when the code it
covers changes, and note the version a result was seen on where it matters.

## Before you start

```bash
cd tools/github-sticky-nav
node build.mjs            # regenerate the userscript from extension/
node build.mjs --check    # confirm the committed file matches
```

Then reload the extension in `chrome://extensions` (the reload icon on its card),
or save the script in the Tampermonkey editor, and hard-reload the GitHub tab.

Test whichever install you actually run. They are generated from the same source,
so a behaviour difference between them is a bug in `build.mjs`, not in the logic.

## The checklist

For each page: scroll down past the header, then scroll up a little.

| # | Page | Expected | Status |
|---|---|---|---|
| 1 | Repo home (`/owner/repo`) | Repo nav (Code / Issues / Pull requests / …) sticks at the top. Slides away on scroll down, returns on scroll up. | ✅ 1.3.0 |
| 2 | PR → Conversation | Repo nav, then the shrunk title, then the state row (badge + "merged N commits into main from …"), then the PR tabs. Same information stock Firefox shows in GitHub's own bar, plus our nav and tabs. | ⬜ layout changed in 1.6.0 |
| 3 | PR → Files changed | Same strips. The diff's own sticky file headers still work and do not overlap our strips. | ⬜ |
| 4 | Issue page | Repo nav plus the issue state row and tab strip, same shape as a PR. | ⬜ |
| 5 | Code browsing (`/blob/…`) | Repo nav only — no tab strip on this page. GitHub's sticky file header is pushed down to clear our nav. | ⬜ |
| 6 | Non-repo page (dashboard, `/settings`, a gist, a profile) | Nothing happens at all. No stray bar, no layout shift. | ⬜ |

## Behaviours to check once

| # | Check | How | Expected | Status |
|---|---|---|---|---|
| 7 | Reveal on pointer | Scroll down so the strips hide, then move the mouse to the very top edge of the window | Strips slide back in | ⬜ |
| 8 | Reveal on keyboard | Scroll down so the strips hide, then press <kbd>Tab</kbd> until focus enters the nav | Strips slide back in, focused item visible | ⬜ |
| 9 | Open menu is not yanked away | Open a dropdown in the repo nav, and again in the PR tab strip, then scroll down | Strips stay put while the menu is open | ⬜ |
| 10 | Anchor jumps | Follow a link to an anchor further down the page (a review comment permalink) | Target lands below the strips, not underneath them | ⬜ |
| 11 | Soft navigation | From the repo home, click into a PR, then into Files changed, without a full reload | Strips re-attach correctly on each page, no doubled or orphaned bars | ⬜ |
| 12 | Narrow window | Shrink the window to roughly phone width | Nav still pins, nothing overlaps or clips | ⬜ |
| 13 | Dark mode | Switch GitHub's theme to dark | Pinned strips are opaque and match the page background — no transparent strip with text showing through | ⬜ |
| 14 | Reduced motion | Enable the OS "reduce motion" setting | Strips snap instead of sliding; no animation | ⬜ |
| 15 | Print | <kbd>Cmd</kbd>+<kbd>P</kbd> on a long PR | No floating bar in the print preview | ⬜ |
| 16 | Back / forward | Navigate away and press Back | Strips work on the restored page | ⬜ |

## The title, and GitHub's own sticky header

Getting the title on screen took four goes, which is worth recording so it is
not attempted a fifth time the same way:

| Version | Approach | Outcome |
|---|---|---|
| 1.4.0 | pin our own shrunken title | worked, but looked redundant — reverted |
| 1.4.1 | no title, rely on GitHub's bar | title absent in Chrome: our own CSS was fading GitHub's bar out |
| 1.5.0 | stop fading it, stack below it | still absent — under our pinning GitHub never reveals its bar at all, because the real title never leaves the viewport |
| 1.6.0 | pin our own title again, fade GitHub's bar only while ours is showing | title appeared, but at full size and wrapping |
| 1.6.1 | shrink the title's descendants too, not just the heading | title shrank, but #123 beside it did not — it is a sibling, not a child |
| 1.7.0 | shrink the whole title row; stand the badge to the left of both lines | no visible change: the row lookup required a direct child of the block and so matched nothing |
| 1.7.1 | climb to the outermost ancestor that excludes the tabs; lift the badge in flow | issue number shrank correctly, badge moved left but its top was clipped |
| 1.7.2 | switch off clipping on the badge's row and the block | still wonky — the debug log showed why |
| 1.7.3 | prefer the outermost of nested matches; never match an SVG | badge correct at last; row still showed the Code button and check summary, title too light |
| 1.8.0 | hide the title row's buttons, bold the title, align both rows off one indent | current |

Working assumption: **GitHub's bar cannot be relied on while we pin the header.**
It is the fallback for when the title cannot be found, not the primary path.

Two separate lessons from the same area, both worth keeping:

* What we mark as the title is a heading whose text is wrapped in further
  elements, and the issue number sits *beside* it rather than inside — so
  shrinking the heading, or even its descendants, leaves `#123` full size. The
  shrink has to cover the whole row.
* Marker selection must prefer the **outermost** of nested matches. Primer names
  the icon inside a badge after the badge, so `[class*="StateLabel"]` matches
  both the pill and the `<svg>` glyph inside it — and a "take the lowest
  candidate" rule picks the glyph, because it is inset. That produced a 16px
  indent and a clipped icon being lifted instead of the badge. Elements that are
  not `HTMLElement` are skipped outright.
* GitHub's header does not give each row its own child of the block. Title row,
  state row and tab strip commonly share one container, which is why any test of
  the form "is this a direct child of the block" matches nothing. This has broken
  1.3.0 and 1.7.0 in different ways. Climb to the outermost ancestor that still
  excludes the tab strip instead.

| # | Check | Expected | Status |
|---|---|---|---|
| 17 | Open PR, merged PR, closed PR, draft PR | The badge row stays visible in each case, with the correct badge | ⬜ |
| 18 | Nothing shows through the strip | Scroll a PR with a long conversation. The whole pinned strip is opaque — no comment text sliding through the gaps between the rows | ⬜ |
| 19 | Nothing extra below the strip | No blank band between the bottom of the tab strip and the page content. The block is painted opaque, so if GitHub's page-header block ever extends below its tab strip, that overhang would show up here | ⬜ |
| 20 | Links in the state row work | Click the branch name and the author link while the strip is pinned | ⬜ |
| 21 | The title is there and small | One line, legible, ellipsised rather than wrapped on a very long title | ⬜ |
| 22 | Shown once, not twice | No second copy of the badge and title from GitHub's own bar overlapping ours | ⬜ |
| 23 | No dead band | No empty gap between the strips where GitHub's faded bar might still be measured | ⬜ |
| 24 | The layout shift is tolerable | Scroll down past the header and back up. Content shifts once as the title shrinks and grows. If it annoys, raise `--ghsn-title-size` or set `includeTitle: false` | ⬜ |
| 25 | Title row is actually shorter | Compare against `includeTitle: false`. The row's height may be floored by the `Code` button beside the title, in which case shrinking the text saves less than expected | ⬜ |
| 26 | Anchor jumps clear everything | Follow a review-comment permalink: the target lands below all the strips | ⬜ |
| 27 | Fallback path | Set `includeTitle: false`, regenerate, reload. Either GitHub's own bar appears between the strips — check it is not overlapped and the tab strip sits below it — or it does not appear at all, which is the 1.5.0 finding and means the fallback is cosmetic only | ⬜ |
| 28 | Badge stands left | The Open/Merged badge sits to the left of both text lines, vertically centred against them, not inline at the start of the second | ⬜ |
| 29 | Indent matches the badge | No text overlapping the badge, and no excessive gap. A wide badge (Draft, Merged) still lines up | ⬜ |
| 30 | Issue number is small | `#123` is the same size as the title beside it | ⬜ |
| 31 | Badge does not drift | Scroll, resize, and soft-navigate between PRs. The badge stays centred on the two rows rather than sliding off | ⬜ |
| 32 | `badgeLeft: false` | Badge goes back inline at the start of the state row, rows lose their indent | ⬜ |
| 33 | Buttons gone while pinned | No Code button, check summary or edit pencil in the pinned title row — and all of them back at the top of the page | ⬜ |
| 34 | Rows share a left edge | The title and the "wants to merge" line start at exactly the same x | ⬜ |
| 35 | Title reads as a title | Title bolder than the branch line beside it; `#123` still muted and normal weight | ⬜ |
| 36 | Height actually dropped | The strip is noticeably shorter than 1.7.3, since the buttons were setting the row height | ⬜ |
| 37 | `hideTitleActions: false` | Buttons come back while pinned | ⬜ |

### If something is not picked up

Set `debug: true` in `CONFIG` and read the page console.

* **Userscript**: Tampermonkey icon → Dashboard → the script → change
  `debug: false` to `debug: true` → save → reload the GitHub tab → open the
  console. No rebuild needed; you are editing your installed copy.
* **Extension**: edit `extension/sticky-nav.js`, run `node build.mjs`, hit the
  reload icon on the extension's card in `chrome://extensions`, reload the tab.

The log looks like this:

```
[ghsn] nav nav.js-repo-nav | wrapper div.js-header-wrapper (known wrapper)
[ghsn] tabs nav.…TabNav | block header.… | state badge span.…StateLabel… | title h1.…
[ghsn] GitHub's bar not in the DOM -> height 0
[ghsn] geometry { navH: 48, wrapH: 96, stripH: 104, offset: 40, ghBarH: 0, … }
```

`title none` or `state badge none` means no selector matched anything above the
tab strip — copy the real class out of DevTools and add a selector. A stand-down
logs the position it measured against the one it expected.

Read the element names, not just whether they are present. A marker resolving to
an `svg`, or to something obviously smaller than what you meant, is the failure
mode that cost 1.7.0 through 1.7.2 — the classes were being applied all along,
just to the wrong nodes.

## The fail-safe

The script verifies its own work. The first time a page scrolls far enough to pin
the strips, it checks that they actually landed where the geometry predicted
(within `PIN_TOLERANCE`, 6px). If they did not — which is what a GitHub header
redesign would look like — it removes all of its own classes and stands down, so
you get stock GitHub rather than a nav wedged at some wrong offset.

To confirm the fail-safe still works, break the geometry on purpose. In
`extension/sticky-nav.js`, make `measure` pin the wrapper 100px lower than it
should:

```js
setVar('--ghsn-pin-top', navH - wrapH + 100);   // temporary: forces a stand-down
```

That is the offset the strips are actually pinned by, so it moves them where the
check can see it. Inflating `--ghsn-nav-h` instead would *not* work: it does not
move the wrapper, so the strips still land where the check expects them.

Reload, open a PR, scroll down past the header. Expected: the strips appear
briefly, then vanish entirely and the page behaves like stock GitHub for the rest
of that page view. Revert the edit afterwards and regenerate.

Two things worth knowing about the stand-down:

- It lasts until the next real navigation or a window resize. It deliberately
  does **not** retry off the back of DOM mutations, because standing down clears
  the script's own element references, which the `MutationObserver` would
  otherwise read as "the header changed" — that would flap on and off forever.
- If GitHub ever soft-navigates without firing any of the events in
  `renavigate`'s list, a stand-down could outlast the page it belonged to. A
  resize or a reload clears it.

## Known limitation

Selector rot is invisible until it bites. If GitHub renames the repo nav, the
script finds nothing and quietly does nothing — page 1 of the checklist simply
shows a page that no longer sticks. There is no alarm for this by design; the
alternative is a false alarm on every page you visit that legitimately has no
repo nav.
