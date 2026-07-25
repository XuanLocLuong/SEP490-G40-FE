const KEY_PREFIX = 'joblink_recruiter_profile_draft:';

const getKey = (draftKey) => `${KEY_PREFIX}${draftKey}`;

/** userId từ login hoặc email — auth cũ có thể chưa có userId. */
export const getRecruiterProfileDraftKey = (auth) => {
    if (!auth) return null;
    const id = auth.userId ?? auth.email;
    if (id == null || id === '') return null;
    return String(id);
};

export const loadRecruiterProfileDraft = (draftKey) => {
    if (draftKey == null) return null;
    try {
        const raw = sessionStorage.getItem(getKey(draftKey));
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

export const saveRecruiterProfileDraft = (draftKey, draft) => {
    if (draftKey == null || !draft) return;
    try {
        sessionStorage.setItem(getKey(draftKey), JSON.stringify(draft));
    } catch {
        // sessionStorage đầy hoặc private mode — bỏ qua.
    }
};

export const clearRecruiterProfileDraft = (draftKey) => {
    if (draftKey == null) return;
    sessionStorage.removeItem(getKey(draftKey));
};
