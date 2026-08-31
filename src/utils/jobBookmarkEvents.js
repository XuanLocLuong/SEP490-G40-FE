export const JOB_BOOKMARK_CHANGED_EVENT = 'joblink:bookmark-changed';

export const emitJobBookmarkChanged = (jobId, saved) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
        new CustomEvent(JOB_BOOKMARK_CHANGED_EVENT, {
            detail: { jobId: Number(jobId), saved: Boolean(saved) },
        })
    );
};

