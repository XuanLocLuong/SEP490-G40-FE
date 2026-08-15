const EMAIL_VERIFICATION_NOTICE_KEY = 'joblink_email_verification_notice';

export const setEmailVerificationNotice = (email) => {
    try {
        sessionStorage.setItem(
            EMAIL_VERIFICATION_NOTICE_KEY,
            JSON.stringify({ email: email || '' })
        );
    } catch {
        // sessionStorage có thể bị chặn — Login sẽ không hiện lại notice, form vẫn dùng được.
    }
};

export const peekEmailVerificationNotice = () => {
    try {
        const raw = sessionStorage.getItem(EMAIL_VERIFICATION_NOTICE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return null;
        return { email: parsed.email || '' };
    } catch {
        return null;
    }
};

export const clearEmailVerificationNotice = () => {
    try {
        sessionStorage.removeItem(EMAIL_VERIFICATION_NOTICE_KEY);
    } catch {
        // ignore
    }
};
