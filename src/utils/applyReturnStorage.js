const PENDING_APPLY_KEY = 'joblink_pending_apply_job';

export const setPendingApplyReturn = ({ jobId, jobTitle } = {}) => {
    if (jobId == null || jobId === '') return;
    sessionStorage.setItem(
        PENDING_APPLY_KEY,
        JSON.stringify({
            jobId: String(jobId),
            jobTitle: jobTitle || '',
        }),
    );
};

export const peekPendingApplyReturn = () => {
    try {
        const raw = sessionStorage.getItem(PENDING_APPLY_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed?.jobId) return null;
        return parsed;
    } catch {
        return null;
    }
};

export const consumePendingApplyReturn = () => {
    const pending = peekPendingApplyReturn();
    sessionStorage.removeItem(PENDING_APPLY_KEY);
    return pending;
};

export const clearPendingApplyReturn = () => {
    sessionStorage.removeItem(PENDING_APPLY_KEY);
};
