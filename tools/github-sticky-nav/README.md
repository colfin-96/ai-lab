# GitHub Sticky Repo Nav

Keeps the bits you actually navigate with reachable, without scrolling back to
the top of the page:

1. the repository nav — **Code / Pull requests / Agents / Actions / Insights / Settings**
2. the pull-request title, shrunk to one small line
3. the pull-request state row — the **Open / Merged / Closed** badge and the
   "merged N commits into `main` from `branch`" line
4. the pull-request tabs — **Conversation / Commits / Checks / Files changed**

They slide out of the way while you scroll **down**, and come straight back when you:

* scroll **up** even a little,
* move the mouse pointer to the very top edge of the window, or
* tab into it with the keyboard.

GitHub has a sticky header of its own carrying the same badge and title. While
we are showing ours, it is faded out as a duplicate. If the title cannot be
found — a renamed heading, a page shaped differently — it is kept instead and
pushed down to sit between our two strips, with its height measured so the tab
strip stacks below it. Either way you get the title once, not twice or never.

While your strips are hidden, GitHub's bar drops back to the top of the window
and behaves exactly as stock.

Screen cost: roughly **140px** while the strips are showing, **0px** while you
scroll down. `includeTitle: false` and `includeStateRow: false` get you back to
the 88px of nav plus tab strip.

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
| `includeStateRow` | `true` | `false` pins the tab strip without the state row above it — the Open/Merged badge and the "merged N commits into main" line — saving about 32px. |
| `includeTitle` | `true` | `false` leaves the title out, and lets GitHub's own sticky bar through to show it instead. Size while pinned is the `--ghsn-title-size` CSS variable, 13px by default. |
| `badgeLeft` | `true` | `false` leaves the Open/Merged badge inline at the start of the state row instead of standing it to the left of both lines. |
| `hideTitleActions` | `true` | `false` keeps the title row's buttons — the Code button, the check summary, the edit pencil — visible while pinned. They set the row's height, so keeping them costs most of what the shrink saves. |
| `stripPad` | `14` | Breathing room in px above the strip's top line — the title, or the badge when `includeTitle` is off. The block is padded by the same amount while pinned so the room exists; GitHub's own header leaves only about 13px there. |
| `pointerZone` | `8` | How close to the top edge (px) the pointer must get. |
| `extraOffsetSelectors` | `[]` | CSS selectors for any *other* fixed bar that sits at `top: 0` and should be pushed down while the nav shows. |
| `debug` | `false` | `true` logs what each attach found — nav, wrapper, tab strip, state badge, geometry, where the title and badge landed, and how long startup took — to the page console. Start here if the strip isn't picking something up. |

Visual tweaks (slide speed, the shadow under the bar) live in
`extension/sticky-nav.css`, or in the inlined style block at the top of the
userscript.

## How it works

Both strips use the same trick. Each one lives at the bottom of a taller,
non-sticky block — `div.js-header-wrapper` for the repo nav, the PR page-header
for the tabs. The script makes that block `position: sticky` with a
**negative** `top`, measured at runtime, so everything above the strip (the
enterprise banner, the repo title, the PR title) scrolls off the top edge while
the strip itself stays put. `transform: translateY(...)` then hides or reveals
them together.

It has to be the block rather than the `<nav>` itself: a sticky element can only
travel inside its own parent's box, so stickying a nav directly would pin it for
the first ~130px of scrolling and no further.

That constraint is also how the block gets found. Starting from the nav, the
script climbs past every parent whose bottom edge is level with the candidate's —
those hug the header and so offer nowhere to travel — and stops at the first
parent that extends below it. `div.js-header-wrapper` is tried first as a fast
path, but only if it passes the same test, so a renamed or restructured wrapper
falls back to the climb rather than pinning something useless.

How much of the PR block stays on screen is set by where the strip's top edge
falls: just above the highest marker being kept, which is the title when
`includeTitle` is on, otherwise the Open/Merged badge, otherwise the tab strip.

Both markers are used purely for position. The script never decides which element
counts as "the row" — an earlier version did, and it failed, because in GitHub's
header the state row and the tab strip turn out to be siblings inside one shared
container. Markers are found by named class first, then by shape (the lowest
visible `<h1>` above the tab strip), and if a marker sits outside the block picked
for the tab strip, the block widens to the nearest ancestor covering both,
provided that ancestor can still travel.

Rows above the top edge scroll off and land *behind* the repo nav strip, which is
opaque and sits one z-index higher, so they're never visible.

### Matching GitHub's compact layout

GitHub's own bar stands the Open/Merged badge to the left of two stacked lines —
title on top, "wants to merge …" underneath. Reproducing that from the outside
means working with rows we cannot reparent, so:

* the badge is taken out of flow and positioned across both lines, centred on
  their midpoint from the two rows' measured heights and pulled back by half of
  itself with a transform — its own size is something it already knows, and one
  fewer measurement is one fewer thing to go stale. Out of flow is the point: the
  badge shares a flex row with the "wants to merge" text, and that row is as tall
  as the badge, so an in-flow badge left ~14px of its own height sitting between
  the two lines. Positioning absolutely usually means guessing which ancestor is
  positioned, which is not knowable from out here — but the containing block is
  the state row, and we set that ourselves
