import { ROUTES, getHomePathByRole } from '../routes/path.js';
import { consumeBookmarkReturnPath } from './bookmarkStorage.js';

const extractFromState = (locationState) => {
    const from = locationState?.from;
    if (typeof from === 'string' && from.startsWith('/')) return from;
    if (from?.pathname) {
        return `${from.pathname}${from.search || ''}`;
    }
    return null;
};

const normalizePostLoginPath = (path, role) => {
    if (!path || typeof path !== 'string' || !path.startsWith('/')) {
        return getHomePathByRole(role);
    }

    // Guest landing không dành cho user đã login → role home (KQ home restore qua sessionStorage).
    if (path === ROUTES.LANDING) {
        return getHomePathByRole(role);
    }

    return path;
};

/**
 * After login/register: bookmark return → navigate state.from → role home.
 * Keeps `/jobs?...` filters intact; maps `/` to role home.
 */
export const resolvePostLoginPath = (role, locationState) => {
    const saved = consumeBookmarkReturnPath();
    const fromState = extractFromState(locationState);
    const raw = (saved && saved.startsWith('/') ? saved : null) || fromState;
    return normalizePostLoginPath(raw, role);
};
