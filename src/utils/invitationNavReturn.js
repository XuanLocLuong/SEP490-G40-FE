import { ROUTES } from '../routes/path.js';
import { JOB_LIST_SECTIONS } from './jobQuery.js';
import { buildHomeScrollState } from './jobNavReturn.js';

const INVITATIONS_RETURN_KEY = 'joblink_invitations_return';

const isInvitationsPath = (pathname) => pathname === ROUTES.CANDIDATE_INVITATIONS;

const isJobDetailPath = (pathname) => /^\/jobs\/[^/]+$/.test(pathname || '');

const normalizeScrollSection = (scrollToSection) => {
    if (!scrollToSection || typeof scrollToSection !== 'string') return undefined;
    const trimmed = scrollToSection.trim();
    return trimmed || undefined;
};

const normalizeBack = (back) => {
    if (!back?.path || typeof back.path !== 'string') return null;
    let url;
    try {
        url = new URL(back.path, 'http://local.invalid');
    } catch {
        return null;
    }
    if (isInvitationsPath(url.pathname)) return null;

    const label = (back.label && String(back.label).trim()) || 'Quay lại';
    const resolved = { path: back.path, label };
    const scroll = normalizeScrollSection(back.scrollToSection);
    if (scroll) resolved.scrollToSection = scroll;
    return resolved;
};

export const setInvitationsReturn = (back) => {
    const payload = normalizeBack(back);
    if (!payload) return;
    try {
        sessionStorage.setItem(INVITATIONS_RETURN_KEY, JSON.stringify(payload));
    } catch {
        // ignore quota / private mode
    }
};

export const peekInvitationsReturn = () => {
    try {
        const raw = sessionStorage.getItem(INVITATIONS_RETURN_KEY);
        if (!raw) return null;
        return normalizeBack(JSON.parse(raw));
    } catch {
        return null;
    }
};

export const clearInvitationsReturn = () => {
    try {
        sessionStorage.removeItem(INVITATIONS_RETURN_KEY);
    } catch {
        // ignore
    }
};

/**
 * location.state when navigating to Invitations — remember where user came from.
 * Shape: { from: { path, label, scrollToSection? } }
 */
export const buildInvitationsFromState = ({ path, label, scrollToSection } = {}) => {
    if (!path) return undefined;
    const from = normalizeBack({ path, label, scrollToSection });
    if (!from) return undefined;
    return { from };
};

/**
 * Infer return target from current location (CTA / header / notification).
 */
export const buildInvitationsFromCurrentLocation = (location) => {
    if (!location?.pathname || isInvitationsPath(location.pathname)) {
        return undefined;
    }

    const path = `${location.pathname}${location.search || ''}`;
    const section = new URLSearchParams(location.search || '').get('section');

    if (location.pathname === ROUTES.CANDIDATE_HOME || location.pathname === ROUTES.LANDING) {
        return buildInvitationsFromState({
            path: location.pathname,
            label: 'Trang chủ',
        });
    }

    if (location.pathname === ROUTES.JOB_LIST) {
        if (section === JOB_LIST_SECTIONS.URGENT) {
            return buildInvitationsFromState({ path, label: 'Việc làm tuyển gấp' });
        }
        if (section === JOB_LIST_SECTIONS.AI) {
            return buildInvitationsFromState({ path, label: 'JobLink gợi ý' });
        }
        if (section === JOB_LIST_SECTIONS.INTERACTIONS) {
            return buildInvitationsFromState({ path, label: 'Lịch sử tương tác' });
        }
        return buildInvitationsFromState({ path, label: 'Danh sách việc làm' });
    }

    if (isJobDetailPath(location.pathname)) {
        return buildInvitationsFromState({ path, label: 'Tin tuyển dụng' });
    }

    if (location.pathname === ROUTES.CANDIDATE_PROFILE) {
        return buildInvitationsFromState({ path, label: 'Hồ sơ' });
    }

    if (location.pathname === ROUTES.CANDIDATE_APPLICATION_HISTORY) {
        return buildInvitationsFromState({ path, label: 'Lịch sử ứng tuyển' });
    }

    if (location.pathname === ROUTES.CANDIDATE_NOTIFICATIONS) {
        return buildInvitationsFromState({ path, label: 'Thông báo' });
    }

    return buildInvitationsFromState({
        path,
        label: 'Quay lại',
    });
};

/**
 * Resolve back on Invitations page.
 * Prefer navigate state.from (persist), else peek storage.
 * Returns null when no known source (hide back link).
 */
export const resolveInvitationsBack = (locationState) => {
    const from = normalizeBack(locationState?.from);
    if (from) {
        setInvitationsReturn(from);
        return from;
    }
    return peekInvitationsReturn();
};

/** Navigate options when leaving Invitations via back. */
export const buildInvitationsLeaveNavigate = (back) => {
    const scrollState = buildHomeScrollState(back?.scrollToSection);
    if (scrollState) return { state: scrollState };
    return undefined;
};

/** Attach return state only when navigating to the invitations page. */
export const invitationsNavigateOptions = (targetPath, location) => {
    if (targetPath !== ROUTES.CANDIDATE_INVITATIONS) return undefined;
    const state = buildInvitationsFromCurrentLocation(location);
    return state ? { state } : undefined;
};
