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
    const parts = [location.ward || location.district, location.city].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : location.address || '—';
};

/** Địa chỉ chi tiết (address/name) khi khác dòng tóm tắt ward/city. */
export const formatLocationAddressDetail = (location) => {
    if (!location) return '';
    const summary = formatLocation(location);
    const candidates = [location.address, location.name].filter(Boolean);
    const detail = candidates.find((line) => line.trim() && line.trim() !== summary);
    return detail?.trim() || '';
};

export const formatApplicationDeadline = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '';
    const formatted = date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
    return `Hạn nộp: ${formatted}`;
};

export const formatVacancyLabel = ({ remainingPositions, vacancyAvailable }) => {
    if (vacancyAvailable === false) {
        return 'Đã hết vị trí';
    }

    if (remainingPositions != null) {
        return `Còn ${remainingPositions} vị trí`;
    }

    return '';
};

export const isPrimarySkill = (weight) => weight != null && Number(weight) >= 1;

export const getEngagementStats = (viewCount, applicationCount, saveCount) => {
    const items = [];

    if (viewCount > 0) {
        items.push({ key: 'views', value: viewCount, label: 'Lượt xem' });
    }
    if (applicationCount > 0) {
        items.push({ key: 'applications', value: applicationCount, label: 'Ứng tuyển' });
    }
    if (saveCount > 0) {
        items.push({ key: 'saves', value: saveCount, label: 'Lượt lưu' });
    }

    return items;
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

const DAY_OF_WEEK_LABELS = {
    '2': 'Thứ 2',
    '3': 'Thứ 3',
    '4': 'Thứ 4',
    '5': 'Thứ 5',
    '6': 'Thứ 6',
    '7': 'Thứ 7',
    '8': 'Chủ nhật',
    MONDAY: 'Thứ 2',
    TUESDAY: 'Thứ 3',
    WEDNESDAY: 'Thứ 4',
    THURSDAY: 'Thứ 5',
    FRIDAY: 'Thứ 6',
    SATURDAY: 'Thứ 7',
    SUNDAY: 'Chủ nhật',
};

export const formatDayOfWeek = (dayOfWeek) => {
    if (!dayOfWeek) return '';
    const key = String(dayOfWeek).trim().toUpperCase();
    return DAY_OF_WEEK_LABELS[key] || key;
};

export const formatTimeLabel = (time) => {
    if (!time) return '';
    const [hour = '00', minute = '00'] = String(time).split(':');
    return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
};

const getShiftSlotLabel = (startTime) => {
    const hour = Number.parseInt(String(startTime).split(':')[0], 10);
    if (Number.isNaN(hour)) return 'Ca làm việc';
    if (hour < 12) return 'Ca Sáng';
    if (hour < 18) return 'Ca Chiều';
    return 'Ca Tối';
};

/** Gom ca theo khung giờ (Sáng / Chiều / Tối) cho section detail. */
export const groupShiftsForDisplay = (shifts = []) => {
    if (!shifts.length) return [];

    const groups = new Map();

    shifts.forEach((shift) => {
        const label = getShiftSlotLabel(shift.startTime);
        const start = formatTimeLabel(shift.startTime);
        const end = formatTimeLabel(shift.endTime);
        const range = `${start} – ${end}`;

        if (!groups.has(label)) {
            groups.set(label, { label, range, days: new Set() });
        }
        const group = groups.get(label);
        group.days.add(formatDayOfWeek(shift.dayOfWeek));
        if (!group.range && range !== ' – ') {
            group.range = range;
        }
    });

    return Array.from(groups.values()).map((group) => ({
        label: group.label,
        range: group.range,
        days: Array.from(group.days).filter(Boolean),
    }));
};

export const formatShiftGroupLine = (group) => {
    if (!group) return '';
    const days = (group.days || []).filter(Boolean);
    const daysPart = days.length > 0 ? `${days.join(', ')} · ` : '';
    const line = `${daysPart}${group.range || ''}`.trim();
    return line || group.label || '';
};

export const formatScheduleSummary = (shiftGroups = []) => {
    if (!shiftGroups.length) return 'Chưa có lịch ca';
    if (shiftGroups.length === 1) return formatShiftGroupLine(shiftGroups[0]);
    return 'Linh hoạt theo ca';
};
