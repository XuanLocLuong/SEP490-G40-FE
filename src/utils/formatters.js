const JOB_TYPE_LABELS = {
    PART_TIME: 'Part-time',
    FULL_TIME: 'Full-time',
    INTERN: 'Thực tập',
    FREELANCE: 'Freelance',
};

export const formatJobType = (jobType) => {
    if (!jobType) return '';
    return JOB_TYPE_LABELS[jobType] || jobType.replace(/_/g, ' ');
};

export const formatSalary = (salaryMin, salaryMax) => {
    const format = (value) => {
        if (value == null) return null;
        const num = Number(value);
        if (Number.isNaN(num)) return null;
        if (num >= 1_000_000) {
            return `${(num / 1_000_000).toFixed(num % 1_000_000 === 0 ? 0 : 1)}tr`;
        }
        if (num >= 1000) {
            return `${Math.round(num / 1000)}K`;
        }
        return `${num}`;
    };

    const min = format(salaryMin);
    const max = format(salaryMax);

    if (min && max) {
        const isMonthly = Number(salaryMin) >= 1_000_000 || Number(salaryMax) >= 1_000_000;
        const suffix = isMonthly ? '/tháng' : '/giờ';
        return `${min} - ${max}${suffix}`;
    }
    if (min) return `Từ ${min}`;
    if (max) return `Đến ${max}`;
    return 'Thỏa thuận';
};

export const formatLocation = (location) => {
    if (!location) return '—';
    const parts = [location.district, location.city].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : location.address || '—';
};

export const formatRelativeTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'Vừa đăng';
    if (minutes < 60) return `Đăng ${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Đăng ${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `Đăng ${days} ngày trước`;
    return date.toLocaleDateString('vi-VN');
};

export const getBusinessInitial = (name) => {
    if (!name) return '?';
    return name.trim().charAt(0).toUpperCase();
};
