import { ROUTES } from '../routes/path.js';

/** Section anchors on candidate homepage (`/candidate`). */
export const HOME_SECTION_IDS = {
    URGENT: 'home-urgent',
    SUGGESTIONS: 'home-suggestions',
    FEATURED: 'home-featured',
    TOP_EMPLOYERS: 'home-top-employers',
};

/** location.state key — scroll to section once after navigate (no URL hash). */
export const HOME_SCROLL_STATE_KEY = 'scrollToSection';

/**
 * Candidate header tabs ↔ homepage sections ↔ list routes.
 * `listPath: null` = no dedicated list yet → fall back to homepage + hash.
 */
export const CANDIDATE_HOME_NAV_ITEMS = [
    {
        id: HOME_SECTION_IDS.URGENT,
        label: 'Việc làm tuyển gấp',
        listPath: ROUTES.JOB_LIST_URGENT,
    },
    {
        id: HOME_SECTION_IDS.SUGGESTIONS,
        label: 'JobLink gợi ý cho bạn',
        listPath: ROUTES.CANDIDATE_AI_SUGGESTIONS,
    },
    {
        id: HOME_SECTION_IDS.FEATURED,
        label: 'Việc làm nổi bật',
        listPath: ROUTES.JOB_LIST,
    },
    {
        id: HOME_SECTION_IDS.TOP_EMPLOYERS,
        label: 'Top 10 Nhà Tuyển Dụng',
        listPath: ROUTES.TOP_RECRUITERS,
    },
];

/** Sticky site header height so section title sits just below it. */
const getStickyHeaderOffset = () => {
    const header = document.querySelector('.site-header');
    if (!header || header.classList.contains('site-header--hidden')) {
        return 0;
    }
    return Math.ceil(header.getBoundingClientRect().height) || 0;
};

const getSectionScrollTop = (el) => {
    const headerOffset = getStickyHeaderOffset();
    // Extra gap so title is not flush against the header edge.
    const gap = 12;
    return Math.max(0, window.scrollY + el.getBoundingClientRect().top - headerOffset - gap);
};

/**
 * Align section so its top sits at the top of the visible page (under sticky header).
 * @returns {boolean} whether the element exists
 */
export const scrollToHomeSection = (sectionId, { behavior = 'auto' } = {}) => {
    if (!sectionId) return false;
    const el = document.getElementById(sectionId);
    if (!el) return false;
    window.scrollTo({ top: getSectionScrollTop(el), left: 0, behavior });
    return true;
};

/**
 * Scroll after paint and keep correcting while homepage content above the
 * section finishes loading (otherwise first scroll lands too high and the
 * section ends up mid/bottom of the viewport).
 */
export const scrollToHomeSectionWhenReady = (
    sectionId,
    { attempts = 28, delayMs = 60, stableNeeded = 3 } = {}
) => {
    if (!sectionId) return;

    let left = attempts;
    let lastTop = null;
    let stableCount = 0;

    const tick = () => {
        const el = document.getElementById(sectionId);
        if (!el) {
            if (left <= 0) return;
            left -= 1;
            window.setTimeout(tick, delayMs);
            return;
        }

        const targetTop = getSectionScrollTop(el);
        window.scrollTo({ top: targetTop, left: 0, behavior: 'auto' });

        if (lastTop != null && Math.abs(lastTop - targetTop) <= 2) {
            stableCount += 1;
        } else {
            stableCount = 0;
        }
        lastTop = targetTop;

        if (stableCount >= stableNeeded || left <= 0) return;
        left -= 1;
        window.setTimeout(tick, delayMs);
    };

    // Double rAF: wait for first paint of home route after navigation.
    requestAnimationFrame(() => {
        requestAnimationFrame(tick);
    });
};

/**
 * One-shot: if location.state asks for a section, scroll then clear state
 * (replace) so reload / ScrollToTop stay stable.
 */
export const consumeHomeSectionScrollState = ({
    location,
    navigate,
    homePath,
}) => {
    const sectionId = location.state?.[HOME_SCROLL_STATE_KEY];
    if (sectionId) {
        scrollToHomeSectionWhenReady(sectionId);
        navigate(homePath, { replace: true, state: {} });
        return true;
    }
    return false;
};
