import { toApiDayValue, toDayKey } from '../components/candidate/availabilityConstants.js';

const unwrap = (res) => res?.data?.data ?? res?.data ?? null;

const toArray = (value) => (Array.isArray(value) ? value : []);

const normalizeTime = (value) => {
    if (!value) return '';
    return String(value).slice(0, 5);
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

// PUT body: days phải là số nguyên (DayOfWeek), không gửi "MONDAY".
export const toAvailabilityPayload = (slots) =>
    slots.map((slot) => ({
        ...(slot.id != null ? { id: slot.id } : {}),
        days: toArray(slot.days)
            .map((day) => toApiDayValue(day))
            .filter((day) => day != null),
        start: slot.start,
        end: slot.end,
    }));

export const fetchAvailabilitySlots = async (getAvailability) => {
    const data = unwrap(await getAvailability());
    return normalizeSlotsContainer(data).map(normalizeSlot);
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
