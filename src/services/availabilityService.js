import { toApiDayValue, toDayKey } from '../components/candidate/availabilityConstants.js';
import { resolveAiUserErrorMessage } from '../utils/aiErrorMessage.js';

export const SCHEDULE_MODES = {
    MANUAL: 'MANUAL',
    CALCULATED: 'CALCULATED',
};

/** Chuẩn hoá mode từ BE (không còn sessionStorage override). */
export const resolveScheduleMode = (apiMode) => {
    if (apiMode === SCHEDULE_MODES.MANUAL) return SCHEDULE_MODES.MANUAL;
    if (apiMode === SCHEDULE_MODES.CALCULATED) return SCHEDULE_MODES.CALCULATED;
    return apiMode || null;
};

export const isCalculatedScheduleMode = (mode) =>
    mode !== SCHEDULE_MODES.MANUAL &&
    (mode === SCHEDULE_MODES.CALCULATED || mode == null || mode === '');

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

/** GET /schedule/summary */
export const normalizeScheduleSummary = (data) => {
    const root = data && !Array.isArray(data) ? data : {};
    return {
        scheduleMode: resolveScheduleMode(root.scheduleMode),
        isTimetableApplied: Boolean(root.isTimetableApplied ?? root.timetableApplied),
        isTimetableExpired: Boolean(root.isTimetableExpired ?? root.timetableExpired),
        appliedJobCount: Number(root.appliedJobCount) || 0,
        totalHiredJobCount: Number(root.totalHiredJobCount) || 0,
        availabilityStartDate: normalizeDate(root.availabilityStartDate),
        availabilityEndDate: normalizeDate(root.availabilityEndDate),
        freeSlots: normalizeSlotsContainer({ slots: root.freeSlots }).map(normalizeSlot),
    };
};

/** Scan response — slots là khung giờ RẢNH gợi ý, không phải TKB bận. */
export const normalizeScanResponse = (data) => {
    const root = data && !Array.isArray(data) ? data : { slots: data };
    const slots = normalizeSlotsContainer(root).map(normalizeSlot);
    return {
        startDate: normalizeDate(root.startDate),
        endDate: normalizeDate(root.endDate),
        slots,
        isAutoSaved: Boolean(root.isAutoSaved ?? root.autoSaved),
        warningMessage: root.warningMessage || null,
        imageUrl: root.imageUrl || '',
    };
};

/** GET /availability → { scheduleMode, startDate, endDate, slots }. */
export const normalizeAvailabilityResponse = (data) => {
    const root = data && !Array.isArray(data) ? data : { slots: data };
    const slots = normalizeSlotsContainer(root).map(normalizeSlot);
    return {
        scheduleMode: resolveScheduleMode(root.scheduleMode),
        startDate: normalizeDate(root.startDate),
        endDate: normalizeDate(root.endDate),
        slots,
        isAutoSaved: Boolean(root.isAutoSaved ?? root.autoSaved),
        imageUrl: root.imageUrl || '',
    };
};

/** GET /timetable */
export const normalizeTimetableResponse = (data) => {
    if (!data) {
        return {
            startDate: '',
            endDate: '',
            source: null,
            isApplied: false,
            slots: [],
        };
    }
    const root = data?.timetable && typeof data.timetable === 'object' ? data.timetable : data;
    return {
        startDate: normalizeDate(root.startDate),
        endDate: normalizeDate(root.endDate),
        source: root.source || null,
        isApplied: Boolean(root.isApplied),
        slots: normalizeSlotsContainer(root).map(normalizeSlot),
    };
};

export const normalizeHiredJobSchedule = (job = {}) => ({
    applicationId: job.applicationId,
    jobId: job.jobId,
    jobTitle: job.jobTitle || '',
    jobStatus: job.jobStatus || null,
    // BE hired list trả `applied`; một số chỗ khác có thể dùng `isApplied`.
    isApplied: Boolean(job.isApplied ?? job.applied),
    shifts: normalizeSlotsContainer({ slots: job.shifts }).map(normalizeSlot),
});

