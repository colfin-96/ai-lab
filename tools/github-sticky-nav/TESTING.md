# Testing github-sticky-nav

This tool only means anything inside a real GitHub page: it reads live layout
geometry and reacts to GitHub's own single-page-app navigation. There is no test
suite, because the parts worth testing are exactly the parts a headless DOM
cannot reproduce — jsdom has no layout engine, so every `getBoundingClientRect`
returns zeroes and the entire measurement half of the script goes untested.

So this is a manual checklist. Walk it after any change to `extension/`.

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

| # | Page | Expected |
|---|---|---|
| 1 | Repo home (`/owner/repo`) | Repo nav (Code / Issues / Pull requests / …) sticks at the top. Slides away on scroll down, returns on scroll up. |
| 2 | PR → Conversation | Two strips: repo nav on top, PR tabs (Conversation / Commits / Checks / Files changed) directly below. GitHub's own sticky PR title bar is *not* visible while both strips show. |
| 3 | PR → Files changed | Same two strips. The diff's own sticky file headers still work and do not overlap our strips. |
| 4 | Issue page | Repo nav plus the issue tab strip, same as a PR. |
| 5 | Code browsing (`/blob/…`) | Repo nav only — no tab strip on this page. GitHub's sticky file header is pushed down to clear our nav rather than hidden. |
| 6 | Non-repo page (dashboard, `/settings`, a gist, a profile) | Nothing happens at all. No stray bar, no layout shift. |

## Behaviours to check once

| # | Check | How | Expected |
|---|---|---|---|
| 7 | Reveal on pointer | Scroll down so the strips hide, then move the mouse to the very top edge of the window | Strips slide back in |
| 8 | Reveal on keyboard | Scroll down so the strips hide, then press <kbd>Tab</kbd> until focus enters the nav | Strips slide back in, focused item visible |
| 9 | Open menu is not yanked away | Open a dropdown in the repo nav, and again in the PR tab strip, then scroll down | Strips stay put while the menu is open |
| 10 | Anchor jumps | Follow a link to an anchor further down the page (a review comment permalink) | Target lands below the strips, not underneath them |
| 11 | Soft navigation | From the repo home, click into a PR, then into Files changed, without a full reload | Strips re-attach correctly on each page, no doubled or orphaned bars |
| 12 | Narrow window | Shrink the window to roughly phone width | Nav still pins, nothing overlaps or clips |
| 13 | Dark mode | Switch GitHub's theme to dark | Pinned strips are opaque and match the page background — no transparent strip with text showing through |
| 14 | Reduced motion | Enable the OS "reduce motion" setting | Strips snap instead of sliding; no animation |
| 15 | Print | <kbd>Cmd</kbd>+<kbd>P</kbd> on a long PR | No floating bar in the print preview |
| 16 | Back / forward | Navigate away and press Back | Strips work on the restored page |

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
