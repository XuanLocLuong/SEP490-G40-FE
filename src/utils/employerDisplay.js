export const formatEmployerTrustScore = (value) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return '—';
    return Math.round(num);
};

export const formatEmployerRating = (value) => {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) return null;
    return num.toFixed(1);
};

export const buildEmployerMetaLines = (employer) => {
    const rating = formatEmployerRating(employer?.averageRating);
    const reviewCount = Number(employer?.validReviewCount) || 0;
    const ratingLine = rating
        ? reviewCount > 0
            ? `${rating}★ (${reviewCount} đánh giá)`
            : `${rating}★`
        : null;

    const hires = Number(employer?.successfulHireCount);
    const hiresLine =
        Number.isFinite(hires) && hires > 0 ? `${hires} lượt tuyển thành công` : null;

    const activeJobs = Number(employer?.activeJobCount);
    const jobsLine =
        Number.isFinite(activeJobs) && activeJobs > 0 ? `${activeJobs} việc đang tuyển` : null;

    return [
        { text: ratingLine || 'Chưa có đánh giá', placeholder: !ratingLine },
        {
            text: hiresLine || 'Chưa có lượt tuyển thành công',
            placeholder: !hiresLine,
        },
        { text: jobsLine || 'Chưa có việc đang tuyển', placeholder: !jobsLine },
    ];
};

export const getEmployerTrustPercent = (trustScore) => {
    const num = Number(trustScore);
    if (!Number.isFinite(num)) return 0;
    return Math.min(100, Math.max(0, num));
};