/** POST/PUT timetable | availability body. */
export const toSchedulePayload = (slots, { startDate, endDate } = {}) => ({
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

export const toAvailabilityPayload = (slots, range) => toSchedulePayload(slots, range);

export const fetchAvailability = async (getAvailability) => {
    const data = unwrap(await getAvailability());
    return normalizeAvailabilityResponse(data);
};

export const fetchTimetable = async (getTimetable) => {
    const data = unwrap(await getTimetable());
    return normalizeTimetableResponse(data);
};

export const fetchScheduleSummary = async (getScheduleSummary) => {
    const data = unwrap(await getScheduleSummary());
    return normalizeScheduleSummary(data);
};

export const getScheduleApiErrorMessage = (error, fallback = 'Có lỗi xảy ra') =>
    resolveAiUserErrorMessage(
        error,
        error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            fallback
    );

/** @deprecated dùng fetchAvailability — giữ alias cho chỗ chỉ cần slots. */
export const fetchAvailabilitySlots = async (getAvailability) => {
    const result = await fetchAvailability(getAvailability);
    return result.slots;
};

export const getLocalDateString = (date = new Date()) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

/** TKB hết hạn khi endDate < hôm nay (local). */
export const isTimetableEndDateExpired = (endDate, today = getLocalDateString()) => {
    const end = normalizeDate(endDate);
    return Boolean(end && end < today);
};

export const validateAvailabilityRange = ({ startDate, endDate }, { disallowPastEnd = false } = {}) => {
    if (!startDate || !endDate) {
        return 'Vui lòng chọn ngày bắt đầu và ngày kết thúc.';
    }
    if (endDate < startDate) {
        return 'Ngày kết thúc phải từ ngày bắt đầu trở đi.';
    }
    if (disallowPastEnd && isTimetableEndDateExpired(endDate)) {
        return 'Ngày kết thúc không được trước hôm nay. Vui lòng cập nhật khoảng ngày lịch bận.';
    }
    return null;
};

const daysIntersect = (a = [], b = []) => {
    const setB = new Set(toArray(b).map(String));
    return toArray(a).some((day) => setB.has(String(day)));
};

const timesOverlap = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;

export const validateAvailabilitySlots = (slots) => {
    const errors = {};
    const list = toArray(slots);

    list.forEach((slot, index) => {
        if (!toArray(slot.days).length || !slot.start || !slot.end) {
            errors[index] = 'Vui lòng chọn ít nhất một thứ và đủ giờ bắt đầu/kết thúc.';
            return;
        }
        if (slot.start >= slot.end) {
            errors[index] = 'Giờ bắt đầu phải nhỏ hơn giờ kết thúc.';
        }
    });

    for (let i = 0; i < list.length; i += 1) {
        if (errors[i]) continue;
        for (let j = i + 1; j < list.length; j += 1) {
            if (errors[j]) continue;
            const a = list[i];
            const b = list[j];
            if (!daysIntersect(a.days, b.days)) continue;
            if (!timesOverlap(a.start, a.end, b.start, b.end)) continue;
            const msg = 'Khung giờ bị trùng trong cùng một ngày. Vui lòng chỉnh lại.';
            errors[i] = msg;
            errors[j] = msg;
        }
    }

    return errors;
};

export const SCHEDULE_BANNER_DISMISS_KEY = 'joblink.scheduleSoftBanner.v2.dismissed';

/** Soft banner — khớp data summary /jobs/hired (không dùng applications HIRED đơn). */
export const shouldShowScheduleSoftBanner = (summary) => {
    if (!summary) return false;
    return (
        summary.appliedJobCount > 0 ||
        summary.totalHiredJobCount > 0 ||
        summary.isTimetableExpired
    );
};

/** Dọn dismiss cũ; banner “Để sau” chỉ dùng React state. */
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

/** Alias tương thích soft-banner hook. */
export const normalizeHiredJob = normalizeHiredJobSchedule;
export const normalizeHiredJobs = (data) => toArray(data).map(normalizeHiredJobSchedule);

export const fetchHiredJobShifts = async (getHired) => {
    const data = unwrap(await getHired());
    return normalizeHiredJobs(data);
};
