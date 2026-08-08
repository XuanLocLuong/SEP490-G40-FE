const SESSION_EXPIRED_KEY = 'joblink_auth_session_expired';
export const SESSION_EXPIRED_MESSAGE =
    'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';

export const markSessionExpired = () => {
    try {
        sessionStorage.setItem(SESSION_EXPIRED_KEY, '1');
    } catch {
        // ignore
    }
};

export const peekSessionExpiredMessage = () => {
    try {
        if (!sessionStorage.getItem(SESSION_EXPIRED_KEY)) return null;
        return SESSION_EXPIRED_MESSAGE;
    } catch {
        return null;
    }
};

export const clearSessionExpiredFlag = () => {
    try {
        sessionStorage.removeItem(SESSION_EXPIRED_KEY);
    } catch {
        // ignore
    }
};
