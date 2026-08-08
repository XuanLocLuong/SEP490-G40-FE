import { toApiDayValue, toDayKey } from '../components/candidate/availabilityConstants.js';

const unwrap = (res) => res?.data?.data ?? res?.data ?? null;

const toArray = (value) => (Array.isArray(value) ? value : []);

const normalizeTime = (value) => {
    if (!value) return '';
    return String(value).slice(0, 5);
};

const normalizeDate = (value) => {
    if (!value) return '';
    return String(value).slice(0, 10);
};

export const normalizeDays = (value) => {
    if (Array.isArray(value)) {
        return value.map((day) => toDayKey(day)).filter(Boolean);
    }
    const single = toDayKey(value);
    return single ? [single] : [];
};

export const normalizeSlotsContainer = (data) => {
    if (Array.isArray(data)) return data;
    return data?.slots || data?.availability || data?.availabilities || data?.generatedSlots || [];
};

export const normalizeSlot = (slot = {}, index = 0) => ({
    id: slot.id,
    clientId: slot.clientId || `slot-${Date.now()}-${index}`,
    days: normalizeDays(slot.days ?? slot.dayOfWeek ?? slot.weekday ?? slot.day),
    start: normalizeTime(slot.start ?? slot.startTime ?? slot.fromTime),
    end: normalizeTime(slot.end ?? slot.endTime ?? slot.toTime),
});

/** GET /availability → { startDate, endDate, slots, scheduleMode }. */
export const normalizeAvailabilityResponse = (data) => {
    const root = data && !Array.isArray(data) ? data : { slots: data };
    const slots = normalizeSlotsContainer(root).map(normalizeSlot);
    return {
        startDate: normalizeDate(root.startDate),
        endDate: normalizeDate(root.endDate),
        scheduleMode: root.scheduleMode || null,
        slots,
        isAutoSaved: Boolean(root.isAutoSaved),
    };
};

/** GET /schedule/summary */
export const normalizeScheduleSummary = (data = {}) => ({
    scheduleMode: data.scheduleMode || 'CALCULATED',
    isTimetableApplied: Boolean(data.isTimetableApplied ?? data.timetableApplied),
    isTimetableExpired: Boolean(data.isTimetableExpired ?? data.timetableExpired),
    appliedJobCount: Number(data.appliedJobCount) || 0,
    totalHiredJobCount: Number(data.totalHiredJobCount) || 0,
    availabilityStartDate: normalizeDate(data.availabilityStartDate),
    availabilityEndDate: normalizeDate(data.availabilityEndDate),
    freeSlots: normalizeSlotsContainer({ slots: data.freeSlots }).map(normalizeSlot),
});

/** GET /jobs/hired → list HiredJobShiftDTO */
export const normalizeHiredJob = (job = {}, index = 0) => ({
    applicationId: job.applicationId,
    jobId: job.jobId,
    jobTitle: job.jobTitle || `Công việc #${job.jobId || index + 1}`,
    jobStatus: job.jobStatus || '',
    isApplied: Boolean(job.isApplied ?? job.applied),
    shifts: toArray(job.shifts).map(normalizeSlot),
});

export const normalizeHiredJobs = (data) => toArray(data).map(normalizeHiredJob);

export const fetchScheduleSummary = async (getSummary) => {
    const data = unwrap(await getSummary());
    return normalizeScheduleSummary(data);
};

export const fetchHiredJobShifts = async (getHired) => {
    const data = unwrap(await getHired());
    return normalizeHiredJobs(data);
};

export const SCHEDULE_BANNER_DISMISS_KEY = 'joblink.scheduleSoftBanner.v2.dismissed';

/** Hiện khi lịch gợi ý có thể bị “chiếm” bởi job/TKB cũ. */
export const shouldShowScheduleSoftBanner = (summary) => {
    if (!summary) return false;
    return (
        summary.appliedJobCount > 0 ||
        summary.totalHiredJobCount > 0 ||
        summary.isTimetableExpired
    );
};

/**
 * Dọn dismiss cũ (local/session). Banner “Để sau” chỉ dùng state trong React —
 * reload trang là hiện lại.
 */
export const clearScheduleBannerDismissPersist = () => {
    try {
        sessionStorage.removeItem(SCHEDULE_BANNER_DISMISS_KEY);
        localStorage.removeItem('joblink.scheduleSoftBanner.v2.dismissUntil');
        localStorage.removeItem('joblink.scheduleSoftBanner.dismissUntil');
        localStorage.removeItem(SCHEDULE_BANNER_DISMISS_KEY);
    } catch {
        /* ignore */
    }
};

/** PUT/POST body: { startDate, endDate, slots }. */
export const toAvailabilityPayload = (slots, { startDate, endDate } = {}) => ({
    startDate: normalizeDate(startDate) || null,
    endDate: normalizeDate(endDate) || null,
    slots: toArray(slots).map((slot) => ({
        days: toArray(slot.days)
            .map((day) => toApiDayValue(day))
            .filter((day) => day != null),
        start: slot.start,
        end: slot.end,
    })),
});

export const fetchAvailability = async (getAvailability) => {
    const data = unwrap(await getAvailability());
    return normalizeAvailabilityResponse(data);
};

/** @deprecated dùng fetchAvailability — giữ alias cho chỗ chỉ cần slots. */
export const fetchAvailabilitySlots = async (getAvailability) => {
    const result = await fetchAvailability(getAvailability);
    return result.slots;
};

export const validateAvailabilityRange = ({ startDate, endDate }) => {
    if (!startDate || !endDate) {
        return 'Vui lòng chọn ngày bắt đầu và ngày kết thúc.';
    }
    if (endDate < startDate) {
        return 'Ngày kết thúc phải từ ngày bắt đầu trở đi.';
    }
    return null;
};

export const validateAvailabilitySlots = (slots) => {
    const errors = {};
    slots.forEach((slot, index) => {
        if (!toArray(slot.days).length || !slot.start || !slot.end) {
            errors[index] = 'Vui lòng chọn ít nhất một thứ và đủ giờ bắt đầu/kết thúc.';
            return;
        }
        if (slot.start >= slot.end) {
            errors[index] = 'Giờ bắt đầu phải nhỏ hơn giờ kết thúc.';
        }
    });
    return errors;
};
