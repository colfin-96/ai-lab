// ==UserScript==
// @name         GitHub Sticky Repo Nav
// @namespace    https://github.com/colfin-96/ai-lab
// @version      1.5.0
// @description  Keeps GitHub's repo nav and the PR tab strip (Conversation / Commits / Checks / Files changed) reachable: they hide as you scroll down and slide back in the moment you scroll up.
// @author       colfin-96
// @match        https://github.com/*
// @match        https://*.github.com/*
// @match        https://*.ghe.com/*
// @run-at       document-start
// @grant        none
// @noframes
// ==/UserScript==

/* ---------------------------------------------------------------------------
 * INSTALL
 *   1. Install Tampermonkey (or Violentmonkey) from the Chrome Web Store.
 *   2. Tampermonkey icon -> Dashboard -> "+" (Utilities > File > Import also works).
 *   3. Paste this whole file in, replacing the template, then Ctrl/Cmd+S.
 *   4. Reload any open GitHub tab.
 *
 * Self-hosted GitHub Enterprise Server on your own domain? Add a line like
 *   // @match        https://github.example.com/*
 * to the header above.
 *
 * BEHAVIOUR
 *   Two strips are pinned to the top: the repo nav (Code / Pull requests /
 *   Actions / ...) and the PR tab strip (Conversation / Commits / Checks /
 *   Files changed). They slide away as you scroll down and come back when you
 *   scroll up, move the pointer to the top edge, or tab into them. While they
 *   show, GitHub's own sticky PR title bar fades out, so you never get three
 *   stacked decks.
 *
 * TUNING
 *   See the CONFIG block further down. `alwaysVisible: true` pins the strips
 *   permanently; `pinSubTabs: false` goes back to the repo nav alone.
 * ------------------------------------------------------------------------- */

