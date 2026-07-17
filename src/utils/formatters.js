const JOB_TYPE_LABELS = {
    PART_TIME: 'Part-time',
    FULL_TIME: 'Full-time',
    INTERN: 'Thực tập',
    FREELANCE: 'Freelance',
    SEASONAL: 'Thời vụ',
};

export const formatJobType = (jobType) => {
    if (!jobType) return '';
    return JOB_TYPE_LABELS[jobType] || jobType.replace(/_/g, ' ');
};

/** BE summary: `isApply`; detail: `applied`. */
export const hasAppliedToJob = (job) => Boolean(job?.isApply || job?.applied);

const DAY_LABELS = {
    '2': 'T2',
    '3': 'T3',
    '4': 'T4',
    '5': 'T5',
    '6': 'T6',
    '7': 'T7',
    '8': 'CN',
    MONDAY: 'T2',
    TUESDAY: 'T3',
    WEDNESDAY: 'T4',
    THURSDAY: 'T5',
    FRIDAY: 'T6',
    SATURDAY: 'T7',
    SUNDAY: 'CN',
};

export const formatMatchPercent = (matchScore) => {
    if (matchScore == null || !Number.isFinite(Number(matchScore))) return null;
    return `${Math.round(Number(matchScore))}% phù hợp`;
};

/** Label lịch từ shifts + scheduleScore (BE không trả sẵn “T3, T5”). */
export const formatScheduleMatchLabel = (scheduleScore, shifts = []) => {
    if (scheduleScore == null || Number(scheduleScore) < 50) return null;
    const days = [
        ...new Set(
            (Array.isArray(shifts) ? shifts : [])
                .map((shift) => DAY_LABELS[String(shift?.dayOfWeek || '').toUpperCase()]
                    || DAY_LABELS[String(shift?.dayOfWeek || '')]
                    || null)
                .filter(Boolean)
        ),
    ];
    if (days.length === 0) return 'Khớp lịch rảnh';
    return `Khớp lịch rảnh ${days.join(', ')}`;
};

export const INTERACTION_ACTION_LABELS = {
    VIEW: 'Đã xem gần đây',
    SAVE: 'Đã lưu việc làm',
    APPLY: 'Đã ứng tuyển',
};

/** Ưu tiên hiển thị: APPLY > SAVE > VIEW — mỗi job chỉ 1 dòng. */
export const INTERACTION_ACTION_PRIORITY = {
    APPLY: 3,
    SAVE: 2,
    VIEW: 1,
};

/**
 * Gộp nhiều interaction cùng job → giữ action cao nhất.
 * (Phòng khi BE cũ còn trả đủ VIEW/SAVE/APPLY cho 1 job.)
 */
export const dedupeInteractionsByPriority = (rows = []) => {
    const bestByJob = new Map();
    for (const row of rows) {
        const jobId = row?.jobId;
        if (jobId == null) continue;
        const existing = bestByJob.get(jobId);
        if (!existing) {
            bestByJob.set(jobId, row);
            continue;
        }
        const nextPriority = INTERACTION_ACTION_PRIORITY[row.actionType] || 0;
        const prevPriority = INTERACTION_ACTION_PRIORITY[existing.actionType] || 0;
        if (nextPriority > prevPriority) {
            bestByJob.set(jobId, row);
        } else if (nextPriority === prevPriority) {
            const nextTime = new Date(row.createdAt || 0).getTime();
            const prevTime = new Date(existing.createdAt || 0).getTime();
            if (nextTime > prevTime) bestByJob.set(jobId, row);
        }
    }
    return Array.from(bestByJob.values()).sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
};

