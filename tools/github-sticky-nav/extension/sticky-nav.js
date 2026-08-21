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

  // Enough slack below the block for pinning to be worth anything at all. A
  // block whose parent runs out a few pixels down would unpin almost at once.
  const hasTravelRoom = (el) => {
    const parent = el.parentElement;
    if (!parent) return false;
    return bottomOf(parent) - bottomOf(el) > Math.max(200, window.innerHeight * 0.5);
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
    if (Math.abs(Math.round(nav.getBoundingClientRect().top)) > PIN_TOLERANCE) return false;

    if (geo.tabsH && tabs && tabs.isConnected) {
      const tabsTop = Math.round(tabs.getBoundingClientRect().top);
      if (Math.abs(tabsTop - geo.navH) > PIN_TOLERANCE) return false;
    }
    return true;
  };

  const standDown = () => {
    root.classList.remove('ghsn-active', 'ghsn-pinned', 'ghsn-hidden', 'ghsn-tabs');
    clearMarks();
    clearExtraOffsets();
    ro?.disconnect();
    nav = wrapper = tabs = block = null;
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
    nav.classList.add('ghsn-nav');
    wrapper.classList.add('ghsn-wrapper');

    ro?.disconnect();
    ro = new ResizeObserver(() => measure());
    ro.observe(nav);
    ro.observe(wrapper);

    tabs = block = null;
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
