const SESSION_EXPIRED_KEY = 'joblink_auth_session_expired';
const ACCOUNT_LOCK_KEY = 'joblink_auth_account_lock';

export const SESSION_EXPIRED_MESSAGE =
    'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';

export const ACCOUNT_LOCK_LOGIN_MESSAGE =
    'Tài khoản đã bị khóa/cấm. Vui lòng liên hệ hỗ trợ.';

export const markSessionExpired = () => {
    try {
        sessionStorage.removeItem(ACCOUNT_LOCK_KEY);
        sessionStorage.setItem(SESSION_EXPIRED_KEY, '1');
    } catch {
        // ignore
    }
};

/** Refresh/login bị ACCOUNT_LOCK — hiện câu khóa/cấm trên /login, không dùng “hết hạn”. */
export const markAccountLocked = () => {
    try {
        sessionStorage.removeItem(SESSION_EXPIRED_KEY);
        sessionStorage.setItem(ACCOUNT_LOCK_KEY, '1');
    } catch {
        // ignore
    }
};

export const peekSessionExpiredMessage = () => {
    try {
        if (sessionStorage.getItem(ACCOUNT_LOCK_KEY)) {
            return ACCOUNT_LOCK_LOGIN_MESSAGE;
        }
        if (!sessionStorage.getItem(SESSION_EXPIRED_KEY)) return null;
        return SESSION_EXPIRED_MESSAGE;
    } catch {
        return null;
    }
};

export const clearSessionExpiredFlag = () => {
    try {
        sessionStorage.removeItem(SESSION_EXPIRED_KEY);
        sessionStorage.removeItem(ACCOUNT_LOCK_KEY);
    } catch {
        // ignore
    }
};