/* ---- styles (identical to the extension's sticky-nav.css) ---------------- */
(() => {
  'use strict';
  const CSS = `
/* GitHub Sticky Repo Nav
 *
 * Two strips are pinned to the top of the viewport:
 *   1. the repository nav  (Code / Pull requests / Agents / Actions / ...)
 *   2. the pull-request tab strip (Conversation / Commits / Checks / Files
 *      changed), optionally with the state row above it — the Open/Merged badge
 *      and the "merged N commits into main from ..." line
 * Both auto-hide while you scroll down and slide back in when you scroll up.
 *
 * GitHub's own sticky PR header is kept — pushed down to sit between the two —
 * because it already shows the state badge, the title and the branch line.
 * sticky-nav.js measures its height so the tab strip stacks below it.
 *
 * All geometry comes from CSS custom properties that sticky-nav.js measures at
 * runtime, so this keeps working when GitHub changes header heights, when the
 * enterprise banner is present/absent, or on narrow windows.
 */

:root {
  --ghsn-nav-h: 48px;      /* height of the repo nav strip                    */
  --ghsn-pin-top: 0px;     /* repo nav: navH - full header height (negative)  */
  --ghsn-tabs-h: 0px;      /* visible height of the PR strip (0 = none here)  */
  --ghsn-tabs-top: 0px;    /* PR block: navH - strip offset (negative)        */
  --ghsn-tabs-shift: 0px;  /* how far to lift the PR block when hiding        */
  --ghsn-ghbar-h: 0px;     /* GitHub's own sticky bar, 0 when not showing     */
  --ghsn-dur: 160ms;       /* slide / fade duration                           */
}

/* ---- strip 1: the repository nav ------------------------------------ */

html.ghsn-active .ghsn-wrapper {
  position: sticky !important;
  top: var(--ghsn-pin-top) !important;
  z-index: 13;                       /* above strip 2 and GitHub's own bars */
  transition: transform var(--ghsn-dur) ease;
  will-change: transform;
}

html.ghsn-active.ghsn-pinned.ghsn-hidden .ghsn-wrapper {
  /* +4px so the strip's drop shadow clears the top of the window too */
  transform: translateY(calc(-1 * (var(--ghsn-nav-h) + 4px)));
}

/* ---- strip 2: the pull-request tab strip ---------------------------- */
/* We pin the whole PR page-header block with a negative offset so only its
 * lower rows stay on screen — the tab strip, plus the state row above it when
 * includeStateRow is on. Everything higher up lands behind strip 1, which is
 * opaque, so it is never visible. */

html.ghsn-active.ghsn-tabs .ghsn-tabsblock {
  position: sticky !important;
  top: var(--ghsn-tabs-top) !important;
  z-index: 12;
  transition: transform var(--ghsn-dur) ease;
  will-change: transform;
}

html.ghsn-active.ghsn-tabs.ghsn-pinned.ghsn-hidden .ghsn-tabsblock {
  transform: translateY(calc(-1 * var(--ghsn-tabs-shift)));
}

/* ---- make the pinned strips opaque --------------------------------- */
/* Only while actually pinned, so the top of the page looks untouched.  */

html.ghsn-active.ghsn-pinned .ghsn-nav,
html.ghsn-active.ghsn-pinned .ghsn-tabstrip {
  background-color: var(--bgColor-default, var(--color-canvas-default, #ffffff)) !important;
}

/* The pinned PR strip can be more than just the tab nav — with includeStateRow
 * it starts at the "Merged / merged N commits into main" row — so the block
 * itself has to be opaque, or page content shows through the rows between the
 * state row and the tabs. The rows above, which sit behind the repo nav, are
 * covered by it: the nav is opaque and one z-index higher. */

html.ghsn-active.ghsn-pinned.ghsn-tabs .ghsn-tabsblock {
  background-color: var(--bgColor-default, var(--color-canvas-default, #ffffff)) !important;
}

html.ghsn-active.ghsn-pinned .ghsn-nav {
  box-shadow:
    inset 0 -1px 0 var(--borderColor-muted, var(--color-border-muted, #d1d9e0)),
    0 3px 6px -3px rgba(0, 0, 0, 0.12);
}

html.ghsn-active.ghsn-pinned.ghsn-tabs .ghsn-nav {
  box-shadow: inset 0 -1px 0 var(--borderColor-muted, var(--color-border-muted, #d1d9e0));
}

html.ghsn-active.ghsn-pinned.ghsn-tabs .ghsn-tabstrip {
  box-shadow: 0 3px 6px -3px rgba(0, 0, 0, 0.12);
}

/* ---- GitHub's own fixed sticky bars -------------------------------- */

html.ghsn-active.ghsn-pinned [class*="use-sticky-header-module__stickyHeader"],
html.ghsn-active.ghsn-pinned [class*="StickyPullRequestHeader-module"],
html.ghsn-active.ghsn-pinned [class*="StickyIssueHeader-module"],
html.ghsn-active.ghsn-pinned .gh-header-sticky,
html.ghsn-active.ghsn-pinned .ghsn-offset {
  transition: top var(--ghsn-dur) ease, opacity var(--ghsn-dur) ease;
}

/* GitHub's bar is the deck between ours: it carries the state badge, the title
 * and the branch line, which is exactly what we would otherwise have to rebuild.
 * So we let it through and push it below the repo nav, and sticky-nav.js stacks
 * the tab strip below it in turn (--ghsn-ghbar-h).
 *
 * While our strips are hidden it goes back to top: 0 and behaves as stock. */

html.ghsn-active.ghsn-pinned [class*="use-sticky-header-module__stickyHeader"],
html.ghsn-active.ghsn-pinned [class*="StickyPullRequestHeader-module"],
html.ghsn-active.ghsn-pinned [class*="StickyIssueHeader-module"],
html.ghsn-active.ghsn-pinned .gh-header-sticky,
html.ghsn-active.ghsn-pinned .ghsn-offset {
  top: var(--ghsn-nav-h) !important;
}

html.ghsn-active.ghsn-pinned.ghsn-hidden [class*="use-sticky-header-module__stickyHeader"],
html.ghsn-active.ghsn-pinned.ghsn-hidden [class*="StickyPullRequestHeader-module"],
html.ghsn-active.ghsn-pinned.ghsn-hidden [class*="StickyIssueHeader-module"],
html.ghsn-active.ghsn-pinned.ghsn-hidden .gh-header-sticky,
html.ghsn-active.ghsn-pinned.ghsn-hidden .ghsn-offset {
  top: 0 !important;
}

/* ---- anchor jumps shouldn't land underneath the pinned strips ------- */

html.ghsn-active {
  scroll-padding-top: calc(var(--ghsn-nav-h) + var(--ghsn-ghbar-h) + var(--ghsn-tabs-h) + 8px);
}

/* ---- accessibility -------------------------------------------------- */

@media (prefers-reduced-motion: reduce) {
  html.ghsn-active .ghsn-wrapper,
  html.ghsn-active .ghsn-tabsblock,
  html.ghsn-active.ghsn-pinned [class*="stickyHeader"] {
    transition: none !important;
  }
}

/* Printing should never include a floating bar. */
@media print {
  html.ghsn-active .ghsn-wrapper,
  html.ghsn-active .ghsn-tabsblock {
    position: static !important;
    transform: none !important;
  }
}
`;
  const style = document.createElement('style');
  style.id = 'ghsn-styles';
  style.textContent = CSS;
  // document.head may not exist yet at document-start.
  (document.head || document.documentElement).appendChild(style);
})();

