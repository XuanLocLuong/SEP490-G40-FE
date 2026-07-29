/**
 * Derived metric: applications / new jobs in period.
 * TODO: prefer BE official metric if added to UC-47.
 */
export const formatAppsPerJob = (applications, jobs) => {
    if (applications == null || jobs == null) return '—';
    const apps = Number(applications);
    const jobCount = Number(jobs);
    if (Number.isNaN(apps) || Number.isNaN(jobCount)) return '—';
    if (jobCount <= 0) return 'N/A';
    const ratio = apps / jobCount;
    if (!Number.isFinite(ratio)) return '—';
    return ratio >= 10 ? ratio.toFixed(0) : ratio.toFixed(1);
};

export const APPS_PER_JOB_TOOLTIP =
    'Số đơn ứng tuyển trong kỳ ÷ số tin tuyển mới trong kỳ. Không có tin mới → N/A.';
