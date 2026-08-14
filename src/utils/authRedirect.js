import { ROUTES, getHomePathByRole } from '../routes/path.js';
import { peekBookmarkReturnPath, setBookmarkReturnPath } from './bookmarkStorage.js';
import { USER_ROLES } from './Constants.jsx';

const AUTH_PATHS = new Set([
    ROUTES.LOGIN,
    ROUTES.REGISTER,
    ROUTES.VERIFY_EMAIL,
    ROUTES.FORGOT_PASSWORD,
    ROUTES.RESET_PASSWORD,
]);

const ROLE_PATH_PREFIX = {
    [USER_ROLES.CANDIDATE]: '/candidate',
    [USER_ROLES.RECRUITER]: '/recruiter',
    [USER_ROLES.POST_MANAGER]: '/post-manager',
    [USER_ROLES.MANUAL_CHECK_TEAM]: '/manual-check',
    [USER_ROLES.ADMIN]: '/admin',
};

const splitPath = (path) => path.split(/[?#]/, 1)[0];

const isPathUnder = (pathname, prefix) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`);

const extractFromState = (locationState) => {
    const from = locationState?.from;
    if (typeof from === 'string' && from.startsWith('/')) return from;
    if (from?.pathname) {
        return `${from.pathname}${from.search || ''}${from.hash || ''}`;
    }
    return null;
};

export const isPostLoginPathAllowed = (path, role) => {
    if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) {
        return false;
    }

    const pathname = splitPath(path);
    if (AUTH_PATHS.has(pathname)) return false;

    const publicPath =
        pathname === ROUTES.LANDING ||
        isPathUnder(pathname, ROUTES.JOB_LIST) ||
        isPathUnder(pathname, '/business') ||
        pathname === ROUTES.TOP_RECRUITERS;
    if (publicPath) return true;

    // This authenticated shared profile route is available to every role.
    if (isPathUnder(pathname, '/candidates')) return Boolean(role);

    const rolePrefix = ROLE_PATH_PREFIX[role];
    return Boolean(rolePrefix && isPathUnder(pathname, rolePrefix));
};

export const rememberPostLoginPath = (path, role) => {
    if (!isPostLoginPathAllowed(path, role)) return false;
    return setBookmarkReturnPath(path);
};

export const getStoredPostLoginPath = (role) => {
    const path = peekBookmarkReturnPath();
    return isPostLoginPathAllowed(path, role) ? path : null;
};

const normalizePostLoginPath = (path, role) => {
    if (!path || typeof path !== 'string' || !path.startsWith('/')) {
        return getHomePathByRole(role);
    }

    // An authenticated user entering from landing continues at their role home.
    if (path === ROUTES.LANDING) {
        return getHomePathByRole(role);
    }

    return path;
};

/**
 * Resolve login state first, then stored return path, then the role home.
 * The target remains stored until navigation has actually reached it.
 */
export const resolvePostLoginPath = (role, locationState) => {
    const fromState = extractFromState(locationState);
    const saved = getStoredPostLoginPath(role);
    const raw = isPostLoginPathAllowed(fromState, role) ? fromState : saved;
    const resolvedPath = normalizePostLoginPath(raw, role);

    // This survives a competing GuestOnlyRoute redirect right after auth changes.
    if (isPostLoginPathAllowed(resolvedPath, role)) {
        setBookmarkReturnPath(resolvedPath);
    }

    return resolvedPath;
};