/* ---- behaviour (identical to the extension's sticky-nav.js) ------------- */
/* GitHub Sticky Repo Nav — content script
 *
 * Pins two strips to the top of the window:
 *   1. the repository nav  (Code / Pull requests / Agents / Actions / ...)
 *   2. the pull-request tab strip (Conversation / Commits / Checks / Files
 *      changed), stacked below GitHub's own sticky header
 *
 * They slide out of the way when you scroll down and come straight back when
 * you scroll up, touch the top edge of the window with the mouse, or tab into
 * them. GitHub's own sticky PR header is kept rather than faded out, pushed down
 * to sit between the two: it already shows the state badge, the title and the
 * branch line, so rebuilding that ourselves would only duplicate it.
 *
 * If the strips do not land where the geometry predicted — because GitHub has
 * restructured its header and we pinned the wrong block — the script strips its
 * own classes and stands down, leaving stock GitHub rather than a nav wedged at
 * the wrong offset.
 *
 * No permissions, no network, no storage. Tweak CONFIG below to taste.
 */
(() => {
  'use strict';

  const CONFIG = {
    // Never hide them — pin the strips permanently instead of auto-hiding.
    alwaysVisible: false,
    // Pixels of scrolling before we react (kills jitter on trackpads).
    threshold: 5,
    // Bring the strips back when the mouse pointer reaches the top edge.
    revealOnPointerTop: true,
    pointerZone: 8,
    // Also pin the PR tab strip. Set false for the repo nav alone.
    pinSubTabs: true,
    // Keep our own copy of the state row — the Open/Merged/Closed badge and the
    // "merged N commits into main from ..." line — above the tab strip. Off by
    // default because GitHub's own sticky header already shows that, plus the
    // title, and we now let it through instead of fading it out. Turn this on if
    // GitHub's bar ever stops appearing.
    includeStateRow: false,
    // Extra selectors for other fixed bars that sit at top: 0 and should be
    // pushed down while the nav shows. Matching elements get .ghsn-offset.
    extraOffsetSelectors: [],
    // Log what was found on each attach to the page console. Useful when the
    // strip is not picking up something you expected it to.
    debug: false,
  };

  const NAV_SELECTORS = [
    'nav[aria-label="Repository"]',
    'nav.js-repo-nav',
    '.UnderlineNav[aria-label="Repository"]',
  ];

  const TAB_SELECTORS = [
    'nav[aria-label="Pull request navigation tabs"]',
    'nav[aria-label="Issue navigation tabs"]',
    '[class*="PullRequestHeaderTabNav-module__TabNav"]',
  ];

  // The Open / Merged / Closed / Draft badge. Used only as a position marker:
  // wherever it sits, the strip starts just above it, which keeps its whole row
  // — "<user> merged N commits into main from <branch>" — on screen.
  // GitHub's own sticky header: the compact bar carrying the state badge, the
  // title and the branch line. We push it below our nav and stack our tab strip
  // underneath it, so its height is part of our geometry.
  const GH_BAR_SELECTORS = [
    '[class*="use-sticky-header-module__stickyHeader"]',
    '[class*="StickyPullRequestHeader-module"]',
    '[class*="StickyIssueHeader-module"]',
    '.gh-header-sticky',
  ];

  const STATE_SELECTORS = [
    '[class*="StateLabel"]',
    '[class*="stateLabel"]',
    '.State',
    '.gh-header-meta .State',
  ];

  const root = document.documentElement;

  let nav = null;       // the repo nav <nav>
  let wrapper = null;   // block we pin so the repo nav stays put
  let tabs = null;      // the PR tab strip <nav>
  let block = null;     // block we pin so the tab strip stays put
  let stateBadge = null; // Open/Merged badge, when we are keeping its row visible
  let ghBar = null;      // GitHub's own sticky header, once it turns up
  let ghBarSeen = 0;     // when we last looked for it

  // stripH is the height of everything we keep visible from the PR block, and
  // offset is where that strip starts inside the block — the point that should
  // land at navH once pinned, which is also what the fail-safe checks.
  const geo = { navH: 0, wrapH: 0, stripH: 0, offset: 0, ghBarH: 0, tabsTop: 0, tabsShift: 0 };

  let lastY = 0;
  let hidden = false;
  let ticking = false;

  // Fail-safe state. 'armed' means we have pinned but not yet confirmed the
  // strips landed where we predicted; 'ok' means they did; 'failed' means they
  // did not and we have stood down for this page view. Re-armed when the nav
  // element changes, on a navigation, and on a resize — but deliberately not on
  // every attach, since mutation-driven attaches fire constantly.
  let verdict = 'armed';

  // A failed verdict has to outlast the stand-down that follows it. Standing
  // down nulls our element refs, which is precisely what the MutationObserver
  // watches for, so without this the observer would re-attach, fail, and stand
  // down again in a loop. Only a real navigation (or a resize) clears it.
  let stoodDown = false;

  // How far the pinned strips may sit from their predicted position before we
  // call the pin broken. Generous enough to absorb sub-pixel rounding and
  // GitHub's own 1px borders, tight enough that a wrong container is obvious.
  const PIN_TOLERANCE = 6;

  // When the strips last started sliding. Measuring mid-slide would read the
  // transform's interpolated position and condemn a pin that is fine, so the
  // check waits for the transition to finish.
  let lastSlide = 0;
  const SLIDE_SETTLE = 250;

  // Headroom kept above the state badge so its row is not sheared off at the top.
  const STATE_PAD = 8;

  const log = (...args) => { if (CONFIG.debug) console.log('[ghsn]', ...args); };

  /* ---------------- element discovery ---------------- */

  const findFirst = (selectors) => {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.getBoundingClientRect().height > 0) return el;
    }
    return null;
  };

  // How far a parent must extend below a candidate before we call it room to
  // travel. Small, because we only need to tell "hugs the header" apart from
  // "is the page column"; how *much* room is enough is a separate question,
  // answered by hasTravelRoom below.
  const ROOM_SLACK = 8;
  const MAX_CLIMB = 10;

  const bottomOf = (el) => el.getBoundingClientRect().bottom;

  // `position: sticky` can only travel inside its own parent's box. A parent
  // whose bottom edge is level with the candidate's gives it nowhere to go, so
  // pinning there would hold for a few hundred pixels of scrolling and no
  // further. Climb past every such parent and stop at the first one that
  // actually extends below us — that is the block we can pin.
  //
  // This is deliberately a statement about what sticky positioning needs rather
  // than a guess about how tall GitHub's containers happen to be, so it should
  // survive a redesign that changes those heights. If it stops being true, the
  // post-pin check in verifyPin catches it and we stand down.
  const climbToPageBlock = (el) => {
    for (let i = 0; i < MAX_CLIMB; i++) {
      const parent = el.parentElement;
      if (!parent || parent === document.body || parent === document.documentElement) return el;
      if (bottomOf(parent) - bottomOf(el) > ROOM_SLACK) return el;
      el = parent;
    }
    return el;
  };

  // The state badge, searched document-wide rather than inside the block we
  // picked: the badge's row and the tab strip are often siblings in a shared
  // container, and the block may not reach far enough up to include it.
  //
  // We use the badge only for its position — the top of the pinned strip is
  // derived from where the badge sits, not from any assumption about which
  // element is "the row". That keeps working however GitHub nests the header.
  const findStateBadge = () => {
    if (!CONFIG.includeStateRow || !tabs) return null;

    const tabsTop = tabs.getBoundingClientRect().top;
    for (const sel of STATE_SELECTORS) {
      for (const el of document.querySelectorAll(sel)) {
        if (tabs.contains(el)) continue;
        const r = el.getBoundingClientRect();
        // Must be visible and above the tab strip to be worth keeping on screen.
        if (r.height > 0 && r.top < tabsTop) return el;
      }
    }
    return null;
  };

  // The badge has to be inside the block we pin, or pinning cannot keep it on
  // screen. When our block stopped short of it, widen to the nearest ancestor
  // that covers both — provided that ancestor can still travel.
  const widenToCover = (start, needle) => {
    let el = start;
    for (let i = 0; i < MAX_CLIMB; i++) {
      if (el.contains(needle)) return hasTravelRoom(el) ? el : null;
      const parent = el.parentElement;
      if (!parent || parent === document.body || parent === document.documentElement) return null;
      el = parent;
    }
    return null;
  };

  // Enough slack below the block for pinning to be worth anything at all. A
  // block whose parent runs out a few pixels down would unpin almost at once.
  const hasTravelRoom = (el) => {
    const parent = el.parentElement;
    if (!parent) return false;
    return bottomOf(parent) - bottomOf(el) > Math.max(200, window.innerHeight * 0.5);
  };

  /* ---------------- GitHub's own sticky header ---------------- */

  // It mounts when GitHub decides to show it, which is well after our attach, so
  // we look again as we go — throttled, because when the bar never appears this
  // would otherwise run a handful of querySelectors on every scroll frame.
  const GH_BAR_RETRY = 400;

  const resolveGhBar = () => {
    if (ghBar && ghBar.isConnected) return;
    const now = performance.now();
    if (now - ghBarSeen < GH_BAR_RETRY) return;
    ghBarSeen = now;
    for (const sel of GH_BAR_SELECTORS) {
      const el = document.querySelector(sel);
      if (el) { ghBar = el; return; }
    }
    ghBar = null;
  };

  // Height only when it is actually on screen. GitHub fades and slides this bar
  // in and out, so a measurable box is not proof that anything is visible — and
  // counting a hidden bar would leave a gap above our tab strip.
  const measureGhBar = () => {
    resolveGhBar();
    if (!ghBar || !ghBar.isConnected) return 0;

    const r = ghBar.getBoundingClientRect();
    if (r.height < 8) return 0;
    // We pin it at navH, so a bar that has been slid away sits at or above that.
    if (r.bottom <= geo.navH + 1) return 0;

    const cs = getComputedStyle(ghBar);
    if (cs.visibility === 'hidden' || cs.display === 'none') return 0;
    if (parseFloat(cs.opacity) < 0.1) return 0;

    return Math.round(r.height);
  };

  /* ---------------- geometry ---------------- */

  const setVar = (name, px) => root.style.setProperty(name, px + 'px');

  // Cheap enough to run on every scroll frame, which keeps the geometry correct
  // across GitHub's soft navigations and header changes (and when
  // ResizeObserver callbacks are throttled, e.g. in a background tab).
  const measure = () => {
    if (!nav || !nav.isConnected || !wrapper || !wrapper.isConnected) return false;

    const navH = Math.round(nav.getBoundingClientRect().height);
    const wrapH = Math.max(Math.round(wrapper.getBoundingClientRect().height), navH);
    if (!navH || !wrapH) return false;

    if (navH !== geo.navH || wrapH !== geo.wrapH) {
      geo.navH = navH;
      geo.wrapH = wrapH;
      setVar('--ghsn-nav-h', navH);
      setVar('--ghsn-pin-top', navH - wrapH);
    }

    const ghBarH = measureGhBar();
    if (ghBarH !== geo.ghBarH) {
      geo.ghBarH = ghBarH;
      setVar('--ghsn-ghbar-h', ghBarH);
    }

    // Strip 2 is optional: plenty of pages don't have one.
    if (!tabs || !tabs.isConnected || !block || !block.isConnected) {
      if (geo.stripH !== 0) {
        geo.stripH = 0;
        setVar('--ghsn-tabs-h', 0);
      }
      root.classList.remove('ghsn-tabs');
      return true;
    }

    const tr = tabs.getBoundingClientRect();
    const br = block.getBoundingClientRect();
    // The strip runs from the top of the anchor row — the state row, when we
    // found one — down to the bottom of the tab strip. Without an anchor row
    // that is just the tab strip itself.
    let top = tr.top;
    if (stateBadge && stateBadge.isConnected) {
      const sr = stateBadge.getBoundingClientRect();
      // A little headroom above the badge so its row doesn't look sheared off,
      // and never above the block itself — we cannot show what we don't pin.
      if (sr.height > 0 && sr.top < tr.top) top = Math.max(br.top, sr.top - STATE_PAD);
    }
    const stripH = Math.round(tr.bottom - top);
    const offset = Math.round(top - br.top);      // strip's position in the block
    const blockH = Math.round(br.height);
    if (stripH <= 0 || !blockH) return true;

    // Lands the strip below strip 1 and below GitHub's own bar, which sits
    // between the two and carries the badge, title and branch line.
    const tabsTop = navH + ghBarH - offset;
    // Lift far enough to clear whichever reaches lower — the strip itself (it
    // can overflow its block's measured height) or the block's bottom edge —
    // plus a few px so the drop shadow doesn't smudge the top of the window.
    const tabsShift = navH + ghBarH + Math.max(stripH, blockH - offset) + 4;

    geo.offset = offset;
    if (stripH !== geo.stripH || tabsTop !== geo.tabsTop || tabsShift !== geo.tabsShift) {
      geo.stripH = stripH;
      geo.tabsTop = tabsTop;
      geo.tabsShift = tabsShift;
      setVar('--ghsn-tabs-h', stripH);
      setVar('--ghsn-tabs-top', tabsTop);
      setVar('--ghsn-tabs-shift', tabsShift);
    }
    root.classList.add('ghsn-tabs');
    return true;
  };

  /* ---------------- show / hide ---------------- */

  const contains = (el, node) => !!el && el.contains(node);

  // An open dropdown counts as an interaction wherever it is: menus live in the
  // PR tab strip as well as the repo nav.
  const hasOpenMenu = (el) => !!el && !!el.querySelector('[aria-expanded="true"]');

  const busy = () =>
    // Don't yank the strips away mid-interaction.
    contains(wrapper, document.activeElement) ||
    contains(block, document.activeElement) ||
    hasOpenMenu(wrapper) ||
    hasOpenMenu(block);

  const setHidden = (next) => {
    if (next === hidden) return;
    hidden = next;
    lastSlide = performance.now();
    root.classList.toggle('ghsn-hidden', hidden);
  };

  // Confirm the strips actually landed where the geometry said they would. If
  // GitHub restructures its header and we end up pinning the wrong block, this
  // is what turns a nav wedged at the wrong offset back into stock GitHub.
  //
  // Only meaningful once we are clearly past the pin point and nothing is
  // mid-slide, hence the callers' guards.
  const verifyPin = () => {
    const navTop = Math.round(nav.getBoundingClientRect().top);
    if (Math.abs(navTop) > PIN_TOLERANCE) {
      log('nav landed at', navTop, 'expected 0');
      return false;
    }

    if (geo.stripH && tabs && tabs.isConnected) {
      // Whatever we made the top of the strip is what should land just under the
      // nav and GitHub's own bar.
      const stripTop = Math.round(block.getBoundingClientRect().top + geo.offset);
      const expected = geo.navH + geo.ghBarH;
      if (Math.abs(stripTop - expected) > PIN_TOLERANCE) {
        log('strip top landed at', stripTop, 'expected', expected);
        return false;
      }
    }
    return true;
  };

  const standDown = () => {
    root.classList.remove('ghsn-active', 'ghsn-pinned', 'ghsn-hidden', 'ghsn-tabs');
    clearMarks();
    clearExtraOffsets();
    ro?.disconnect();
    nav = wrapper = tabs = block = stateBadge = ghBar = null;
    hidden = false;
  };

  const update = () => {
    ticking = false;
    if (verdict === 'failed') return;
    if (!nav || !nav.isConnected) return;
    measure();

    const y = Math.max(0, window.scrollY);
    // Pinned == the header has scrolled far enough that only the strips are left.
    const pinLine = Math.max(0, geo.wrapH - geo.navH);
    const pinned = y > pinLine + 1;
    root.classList.toggle('ghsn-pinned', pinned);

    // Check once, well clear of the pin line so a boundary reading can't
    // condemn a pin that is actually fine, and never while a slide is settling.
    if (verdict === 'armed' && pinned && !hidden && y > pinLine + 24 &&
        performance.now() - lastSlide > SLIDE_SETTLE) {
      if (verifyPin()) {
        verdict = 'ok';
      } else {
        verdict = 'failed';
        stoodDown = true;
        standDown();
        return;
      }
    }

    if (!pinned || CONFIG.alwaysVisible) {
      setHidden(false);
      lastY = y;
      return;
    }

    const dy = y - lastY;
    if (Math.abs(dy) < CONFIG.threshold) return;
    lastY = y;

    if (dy < 0) setHidden(false);
    else if (!busy()) setHidden(true);
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  /* ---------------- wiring ---------------- */

  const tagExtraOffsets = () => {
    for (const sel of CONFIG.extraOffsetSelectors) {
      document.querySelectorAll(sel).forEach((el) => el.classList.add('ghsn-offset'));
    }
  };

  // Soft navigations reuse elements, so tags from the previous page have to go
  // before we re-tag — otherwise a bar that no longer matches keeps being
  // pushed down.
  const clearExtraOffsets = () => {
    document.querySelectorAll('.ghsn-offset').forEach((el) => el.classList.remove('ghsn-offset'));
  };

  const clearMarks = () => {
    wrapper?.classList.remove('ghsn-wrapper');
    nav?.classList.remove('ghsn-nav');
    block?.classList.remove('ghsn-tabsblock');
    tabs?.classList.remove('ghsn-tabstrip');
  };

  let ro = null;

  const describe = (el) =>
    !el ? 'none' : `${el.tagName.toLowerCase()}${el.className ? '.' + String(el.className).trim().split(/\s+/).join('.') : ''}`;

  const attachTabs = () => {
    const found = CONFIG.pinSubTabs ? findFirst(TAB_SELECTORS) : null;
    if (found === tabs && tabs?.isConnected) return;

    block?.classList.remove('ghsn-tabsblock');
    tabs?.classList.remove('ghsn-tabstrip');
    tabs = found;
    block = found ? climbToPageBlock(found) : null;
    stateBadge = null;

    if (tabs && block && block !== tabs) {
      // Resolve the badge before marking the block: covering it may mean pinning
      // a wider block than the tab strip alone would have needed.
      stateBadge = findStateBadge();
      if (stateBadge && !block.contains(stateBadge)) {
        const wider = widenToCover(block, stateBadge);
        if (wider) block = wider;
        else stateBadge = null;   // cannot pin it, so don't pretend we can
      }

      tabs.classList.add('ghsn-tabstrip');
      block.classList.add('ghsn-tabsblock');
      ro?.observe(tabs);
      ro?.observe(block);
      if (stateBadge) ro?.observe(stateBadge);

      log('tabs', describe(tabs), '| block', describe(block),
          '| state badge', describe(stateBadge));
    } else {
      tabs = block = stateBadge = null;
      root.classList.remove('ghsn-tabs');
      setVar('--ghsn-tabs-h', 0);
      geo.stripH = 0;
      log('no tab strip on this page');
    }
  };

  const attach = () => {
    const found = findFirst(NAV_SELECTORS);
    if (!found) {
      // Not a repository page (or GitHub changed the markup) — stand down.
      standDown();
      return;
    }

    if (found === nav && nav.isConnected) {
      attachTabs();
      measure();
      update();
      return;
    }

    // A different nav element means a genuinely new header, so its geometry has
    // to earn a fresh verdict. Re-arming on every pass instead would let a
    // mutation-driven attach re-check mid-slide and condemn a good pin.
    verdict = 'armed';

    clearMarks();
    nav = found;
    // The known wrapper class is a fast path, not an article of faith: it still
    // has to be able to hold a sticky child, or we work it out from the DOM.
    const known = document.querySelector('.js-header-wrapper');
    const anchor = known && known.contains(nav) && hasTravelRoom(known) ? known : null;
    wrapper = anchor || climbToPageBlock(nav);
    log('nav', describe(nav), '| wrapper', describe(wrapper),
        anchor ? '(known wrapper)' : '(climbed)');
    nav.classList.add('ghsn-nav');
    wrapper.classList.add('ghsn-wrapper');

    ro?.disconnect();
    ro = new ResizeObserver(() => measure());
    ro.observe(nav);
    ro.observe(wrapper);

    tabs = block = stateBadge = null;
    attachTabs();

    if (!measure()) {
      standDown();
      return;
    }

    root.classList.add('ghsn-active');
    lastY = Math.max(0, window.scrollY);
    hidden = false;
    root.classList.remove('ghsn-hidden');

    clearExtraOffsets();
    tagExtraOffsets();
    update();
    log('geometry', { ...geo });
  };

  const debounce = (fn, ms) => {
    let t;
    return () => {
      clearTimeout(t);
      t = setTimeout(fn, ms);
    };
  };

  const start = () => {
    attach();

    window.addEventListener('scroll', onScroll, { passive: true });

    // A resize changes what "room to travel" means, so it is a fair reason to
    // give a page we stood down on another go.
    window.addEventListener('resize', debounce(() => {
      if (stoodDown) {
        stoodDown = false;
        verdict = 'armed';
        attach();
        return;
      }
      measure();
      update();
    }, 120), { passive: true });

    // Keyboard users: tabbing into either strip brings them back.
    document.addEventListener('focusin', (e) => {
      if (contains(wrapper, e.target) || contains(block, e.target)) setHidden(false);
    });

    // Mouse users: nudging the top edge brings them back.
    if (CONFIG.revealOnPointerTop) {
      document.addEventListener('mousemove', (e) => {
        if (e.clientY <= CONFIG.pointerZone) setHidden(false);
      }, { passive: true });
    }

    // rAF is throttled in background tabs, so re-sync on return.
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) { lastY = Math.max(0, window.scrollY); update(); }
    });

    // GitHub is a single-page app: headers get swapped out on navigation.
    const reattach = debounce(attach, 200);

    // A navigation is a new page: it clears any stand-down from the old one and
    // re-arms the check even when GitHub reuses the same nav element.
    const renavigate = debounce(() => {
      stoodDown = false;
      verdict = 'armed';
      attach();
    }, 200);

    for (const evt of ['turbo:load', 'turbo:render', 'pjax:end', 'soft-nav:end', 'popstate']) {
      document.addEventListener(evt, renavigate);
    }

    new MutationObserver(() => {
      // Never re-attach off the back of a stand-down: standing down nulls our
      // refs, which would otherwise read as "the header changed" and flap.
      if (stoodDown) return;
      if (!nav || !nav.isConnected || nav !== findFirst(NAV_SELECTORS)) reattach();
      else if (CONFIG.pinSubTabs && (!tabs || !tabs.isConnected) && findFirst(TAB_SELECTORS)) reattach();
    }).observe(document.documentElement, { childList: true, subtree: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