* the gap between the two lines can belong to neither of them: their common
  ancestors carry a row-gap and padding of their own, which no rule aimed at the
  rows can reach. Those ancestors are marked too, up to but not including the
  pinned block — that one also holds the tab strip, and the space below the state
  row is the tabs' own
* the state row is indented by the badge's measured width plus `--ghsn-badge-gap`,
  and the badge sits at `left: 0`, which resolves to the row's padding edge
* the title is indented to wherever the state row's own text ended up, not to the
  same computed width. Both rows start at the same left edge, so the two ought to
  agree — but GitHub wraps that text in a container with spacing of its own, which
  left the subtitle 8px to the right of the title. Aligning to the text itself is
  one measurement and doesn't care what the wrapper does
* the "wants to merge N commits into `main`" line is shrunk to the title's size,
  and the badge deliberately isn't — GitHub keeps it full size, and its width is
  what the indent is measured from
* the buttons are hidden by structure, not by name: the script climbs from the
  title out to the pinned block and marks the siblings it passes. Only siblings
  *inside* the title row can survive as hosts — one carrying wanted text, such as
  the span holding both `#123` and the edit pencil, keeps its text and loses its
  controls. Further out there is nothing to keep, since the state row, the badge
  and the tab strip are skipped before that point, so the action area goes whole.
  That distinction is not cosmetic: the header is a CSS grid, and an item that is
  present but emptied still sizes its track, which put 12px of slack above and
  below both lines. Marking a host rather than each button matters too, because
  the header re-renders and adds buttons after we have looked. The check summary
  and the Code button live outside the title row altogether, which is why the
  climb goes as far as the block. Naming Primer's slots was tried first and
  matched nothing
* the title text is bolded, but not the issue number beside it, which GitHub
  keeps muted and normal-weight
* the title's whole row is shrunk, not just the heading, because the issue
  number sits beside it and carries its own font size. The Code button and check
  summary shrink too, which is deliberate: a row is only as short as its tallest
  item.

Finding those rows means climbing to the outermost ancestor of each marker that
still leaves the tab strip out. The obvious test — "direct child of the pinned
block" — rejects everything, because that child is usually a single container
holding the title row, the state row and the tabs together. That shape has now
broken two different versions, so it is worth stating plainly: **in GitHub's
header, do not assume the rows are separate children.**

If the lookup finds nothing the layout is simply left alone, so the styling
degrades to plain stacked rows rather than breaking.

### GitHub's own bar

The two paths are kept consistent by one trick rather than two switches: when we
show the title ourselves, the CSS fades GitHub's bar, and the height measurement
ignores anything transparent — so it reports zero and the tab strip closes the
gap without being told separately.

That measurement only ever counts a bar genuinely on screen. GitHub fades and
slides this thing in and out, so a measurable box is no proof of visibility, and
counting a hidden one would leave a dead band above the tab strip. Transparent,
`visibility: hidden`, `display: none`, or slid back above the nav all measure as
zero.

It also mounts long after our own setup runs, so we keep looking, at most every
400ms; unthrottled, a page where it never appears would run several
`querySelector` calls on every scroll frame.

While we are showing the title ourselves the height is forced to zero rather than
measured. The fade is a transition, and measuring mid-fade reads a real height for
something on its way to invisible — which made the tab strip lurch down and back.

Set `debug: true` to see what it resolved to and what height it measured.

### When it gets it wrong

The first time a page scrolls far enough to pin, the script checks that the strips
really landed where its own arithmetic predicted, within 6px. If they didn't — the
shape a GitHub header redesign would take — it removes every class it added and
stands down for that page view, so you get stock GitHub instead of a nav stuck at
some wrong offset. A navigation or a window resize gives it another go.

Heights and offsets are re-measured on every scroll frame, which keeps things
correct across GitHub's soft navigations, window resizes, and pages where the
enterprise banner or the tab strip isn't present.

### Staying cheap

Two things in here would otherwise be expensive, and both were measured rather
than assumed.

**Reads before writes.** Setting a custom property on `documentElement`
invalidates layout for the whole document, so a `getBoundingClientRect`
afterwards has to flush it again. Measuring and setting alternately cost a
full-page layout per pair — four of them per call, on every scroll frame, which
Chrome reported as `Forced reflow while executing JavaScript took 30-43ms`.
`measure()` now takes every reading first and writes every variable afterwards:
same numbers, one layout. Keep it that way when adding a measurement.

**The mutation observer runs almost nothing.** GitHub is React, and the document
mutates continuously — comments, diffs, timelines, all of it irrelevant here.
Checking whether the header changed means a `querySelectorAll` per selector, so
doing that per batch burnt the main thread for nothing. Two filters instead: is
this batch anywhere near the header (an ancestor-chain test, no selectors, no
layout), and has a check run in the last 250ms. A header swap noticed a quarter
of a second late costs nothing.

The throttle runs immediately when idle and otherwise schedules a single trailing
run. A plain debounce is the wrong shape: on a busy page the mutations never stop
long enough for one to fire.

`debug: true` also times each phase of startup — the browser attributes the
page's first full layout to whoever forces it, which is us, so a single total
tells you nothing about which part is actually ours.

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
