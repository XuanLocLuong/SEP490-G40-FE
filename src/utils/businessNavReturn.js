import { ROUTES, getHomePathByRole, getJobDetailPath } from '../routes/path.js';

const BUSINESS_RETURN_KEY = 'joblink_business_profile_return';

const isJobDetailPath = (pathname) => /^\/jobs\/[^/]+$/.test(pathname || '');

/**
 * Map a source path to a back target for public business profile.
 */
export const resolveBusinessBackFromPath = (pathWithSearch, role, labelHint) => {
    const homePath = getHomePathByRole(role);
    const fallback = { path: homePath, label: 'Trang chủ' };

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

    if (pathname === ROUTES.LANDING || pathname === ROUTES.CANDIDATE_HOME) {
        return { path: fullPath || pathname, label: labelHint || 'Trang chủ' };
    }

    if (pathname === ROUTES.JOB_LIST) {
        return { path: fullPath || ROUTES.JOB_LIST, label: labelHint || 'Danh sách việc làm' };
    }

    if (isJobDetailPath(pathname)) {
        return { path: fullPath, label: labelHint || 'Tin tuyển dụng' };
    }

    if (pathname === ROUTES.CANDIDATE_APPLICATION_HISTORY) {
        return { path: fullPath || pathname, label: labelHint || 'Lịch sử ứng tuyển' };
    }

    if (pathname.startsWith('/post-manager')) {
        return { path: fullPath || pathname, label: labelHint || 'Quản lý tin' };
    }

    if (pathname.startsWith('/candidate') || pathname.startsWith('/recruiter')) {
        return { path: fullPath || pathname, label: labelHint || 'Quay lại' };
    }

    if (pathname.startsWith('/') && pathname !== ROUTES.LOGIN && pathname !== ROUTES.REGISTER) {
        return { path: fullPath || pathname, label: labelHint || 'Quay lại' };
    }

    return fallback;
};

export const setBusinessProfileReturn = (back) => {
    if (!back?.path || !back?.label) return;
    try {
        sessionStorage.setItem(BUSINESS_RETURN_KEY, JSON.stringify(back));
    } catch {
        // ignore
    }
};

export const peekBusinessProfileReturn = () => {
    try {
        const raw = sessionStorage.getItem(BUSINESS_RETURN_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed?.path && typeof parsed.label === 'string' && parsed.label.trim()) {
            return { path: parsed.path, label: parsed.label.trim() };
        }
    } catch {
        // ignore
    }
    return null;
};

/**
 * Resolve back for business profile: navigate state → sessionStorage → home.
 */
export const resolveBusinessProfileBack = ({ fromPath, label, role } = {}) => {
    if (fromPath) {
        const resolved = resolveBusinessBackFromPath(fromPath, role, label);
        setBusinessProfileReturn(resolved);
        return resolved;
    }
    return peekBusinessProfileReturn() || resolveBusinessBackFromPath(null, role);
};

/** Build job-detail path helper for callers that only have jobId. */
export const jobDetailFromPath = (jobId, search = '') =>
    `${getJobDetailPath(jobId)}${search || ''}`;
