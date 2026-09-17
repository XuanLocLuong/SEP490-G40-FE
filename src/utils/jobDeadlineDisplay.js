const MS_DAY = 24 * 60 * 60 * 1000;
const MS_HOUR = 60 * 60 * 1000;

/** Tin OPEN: còn bao lâu đến hạn ứng tuyển. */
export const getDeadlineCountdownLabel = (deadline, now = Date.now()) => {
    if (!deadline) return null;
    const end = new Date(deadline);
    if (Number.isNaN(end.getTime())) return null;

    const diffMs = end.getTime() - now;
    if (diffMs <= 0) return 'Hết hạn';

    const days = Math.floor(diffMs / MS_DAY);
    if (days >= 2) return `Còn ${days} ngày`;
    if (days === 1) return 'Còn 1 ngày';

    const hours = Math.floor(diffMs / MS_HOUR);
    if (hours >= 1) return `Còn ${hours} giờ`;

    return 'Sắp hết hạn';
};

export const isPastApplicationDeadline = (deadline, now = Date.now()) => {
    if (!deadline) return false;
    const end = new Date(deadline);
    return !Number.isNaN(end.getTime()) && end.getTime() < now;
};

/** Tin CLOSED: badge phụ cạnh "Đã đóng". null = không hiện. */
export const getClosedJobSubBadge = (job, metrics) => {
    if (job?.status !== 'CLOSED') return null;

    const hired = metrics?.hiredCount ?? 0;
    const required = metrics?.requiredCandidates ?? 1;

    if (hired >= required) {
        return { label: 'Đủ ứng viên', tone: 'filled' };
    }
    if (isPastApplicationDeadline(job.applicationDeadline)) {
        return { label: 'Hết hạn', tone: 'expired' };
    }
    return null;
};

/** Label còn < 24h — dùng style cảnh báo. */
export const isDeadlineUrgent = (label) =>
    Boolean(label && (label.includes('giờ') || label === 'Sắp hết hạn'));
