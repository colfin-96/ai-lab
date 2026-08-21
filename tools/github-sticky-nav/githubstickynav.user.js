// ==UserScript==
// @name         GitHub Sticky Repo Nav
// @namespace    https://github.com/colfin-96/ai-lab
// @version      1.1.0
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
 *   2. the pull-request tab strip (Conversation / Commits / Checks / Files changed)
 * Both auto-hide while you scroll down and slide back in when you scroll up.
 *
 * While they are showing, GitHub's own sticky PR title bar fades out, so you
 * never get three stacked decks. Scroll down and it comes straight back.
 *
 * All geometry comes from CSS custom properties that sticky-nav.js measures at
 * runtime, so this keeps working when GitHub changes header heights, when the
 * enterprise banner is present/absent, or on narrow windows.
 */

:root {
  --ghsn-nav-h: 48px;      /* height of the repo nav strip                    */
  --ghsn-pin-top: 0px;     /* repo nav: navH - full header height (negative)  */
  --ghsn-tabs-h: 0px;      /* height of the PR tab strip (0 = none on page)   */
  --ghsn-tabs-top: 0px;    /* PR block: navH - strip offset (negative)        */
  --ghsn-tabs-shift: 0px;  /* how far to lift the PR block when hiding        */
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
 * bottom edge — the tab strip — stays on screen. The rows above it land
 * behind strip 1, which is opaque, so they are never visible. */

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

/* No tab strip on this page (diff view, code view, ...): push GitHub's bar
 * down so it clears the repo nav, exactly as before. */

html.ghsn-active.ghsn-pinned:not(.ghsn-tabs) [class*="use-sticky-header-module__stickyHeader"],
html.ghsn-active.ghsn-pinned:not(.ghsn-tabs) [class*="StickyPullRequestHeader-module"],
html.ghsn-active.ghsn-pinned:not(.ghsn-tabs) [class*="StickyIssueHeader-module"],
html.ghsn-active.ghsn-pinned:not(.ghsn-tabs) .gh-header-sticky,
html.ghsn-active.ghsn-pinned:not(.ghsn-tabs) .ghsn-offset {
  top: var(--ghsn-nav-h) !important;
}

html.ghsn-active.ghsn-pinned.ghsn-hidden:not(.ghsn-tabs) [class*="use-sticky-header-module__stickyHeader"],
html.ghsn-active.ghsn-pinned.ghsn-hidden:not(.ghsn-tabs) [class*="StickyPullRequestHeader-module"],
html.ghsn-active.ghsn-pinned.ghsn-hidden:not(.ghsn-tabs) [class*="StickyIssueHeader-module"],
html.ghsn-active.ghsn-pinned.ghsn-hidden:not(.ghsn-tabs) .gh-header-sticky,
html.ghsn-active.ghsn-pinned.ghsn-hidden:not(.ghsn-tabs) .ghsn-offset {
  top: 0 !important;
}

/* Tab strip present: swap. Our two strips showing -> GitHub's bar steps
 * aside. Our strips hidden -> GitHub's bar behaves exactly as stock. */

html.ghsn-active.ghsn-pinned.ghsn-tabs:not(.ghsn-hidden) [class*="use-sticky-header-module__stickyHeader"],
html.ghsn-active.ghsn-pinned.ghsn-tabs:not(.ghsn-hidden) [class*="StickyPullRequestHeader-module"],
html.ghsn-active.ghsn-pinned.ghsn-tabs:not(.ghsn-hidden) [class*="StickyIssueHeader-module"],
html.ghsn-active.ghsn-pinned.ghsn-tabs:not(.ghsn-hidden) .gh-header-sticky {
  opacity: 0;
  pointer-events: none;
}

/* ---- anchor jumps shouldn't land underneath the pinned strips ------- */

html.ghsn-active {
  scroll-padding-top: calc(var(--ghsn-nav-h) + var(--ghsn-tabs-h) + 8px);
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
 *   2. the pull-request tab strip (Conversation / Commits / Checks / Files changed)
 *
 * They slide out of the way when you scroll down and come straight back when
 * you scroll up, touch the top edge of the window with the mouse, or tab into
 * them. While they are showing, GitHub's own sticky PR title bar fades out, so
 * there are never three stacked decks.
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
    // Extra selectors for other fixed bars that sit at top: 0 and should be
    // pushed down while the nav shows. Matching elements get .ghsn-offset.
    extraOffsetSelectors: [],
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

  const root = document.documentElement;

  let nav = null;      // the repo nav <nav>
  let wrapper = null;  // block we pin so the repo nav stays put
  let tabs = null;     // the PR tab strip <nav>
  let block = null;    // block we pin so the tab strip stays put

  const geo = { navH: 0, wrapH: 0, tabsH: 0, tabsTop: 0, tabsShift: 0 };

  let lastY = 0;
  let hidden = false;
  let ticking = false;

  /* ---------------- element discovery ---------------- */

  const findFirst = (selectors) => {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.getBoundingClientRect().height > 0) return el;
    }
    return null;
  };

  // `position: sticky` can only travel inside its own parent's box, so we pin
  // the outermost header block that sits directly inside the tall page column
  // rather than the <nav> itself — otherwise it would stay put for the first
  // ~130px of scrolling and no further.
  const climbToPageBlock = (el) => {
    for (let i = 0; i < 10; i++) {
      const parent = el.parentElement;
      if (!parent || parent === document.body) return el;
      // Stop as soon as the parent is clearly the long, scrolling page column.
      if (parent.clientHeight > el.clientHeight * 2 + 200) return el;
      el = parent;
    }
    return el;
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

    // Strip 2 is optional: plenty of pages don't have one.
    if (!tabs || !tabs.isConnected || !block || !block.isConnected) {
      if (geo.tabsH !== 0) {
        geo.tabsH = 0;
        setVar('--ghsn-tabs-h', 0);
      }
      root.classList.remove('ghsn-tabs');
      return true;
    }

    const tr = tabs.getBoundingClientRect();
    const br = block.getBoundingClientRect();
    const tabsH = Math.round(tr.height);
    const offset = Math.round(tr.top - br.top);   // strip's position in the block
    const blockH = Math.round(br.height);
    if (!tabsH || !blockH) return true;

    const tabsTop = navH - offset;                // lands the strip below strip 1
    // Lift far enough to clear whichever reaches lower — the strip itself (it
    // can overflow its block's measured height) or the block's bottom edge —
    // plus a few px so the drop shadow doesn't smudge the top of the window.
    const tabsShift = navH + Math.max(tabsH, blockH - offset) + 4;

    if (tabsH !== geo.tabsH || tabsTop !== geo.tabsTop || tabsShift !== geo.tabsShift) {
      geo.tabsH = tabsH;
      geo.tabsTop = tabsTop;
      geo.tabsShift = tabsShift;
      setVar('--ghsn-tabs-h', tabsH);
      setVar('--ghsn-tabs-top', tabsTop);
      setVar('--ghsn-tabs-shift', tabsShift);
    }
    root.classList.add('ghsn-tabs');
    return true;
  };

  /* ---------------- show / hide ---------------- */

  const contains = (el, node) => !!el && el.contains(node);

  const busy = () =>
    // Don't yank the strips away mid-interaction.
    contains(wrapper, document.activeElement) ||
    contains(block, document.activeElement) ||
    !!wrapper.querySelector('[aria-expanded="true"]');

  const setHidden = (next) => {
    if (next === hidden) return;
    hidden = next;
    root.classList.toggle('ghsn-hidden', hidden);
  };

  const update = () => {
    ticking = false;
    if (!nav || !nav.isConnected) return;
    measure();

    const y = Math.max(0, window.scrollY);
    // Pinned == the header has scrolled far enough that only the strips are left.
    const pinned = y > Math.max(0, geo.wrapH - geo.navH) + 1;
    root.classList.toggle('ghsn-pinned', pinned);

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

  const clearMarks = () => {
    wrapper?.classList.remove('ghsn-wrapper');
    nav?.classList.remove('ghsn-nav');
    block?.classList.remove('ghsn-tabsblock');
    tabs?.classList.remove('ghsn-tabstrip');
  };

  let ro = null;

  const attachTabs = () => {
    const found = CONFIG.pinSubTabs ? findFirst(TAB_SELECTORS) : null;
    if (found === tabs && tabs?.isConnected) return;

    block?.classList.remove('ghsn-tabsblock');
    tabs?.classList.remove('ghsn-tabstrip');
    tabs = found;
    block = found ? climbToPageBlock(found) : null;

    if (tabs && block && block !== tabs) {
      tabs.classList.add('ghsn-tabstrip');
      block.classList.add('ghsn-tabsblock');
      ro?.observe(tabs);
      ro?.observe(block);
    } else {
      tabs = block = null;
      root.classList.remove('ghsn-tabs');
      setVar('--ghsn-tabs-h', 0);
      geo.tabsH = 0;
    }
  };

  const attach = () => {
    const found = findFirst(NAV_SELECTORS);
    if (!found) {
      // Not a repository page (or GitHub changed the markup) — stand down.
      root.classList.remove('ghsn-active', 'ghsn-pinned', 'ghsn-hidden', 'ghsn-tabs');
      clearMarks();
      nav = wrapper = tabs = block = null;
      return;
    }

    if (found === nav && nav.isConnected) {
      attachTabs();
      measure();
      update();
      return;
    }

    clearMarks();
    nav = found;
    const known = document.querySelector('.js-header-wrapper');
    wrapper = known && known.contains(nav) ? known : climbToPageBlock(nav);
    nav.classList.add('ghsn-nav');
    wrapper.classList.add('ghsn-wrapper');

    ro?.disconnect();
    ro = new ResizeObserver(() => measure());
    ro.observe(nav);
    ro.observe(wrapper);

    tabs = block = null;
    attachTabs();

    if (!measure()) {
      clearMarks();
      nav = wrapper = tabs = block = null;
      return;
    }

    root.classList.add('ghsn-active');
    lastY = Math.max(0, window.scrollY);
    hidden = false;
    root.classList.remove('ghsn-hidden');

    tagExtraOffsets();
    update();
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
    window.addEventListener('resize', debounce(() => { measure(); update(); }, 120), { passive: true });

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
    for (const evt of ['turbo:load', 'turbo:render', 'pjax:end', 'soft-nav:end', 'popstate']) {
      document.addEventListener(evt, reattach);
    }
    new MutationObserver(() => {
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
