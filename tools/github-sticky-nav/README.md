# GitHub Sticky Repo Nav

Keeps two strips reachable without scrolling back to the top of the page:

1. the repository nav — **Code / Pull requests / Agents / Actions / Insights / Settings**
2. the pull-request tabs — **Conversation / Commits / Checks / Files changed**

Both slide out of the way while you scroll **down**, and come straight back when you:

* scroll **up** even a little,
* move the mouse pointer to the very top edge of the window, or
* tab into it with the keyboard.

While your strips are showing, GitHub's own sticky PR title bar fades out, so you
never end up with three stacked decks — scroll down and it's back, exactly as
stock. On pages with no tab strip (the diff view, code browsing) GitHub's bar is
simply pushed down to clear the repo nav instead.

Screen cost: **88px** while the strips are showing, **0px** while you scroll down.

## Two ways to install

Pick one — they do the same thing and would fight each other if both were active.

| | Files | Needs |
| --- | --- | --- |
| Chrome extension | `extension/` | Chromium browser in developer mode |
| Userscript | `githubstickynav.user.js` | Tampermonkey or Violentmonkey |

### A) Chrome extension (Chrome, Edge, Brave — any Chromium browser)

1. Copy the `extension/` folder somewhere permanent — e.g.
   `Documents\github-sticky-nav`. Chrome loads the extension from that folder
   every time it starts, so don't delete or move it afterwards.
2. Open `chrome://extensions`.
3. Switch on **Developer mode** (top right).
4. Click **Load unpacked** and select the folder you copied.
5. Reload any open GitHub tab.

Chrome will show a "Disable developer mode extensions" nag on some restarts —
just dismiss it. Nothing here phones home.

To uninstall, remove the extension from `chrome://extensions`. Nothing is left
behind.

### B) Userscript (Tampermonkey / Violentmonkey)

1. Install Tampermonkey (or Violentmonkey) from your browser's extension store.
2. Tampermonkey icon → **Dashboard** → **+** to create a new script.
   (**Utilities → File → Import** works too.)
3. Paste the whole of `githubstickynav.user.js` in, replacing the template, then
   `Ctrl`/`Cmd`+`S`.
4. Reload any open GitHub tab.

To uninstall, delete the script from the Tampermonkey dashboard.

## What it can access

`manifest.json` requests **no permissions at all**, and the userscript declares
`@grant none`. Either way the code only runs on `github.com`, `*.github.com` and
`*.ghe.com`, and it does nothing but read the height of the header and toggle two
CSS classes. No network calls, no storage, no reading of page content.

Running a self-hosted GitHub Enterprise Server on your own domain? Add your host
to the `matches` array in `manifest.json`, or add a `// @match` line to the
userscript header.

## Tuning

Both versions carry the same `CONFIG` block at the top of the script —
`extension/sticky-nav.js` or `githubstickynav.user.js`. Edit it, then reload
(the reload icon on the extension card in `chrome://extensions`, or just save in
the Tampermonkey editor).

| Option | Default | Effect |
| --- | --- | --- |
| `alwaysVisible` | `false` | `true` pins the nav permanently — it never hides, costing 48px of height on every page. |
| `threshold` | `5` | Pixels of scrolling before the bar reacts. Raise it if a twitchy trackpad flickers the bar. |
| `revealOnPointerTop` | `true` | `false` turns off "reveal when the mouse touches the top edge". |
| `pinSubTabs` | `true` | `false` pins only the repo nav, leaving the PR tabs alone (and GitHub's own title bar untouched). |
| `pointerZone` | `8` | How close to the top edge (px) the pointer must get. |
| `extraOffsetSelectors` | `[]` | CSS selectors for any *other* fixed bar that sits at `top: 0` and should be pushed down while the nav shows. |

Visual tweaks (slide speed, the shadow under the bar) live in
`extension/sticky-nav.css`, or in the inlined style block at the top of the
userscript.

## How it works

Both strips use the same trick. Each one lives at the bottom of a taller,
non-sticky block — `div.js-header-wrapper` for the repo nav, the PR page-header
for the tabs. The script makes that block `position: sticky` with a
**negative** `top`, measured at runtime, so everything above the strip (the
enterprise banner, the repo title, the PR title and branch line) scrolls off the
top edge while the strip itself stays put. `transform: translateY(...)` then
hides or reveals them together.

It has to be the block rather than the `<nav>` itself: a sticky element can only
travel inside its own parent's box, so stickying a nav directly would pin it for
the first ~130px of scrolling and no further.

The rows that scroll off the top of the PR block land *behind* the repo nav
strip, which is opaque and sits one z-index higher, so they're never visible.

Heights and offsets are re-measured on every scroll frame (a couple of
`getBoundingClientRect` calls, so it's cheap), which keeps things correct across
GitHub's soft navigations, window resizes, and pages where the enterprise banner
or the tab strip isn't present.

## Keeping the two copies in sync

The extension and the userscript are separate files containing the same logic —
`extension/sticky-nav.js` plus `extension/sticky-nav.css` on one side, and the
same script with the CSS inlined on the other. A change to the behaviour has to
be made in both, and the `version` in `manifest.json` should match `@version` in
the userscript header.
