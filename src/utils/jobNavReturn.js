import { ROUTES, getHomePathByRole } from '../routes/path.js';
import { JOB_LIST_SECTIONS } from './jobQuery.js';

const DETAIL_RETURN_KEY = 'joblink_job_detail_return';

const SECTION_BACK_LABELS = {
    [JOB_LIST_SECTIONS.URGENT]: 'Việc làm tuyển gấp',
    [JOB_LIST_SECTIONS.AI]: 'JobLink gợi ý',
    [JOB_LIST_SECTIONS.INTERACTIONS]: 'Lịch sử tương tác',
};

const isHomePath = (pathname) =>
    pathname === ROUTES.LANDING || pathname === ROUTES.CANDIDATE_HOME;

/**
 * Map a source path (pathname + search) to a concrete back target for job detail.
 * Survives reload via sessionStorage (see set/peek helpers).
 */
export const resolveDetailBackFromPath = (pathWithSearch, role) => {
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

    if (isHomePath(pathname)) {
        return { path: fullPath || pathname, label: 'Trang chủ' };
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
        sessionStorage.setItem(DETAIL_RETURN_KEY, JSON.stringify(back));
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
            return { path: parsed.path, label: parsed.label.trim() };
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
export const resolveJobDetailBack = ({ fromPath, role } = {}) => {
    if (fromPath) {
        const resolved = resolveDetailBackFromPath(fromPath, role);
        setJobDetailReturn(resolved);
        return resolved;
    }
    return peekJobDetailReturn() || resolveDetailBackFromPath(null, role);
};

/** List pages opened from homepage sections always return to role home. */
export const resolveJobListBack = (role) => ({
    path: getHomePathByRole(role),
    label: 'Trang chủ',
});