/** Map JobRecommendationDTO → shape JobCard dùng được. */
export const mapRecommendationToJob = (rec) => {
    if (!rec) return null;
    return {
        id: rec.jobId,
        title: rec.title,
        jobType: rec.jobType,
        salaryMin: rec.salaryMin,
        salaryMax: rec.salaryMax,
        urgent: rec.urgent,
        location: rec.location,
        distanceKm: rec.distanceKm,
        business: { name: rec.businessName },
        matchPercentLabel: formatMatchPercent(rec.matchScore),
        // Cold start tái sử dụng scheduleScore cho jobType — không hiện tag “Khớp lịch rảnh”.
        scheduleMatchLabel: null,
        shifts: Array.isArray(rec.shifts) ? rec.shifts : [],
    };
};

/** Map interaction history row → JobCard-ish + interaction tag. */
export const mapInteractionToJob = (row) => {
    if (!row) return null;
    return {
        id: row.jobId,
        title: row.jobTitle,
        jobType: row.jobType,
        salaryMin: row.salaryMin,
        salaryMax: row.salaryMax,
        urgent: row.urgent,
        location: row.location,
        business: { name: row.businessName },
        interactionLabel: INTERACTION_ACTION_LABELS[row.actionType] || row.actionType,
        interactionType: row.actionType,
        createdAt: row.createdAt,
        isApply: row.actionType === 'APPLY',
    };
};

/** Dedupe theo ưu tiên rồi map sang job card/list. */
export const mapInteractionsToJobs = (rows) =>
    dedupeInteractionsByPriority(rows).map(mapInteractionToJob).filter(Boolean);

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

/** Gom ca theo khung giờ (start–end) cho section detail. */
export const groupShiftsForDisplay = (shifts = []) => {
    if (!shifts.length) return [];

    const groups = new Map();

    shifts.forEach((shift) => {
        const start = formatTimeLabel(shift.startTime);
        const end = formatTimeLabel(shift.endTime);
        const range = `${start} – ${end}`;

        if (!groups.has(range)) {
            groups.set(range, { range, days: new Set() });
        }
        groups.get(range).days.add(formatDayOfWeek(shift.dayOfWeek));
    });

    return Array.from(groups.values()).map((group) => ({
        range: group.range,
        days: Array.from(group.days).filter(Boolean),
    }));
};

export const formatShiftGroupLine = (group) => {
    if (!group) return '';
    const days = (group.days || []).filter(Boolean);
    const daysPart = days.length > 0 ? `${days.join(', ')} · ` : '';
    return `${daysPart}${group.range || ''}`.trim();
};

export const formatScheduleSummary = (shiftGroups = []) => {
    if (!shiftGroups.length) return 'Chưa có lịch ca';
    if (shiftGroups.length === 1) return formatShiftGroupLine(shiftGroups[0]);
    return 'Linh hoạt theo ca';
};

/** Nhãn ca ngắn cho JobCard / JobListItem (vd. "T2, T4 · 08:00–12:00"). */
export const formatJobShiftsLabel = (shifts = []) => {
    if (!Array.isArray(shifts) || shifts.length === 0) return null;

    const byRange = new Map();
    for (const shift of shifts) {
        const day =
            DAY_LABELS[String(shift?.dayOfWeek || '').toUpperCase()]
            || DAY_LABELS[String(shift?.dayOfWeek || '')]
            || null;
        if (!day) continue;
        const start = formatTimeLabel(shift.startTime);
        const end = formatTimeLabel(shift.endTime);
        if (!start || !end) continue;
        const range = `${start}–${end}`;
        if (!byRange.has(range)) byRange.set(range, new Set());
        byRange.get(range).add(day);
    }

    if (byRange.size === 0) return null;

    const entries = Array.from(byRange.entries()).map(([range, days]) => ({
        range,
        days: Array.from(days),
    }));

    if (entries.length === 1) {
        const { range, days } = entries[0];
        return `${days.join(', ')} · ${range}`;
    }

    if (entries.length === 2) {
        return entries.map(({ range, days }) => `${days.join(', ')} ${range}`).join(' · ');
    }

    const allDays = [...new Set(entries.flatMap((e) => e.days))];
    return `${allDays.join(', ')} · ${entries.length} ca`;
};

