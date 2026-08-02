import { ROUTES, getHomePathByRole } from '../routes/path.js';
import { JOB_LIST_SECTIONS } from './jobQuery.js';
import { HOME_SECTION_IDS, HOME_SCROLL_STATE_KEY } from './homeSections.js';

const DETAIL_RETURN_KEY = 'joblink_job_detail_return';

const SECTION_BACK_LABELS = {
    [JOB_LIST_SECTIONS.URGENT]: 'Việc làm tuyển gấp',
    [JOB_LIST_SECTIONS.AI]: 'JobLink gợi ý',
    [JOB_LIST_SECTIONS.INTERACTIONS]: 'Lịch sử tương tác',
};

/** Map list `?section=` → homepage section id for scroll-on-return. */
export const JOB_LIST_SECTION_TO_HOME_ID = {
    [JOB_LIST_SECTIONS.URGENT]: HOME_SECTION_IDS.URGENT,
    [JOB_LIST_SECTIONS.AI]: HOME_SECTION_IDS.SUGGESTIONS,
};

const isHomePath = (pathname) =>
    pathname === ROUTES.LANDING || pathname === ROUTES.CANDIDATE_HOME;

const normalizeScrollSection = (scrollToSection) => {
    if (!scrollToSection || typeof scrollToSection !== 'string') return undefined;
    const trimmed = scrollToSection.trim();
    return trimmed || undefined;
};

/**
 * Map a source path (pathname + search) to a concrete back target for job detail.
 * Survives reload via sessionStorage (see set/peek helpers).
 */
export const resolveDetailBackFromPath = (pathWithSearch, role, scrollToSection) => {
    const homePath = getHomePathByRole(role);
    const scroll = normalizeScrollSection(scrollToSection);
    const fallback = { path: homePath, label: 'Trang chủ', scrollToSection: scroll };

    if (!pathWithSearch || typeof pathWithSearch !== 'string') {
        return fallback;
    }

    let url;
    try {
        url = new URL(pathWithSearch, 'http://local.invalid');
    } catch {
        return fallback;
    }

    const { pathname, search } = url;
    const fullPath = `${pathname}${search}`;

    if (isHomePath(pathname)) {
        return {
            path: fullPath || pathname,
            label: 'Trang chủ',
            scrollToSection: scroll,
        };
    }

    if (pathname === ROUTES.JOB_LIST) {
        const section = new URLSearchParams(search).get('section')?.trim() || '';
        const sectionLabel = SECTION_BACK_LABELS[section];
        if (sectionLabel) {
            return { path: fullPath, label: sectionLabel };
        }
        return { path: fullPath || ROUTES.JOB_LIST, label: 'Việc làm nổi bật' };
    }

    return fallback;
};

export const setJobDetailReturn = (back) => {
    if (!back?.path || !back?.label) return;
    try {
        const payload = {
            path: back.path,
            label: back.label,
        };
        if (back.scrollToSection) {
            payload.scrollToSection = back.scrollToSection;
        }
        sessionStorage.setItem(DETAIL_RETURN_KEY, JSON.stringify(payload));
    } catch {
        // ignore quota / private mode
    }
};

export const peekJobDetailReturn = () => {
    try {
        const raw = sessionStorage.getItem(DETAIL_RETURN_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed?.path && typeof parsed.label === 'string' && parsed.label.trim()) {
            return {
                path: parsed.path,
                label: parsed.label.trim(),
                scrollToSection: normalizeScrollSection(parsed.scrollToSection),
            };
        }
    } catch {
        // ignore
    }
    return null;
};

/**
 * Resolve back target for job detail: prefer navigate state, then sessionStorage, then home.
 * When state.from is present, persist it so F5 keeps the same back link.
 */
export const resolveJobDetailBack = ({ fromPath, scrollToSection, role } = {}) => {
    if (fromPath) {
        const resolved = resolveDetailBackFromPath(fromPath, role, scrollToSection);
        setJobDetailReturn(resolved);
        return resolved;
    }
    return peekJobDetailReturn() || resolveDetailBackFromPath(null, role, scrollToSection);
};

/** Navigate state for homepage section scroll (Link / navigate). */
export const buildHomeScrollState = (scrollToSection) => {
    const id = normalizeScrollSection(scrollToSection);
    if (!id) return undefined;
    return { [HOME_SCROLL_STATE_KEY]: id };
};

/** List pages opened from homepage sections return to role home (+ scroll to that section). */
export const resolveJobListBack = (role, listSection = null) => {
    const scrollToSection = listSection
        ? JOB_LIST_SECTION_TO_HOME_ID[listSection] || undefined
        : HOME_SECTION_IDS.FEATURED;

    return {
        path: getHomePathByRole(role),
        label: 'Trang chủ',
        scrollToSection,
    };
};
