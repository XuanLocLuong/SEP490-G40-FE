const RETURN_PATH_KEY = 'joblink_bookmark_return_path';

export const setBookmarkReturnPath = (path) => {
    sessionStorage.setItem(RETURN_PATH_KEY, path);
};

export const consumeBookmarkReturnPath = () => {
    const path = sessionStorage.getItem(RETURN_PATH_KEY);
    if (path) {
        sessionStorage.removeItem(RETURN_PATH_KEY);
    }
    return path;
};

export const peekBookmarkReturnPath = () => sessionStorage.getItem(RETURN_PATH_KEY);
