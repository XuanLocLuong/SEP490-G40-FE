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
        listPath: null,
    },
];

export const scrollToHomeSection = (sectionId) => {
    if (!sectionId) return false;
    const el = document.getElementById(sectionId);
    if (!el) return false;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
};

/** Scroll after paint (sections may mount async). Retries a few times. */
export const scrollToHomeSectionWhenReady = (sectionId, { attempts = 12, delayMs = 50 } = {}) => {
    if (!sectionId) return;
    let left = attempts;
    const tryScroll = () => {
        if (scrollToHomeSection(sectionId) || left <= 0) return;
        left -= 1;
        window.setTimeout(tryScroll, delayMs);
    };
    requestAnimationFrame(tryScroll);
};
