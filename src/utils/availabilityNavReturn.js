import { ROUTES } from '../routes/path.js';
import { HOME_SECTION_IDS, HOME_SCROLL_STATE_KEY } from './homeSections.js';
import { JOB_LIST_SECTIONS } from './jobQuery.js';
import { buildHomeScrollState } from './jobNavReturn.js';

const AVAILABILITY_RETURN_KEY = 'joblink_availability_return';

const normalizeScrollSection = (scrollToSection) => {
    if (!scrollToSection || typeof scrollToSection !== 'string') return undefined;
    const trimmed = scrollToSection.trim();
    return trimmed || undefined;
};

const normalizeBack = (back) => {
    if (!back?.path || typeof back.path !== 'string') return null;
    const label = (back.label && String(back.label).trim()) || 'Quay lại';
    const resolved = { path: back.path, label };
    const scroll = normalizeScrollSection(back.scrollToSection);
    if (scroll) resolved.scrollToSection = scroll;
    return resolved;
};

export const setAvailabilityReturn = (back) => {
    const payload = normalizeBack(back);
    if (!payload) return;
    try {
        sessionStorage.setItem(AVAILABILITY_RETURN_KEY, JSON.stringify(payload));
    } catch {
        // ignore quota / private mode
    }
};

export const peekAvailabilityReturn = () => {
    try {
        const raw = sessionStorage.getItem(AVAILABILITY_RETURN_KEY);
        if (!raw) return null;
        return normalizeBack(JSON.parse(raw));
    } catch {
        return null;
    }
};

export const clearAvailabilityReturn = () => {
    try {
        sessionStorage.removeItem(AVAILABILITY_RETURN_KEY);
    } catch {
        // ignore
    }
};

const DEFAULT_BACK = {
    path: ROUTES.CANDIDATE_PROFILE,
    label: 'Hồ sơ',
};

/**
 * location.state when navigating to Availability — remember where user came from.
 * Shape: { from: { path, label, scrollToSection? } }
 */
export const buildAvailabilityFromState = ({ path, label, scrollToSection } = {}) => {
    if (!path) return undefined;
    const from = {
        path,
        label: (label && String(label).trim()) || 'Quay lại',
    };
    if (scrollToSection) {
        from.scrollToSection = scrollToSection;
    }
    return { from };
};

/**
 * Infer return target from current location (banner / hint on home or AI list).
 */
export const buildAvailabilityFromCurrentLocation = (location) => {
    if (!location?.pathname) {
        return buildAvailabilityFromState({
            path: ROUTES.CANDIDATE_PROFILE,
            label: 'Hồ sơ',
        });
    }

    const path = `${location.pathname}${location.search || ''}`;
    const section = new URLSearchParams(location.search || '').get('section');

    if (location.pathname === ROUTES.CANDIDATE_HOME) {
        return buildAvailabilityFromState({
            path: ROUTES.CANDIDATE_HOME,
            label: 'JobLink gợi ý',
            scrollToSection: HOME_SECTION_IDS.SUGGESTIONS,
        });
    }

    if (location.pathname === ROUTES.JOB_LIST && section === JOB_LIST_SECTIONS.AI) {
        return buildAvailabilityFromState({
            path,
            label: 'JobLink gợi ý',
        });
    }

    if (location.pathname === ROUTES.CANDIDATE_PROFILE) {
        return buildAvailabilityFromState({
            path: ROUTES.CANDIDATE_PROFILE,
            label: 'Hồ sơ',
        });
    }

    return buildAvailabilityFromState({
        path,
        label: 'Quay lại',
    });
};

/**
 * Resolve back target on Availability page.
 * Prefer navigate state.from (persist to sessionStorage), else peek storage, else hồ sơ.
 */
export const resolveAvailabilityBack = (locationState) => {
    const from = normalizeBack(locationState?.from);
    if (from) {
        setAvailabilityReturn(from);
        return from;
    }
    return peekAvailabilityReturn() || DEFAULT_BACK;
};

/** Navigate options when leaving Availability (back / after save). */
export const buildAvailabilityLeaveNavigate = (back) => {
    const scrollState = buildHomeScrollState(back?.scrollToSection);
    if (scrollState) return { state: scrollState };
    if (back?.scrollToSection) {
        return { state: { [HOME_SCROLL_STATE_KEY]: back.scrollToSection } };
    }
    return undefined;
};
