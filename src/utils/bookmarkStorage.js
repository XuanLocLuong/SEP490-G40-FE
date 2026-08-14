const RETURN_PATH_KEY = 'joblink_bookmark_return_path';

const normalizeInternalPath = (path) => {
    if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) {
        return null;
    }
    return path;
};

export const setBookmarkReturnPath = (path) => {
    const normalizedPath = normalizeInternalPath(path);
    if (!normalizedPath) return false;

    sessionStorage.setItem(RETURN_PATH_KEY, normalizedPath);
    return true;
};

export const consumeBookmarkReturnPath = () => {
    const path = sessionStorage.getItem(RETURN_PATH_KEY);
    if (path) {
        sessionStorage.removeItem(RETURN_PATH_KEY);
    }
    return path;
};

export const peekBookmarkReturnPath = () => sessionStorage.getItem(RETURN_PATH_KEY);

export const clearBookmarkReturnPath = () => sessionStorage.removeItem(RETURN_PATH_KEY);
