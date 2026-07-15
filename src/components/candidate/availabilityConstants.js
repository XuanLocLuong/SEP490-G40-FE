// UI dùng value string (MONDAY...); backend AvailabilitySlotDTO.days là List<Integer>
// theo quy ước VN: 2=Thứ 2, 3=Thứ 3, ..., 8=Chủ nhật (KHÔNG phải DayOfWeek 1-7).
export const WEEKDAYS = [
    { value: 'MONDAY', apiValue: 2, short: 'T2', label: 'Thứ 2' },
    { value: 'TUESDAY', apiValue: 3, short: 'T3', label: 'Thứ 3' },
    { value: 'WEDNESDAY', apiValue: 4, short: 'T4', label: 'Thứ 4' },
    { value: 'THURSDAY', apiValue: 5, short: 'T5', label: 'Thứ 5' },
    { value: 'FRIDAY', apiValue: 6, short: 'T6', label: 'Thứ 6' },
    { value: 'SATURDAY', apiValue: 7, short: 'T7', label: 'Thứ 7' },
    { value: 'SUNDAY', apiValue: 8, short: 'CN', label: 'Chủ nhật' },
];

const findWeekday = (value) => {
    if (value == null || value === '') return null;
    const num = Number(value);
    if (!Number.isNaN(num) && String(value).trim() !== '') {
        return WEEKDAYS.find((day) => day.apiValue === num) || null;
    }
    const text = String(value).trim().toUpperCase();
    return (
        WEEKDAYS.find(
            (day) =>
                day.value === text ||
                day.short === value ||
                day.short === text ||
                day.label === value,
        ) || null
    );
};

export const toDayKey = (value) => findWeekday(value)?.value || null;

export const toApiDayValue = (value) => findWeekday(value)?.apiValue ?? null;

export const getWeekdayLabel = (value) => findWeekday(value)?.label || value || '--';

export const getWeekdayShort = (value) => findWeekday(value)?.short || value || '--';

export const formatDaysList = (days = []) => {
    if (!Array.isArray(days) || days.length === 0) return '--';
    return days.map((day) => getWeekdayShort(day)).join(', ');
};

export const createEmptyAvailabilitySlot = () => ({
    id: undefined,
    days: ['MONDAY'],
    start: '08:00',
    end: '12:00',
});
