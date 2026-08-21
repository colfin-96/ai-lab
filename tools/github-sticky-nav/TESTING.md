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
| 2 | PR → Conversation | Three decks: repo nav, then GitHub's own sticky header (badge + title + branch line), then the PR tabs. Should match what stock Firefox shows, with our nav and tabs added. | ⬜ layout changed in 1.5.0 |
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

## GitHub's own sticky header

As of 1.5.0 we keep GitHub's bar instead of fading it out, because it already
carries the badge, the title and the branch line. Our tab strip is stacked below
it, using a height measured every frame.

This replaced two earlier attempts at the same goal: 1.4.0 pinned a shrunken copy
of the title (reverted in 1.4.1), and `includeStateRow` pinned our own copy of
the badge row (now off by default). If GitHub's bar ever stops appearing,
`includeStateRow: true` is the fallback.

| # | Check | Expected | Status |
|---|---|---|---|
| 17 | Open PR, merged PR, closed PR, draft PR | The badge row stays visible in each case, with the correct badge | ⬜ |
| 18 | Nothing shows through the strip | Scroll a PR with a long conversation. The whole pinned strip is opaque — no comment text sliding through the gap between the state row and the tabs | ⬜ |
| 19 | Nothing extra below the strip | No blank band between the bottom of the tab strip and the page content. The block is painted opaque, so if GitHub's page-header block ever extends below its tab strip, that overhang would show up here | ⬜ |
| 20 | Links in the state row work | Click the branch name and the author link while the strip is pinned | ⬜ |
| 21 | Three decks, no overlap | Repo nav, GitHub's bar, tab strip — stacked, none covering another, nothing clipped | ⬜ |
| 22 | Title is readable | The PR title in GitHub's bar is legible and not cut off | ⬜ |
| 23 | The strip settles when GitHub's bar arrives | Scroll down slowly. The tab strip moves down once as GitHub's bar appears — expected, since that is when the space above it exists. Judge whether it reads as a glitch | ⬜ |
| 24 | No gap above the tab strip | While GitHub's bar is hidden or sliding, there is no empty band between the repo nav and the tab strip. A gap means a hidden bar is being counted as visible | ⬜ |
| 25 | Buttons in GitHub's bar work | Click something in it while pinned — it must not be inert, which the old `pointer-events: none` made it | ⬜ |
| 26 | Anchor jumps clear all three | Follow a review-comment permalink: the target lands below all three decks | ⬜ |
| 27 | `includeStateRow: true` fallback | Turn it on: our own badge row appears above the tab strip, duplicating GitHub's bar, and the fail-safe still passes | ⬜ |

### If the state row does not appear

Set `debug: true` in `CONFIG`, regenerate, reload, and open the browser console
on a PR page. Every attach logs what it found:

```
[ghsn] nav nav.js-repo-nav | wrapper div.js-header-wrapper (known wrapper)
[ghsn] tabs nav.…TabNav | block div.… | state badge span.…StateLabel…
[ghsn] geometry { navH: 48, wrapH: 96, stripH: 72, offset: 40, … }
```

`state badge none` means no selector in `STATE_SELECTORS` matched anything above
the tab strip — copy the badge's real class out of DevTools and add a selector.
A badge that is found but a `stripH` no larger than the tab strip's own height
means the badge was located but could not be covered by any pinnable block.

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
