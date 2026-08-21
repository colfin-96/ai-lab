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
