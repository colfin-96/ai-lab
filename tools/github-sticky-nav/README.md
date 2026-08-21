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

Pick the row for your browser. Both do the same thing and would fight each other
if you ran both at once.

| Browser | Install | Files |
| --- | --- | --- |
| Chrome, Edge, Brave — any Chromium | extension, loaded unpacked | `extension/` |
| Firefox | userscript | `githubstickynav.user.js` |
| Anything with Tampermonkey | userscript | `githubstickynav.user.js` |

**Why no Firefox extension?** Firefox refuses to permanently install an extension
that hasn't been signed by Mozilla — there is no equivalent of Chrome's
load-unpacked. You can side-load this folder through `about:debugging` → "Load
Temporary Add-on", but it is dropped the moment you restart the browser. Getting
a permanent install would mean an AMO account and a signing submission per
release, to deliver exactly what the userscript already delivers. So Firefox gets
the userscript.

### A) Chromium extension (Chrome, Edge, Brave)

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

### B) Userscript (Firefox, or any browser with Tampermonkey)

1. Install Tampermonkey (or Violentmonkey) from your browser's add-on store —
   both are signed add-ons, so this works normally in Firefox.
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

## Testing a change

There is no test suite — the script only means anything inside a real GitHub page.
[TESTING.md](TESTING.md) is the manual checklist: which pages to walk, what
correct looks like on each, and how to verify the fail-safe still fires.

## Tuning

Both versions carry the same `CONFIG` block at the top of the script. Edit it,
then reload — the reload icon on the extension card in `chrome://extensions`, or
just save in the Tampermonkey editor.

Tweaking your own installed copy is fine either way. If you are changing the
version in this repo, edit `extension/sticky-nav.js` and regenerate — see
[Keeping the two copies in sync](#keeping-the-two-copies-in-sync).

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

That constraint is also how the block gets found. Starting from the nav, the
script climbs past every parent whose bottom edge is level with the candidate's —
those hug the header and so offer nowhere to travel — and stops at the first
parent that extends below it. `div.js-header-wrapper` is tried first as a fast
path, but only if it passes the same test, so a renamed or restructured wrapper
falls back to the climb rather than pinning something useless.

The rows that scroll off the top of the PR block land *behind* the repo nav
strip, which is opaque and sits one z-index higher, so they're never visible.

### When it gets it wrong

The first time a page scrolls far enough to pin, the script checks that the strips
really landed where its own arithmetic predicted, within 6px. If they didn't — the
shape a GitHub header redesign would take — it removes every class it added and
stands down for that page view, so you get stock GitHub instead of a nav stuck at
some wrong offset. A navigation or a window resize gives it another go.

Heights and offsets are re-measured on every scroll frame (a couple of
`getBoundingClientRect` calls, so it's cheap), which keeps things correct across
GitHub's soft navigations, window resizes, and pages where the enterprise banner
or the tab strip isn't present.

## Keeping the two copies in sync

**`extension/` is the source of truth. `githubstickynav.user.js` is generated —
don't edit it by hand.**

Make every change in `extension/sticky-nav.js`, `extension/sticky-nav.css`, or
`extension/manifest.json`, then regenerate:

```bash
cd tools/github-sticky-nav
node build.mjs
```

The generated userscript is committed, because Tampermonkey users install it by
copying the file straight out of the repo. Before committing a change, confirm
the two are in step:

```bash
node build.mjs --check    # exits non-zero if the committed file is stale
```

`build.mjs` needs Node and nothing else — no `package.json`, no dependencies,
nothing to install. It inlines the stylesheet into the userscript's template
literal, appends the behaviour verbatim, and fills the metadata block from
`userscript-header.txt`: `{{version}}` comes from `manifest.json`, and the
`@match` lines are generated from the manifest's `matches` array, so the two
installs can never disagree about which hosts they cover.

Editing the metadata block — the `@name`/`@description`/install notes — means
editing `userscript-header.txt`, not the generated file.
