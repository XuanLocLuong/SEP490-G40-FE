import { JOB_POST_ACTION } from '../constants/jobPost.js';

// ---------------------------------------------------------------------------
// Adapter giữa shape UI (form + shiftBlocks) <-> payload BE (JobSaveRequest).
//
// Điểm quan trọng:
//   - UI dùng shiftBlocks: [{ days: ['2','4'], startTime, endTime }]
//   - BE cần jobShifts: mỗi phần tử = 1 ngày + 1 khung giờ
//   - expandShiftBlocks() "bẻ" block ra; groupShiftsForUi() gom lại khi edit
// ---------------------------------------------------------------------------

const toArray = (value) => (Array.isArray(value) ? value : []);

/** BE trả "07:00:00" — input type="time" cần "07:00" */
export const formatTimeForInput = (value) => {
    if (!value) return '';
    const str = String(value);
    return str.length >= 5 ? str.slice(0, 5) : str;
};

export const emptyShiftBlock = () => ({
    id: crypto.randomUUID?.() ?? `shift-${Date.now()}`,
    days: [],
    startTime: '08:00',
    endTime: '17:00',
});

export const emptyJobForm = () => ({
    title: '',
    description: '',
    jobType: 'PART_TIME',
    salaryMin: '',
    salaryMax: '',
    requiredCandidates: 1,
    locationId: '',
    applicationDeadline: '',
    isUrgent: false,
    skillIds: [],
    shiftBlocks: [emptyShiftBlock()],
});

/**
 * Gom các ca cùng start/end thành 1 block.
 * VD BE: [{day:'2',07:00-15:00},{day:'4',07:00-15:00}]
 *   -> [{days:['2','4'], startTime:'07:00', endTime:'15:00'}]
 */
export const groupShiftsForUi = (shifts) => {
    const list = toArray(shifts);
    if (!list.length) return [emptyShiftBlock()];

    const map = new Map();

    list.forEach((shift) => {
        const start = formatTimeForInput(shift.startTime);
        const end = formatTimeForInput(shift.endTime);
        const key = `${start}|${end}`;

        if (!map.has(key)) {
            map.set(key, {
                id: crypto.randomUUID?.() ?? `shift-${key}`,
                days: [],
                startTime: start,
                endTime: end,
            });
        }

        const day = String(shift.dayOfWeek);
        const block = map.get(key);
        if (!block.days.includes(day)) {
            block.days.push(day);
        }
    });

    return Array.from(map.values()).map((block) => ({
        ...block,
        days: [...block.days].sort((a, b) => Number(a) - Number(b)),
    }));
};

/** Bẻ shiftBlocks ra mảng jobShifts cho BE */
export const expandShiftBlocks = (shiftBlocks) => {
    const result = [];

    toArray(shiftBlocks).forEach((block) => {
        const startTime = formatTimeForInput(block.startTime);
        const endTime = formatTimeForInput(block.endTime);

        toArray(block.days).forEach((day) => {
            result.push({
                dayOfWeek: String(day),
                startTime,
                endTime,
            });
        });
    });

    return result;
};

/** Map JobDetailDTO (BE) -> state form (UI) */
export const mapJobDetailToForm = (detail) => {
    if (!detail) return emptyJobForm();

    const deadline = detail.applicationDeadline
        ? new Date(detail.applicationDeadline).toISOString().slice(0, 16)
        : '';

    return {
        title: detail.title || '',
        description: detail.description || '',
        jobType: detail.jobType || 'PART_TIME',
        salaryMin: detail.salaryMin ?? '',
        salaryMax: detail.salaryMax ?? '',
        requiredCandidates: detail.requiredCandidates ?? 1,
        locationId: detail.location?.id ? String(detail.location.id) : '',
        applicationDeadline: deadline,
        isUrgent: Boolean(detail.urgent),
        skillIds: toArray(detail.requiredSkills).map((s) => s.id),
        shiftBlocks: groupShiftsForUi(detail.shifts),
    };
};

const parseNumber = (value) => {
    if (value === '' || value == null) return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
};

/** Form UI -> JobSaveRequest payload */
export const buildSavePayload = (form, action) => {
    const jobShifts = expandShiftBlocks(form.shiftBlocks);

    return {
        title: form.title.trim(),
        description: form.description?.trim() || null,
        jobType: form.jobType,
        salaryMin: parseNumber(form.salaryMin),
        salaryMax: parseNumber(form.salaryMax),
        requiredCandidates: parseNumber(form.requiredCandidates) ?? 1,
        locationId: Number(form.locationId),
        applicationDeadline: form.applicationDeadline
            ? new Date(form.applicationDeadline).toISOString()
            : null,
        isUrgent: Boolean(form.isUrgent),
        requiredSkills: toArray(form.skillIds).map((skillId) => ({ skillId })),
        jobShifts,
        action,
    };
};

const hasValidShiftBlock = (blocks) =>
    toArray(blocks).some(
        (block) =>
            block.days?.length > 0 &&
            block.startTime &&
            block.endTime &&
            block.startTime < block.endTime
    );

const salaryRangeError = (form) => {
    const min = parseNumber(form.salaryMin);
    const max = parseNumber(form.salaryMax);
    if (min != null && max != null && min > max) {
        return 'Lương tối đa phải lớn hơn hoặc bằng lương tối thiểu.';
    }
    return null;
};

/** Validate một field — dùng on blur; trả message hoặc null */
export const validateJobFormField = (field, form, action = null) => {
    switch (field) {
        case 'title':
            return !form.title?.trim() ? 'Vui lòng nhập tiêu đề tin tuyển dụng.' : null;
        case 'jobType':
            return !form.jobType ? 'Vui lòng chọn loại công việc.' : null;
        case 'locationId':
            return !form.locationId ? 'Vui lòng chọn địa điểm làm việc.' : null;
        case 'salaryMin':
        case 'salaryMax':
            return salaryRangeError(form);
        case 'requiredCandidates': {
            const n = parseNumber(form.requiredCandidates);
            if (n == null || n < 1) return 'Số lượng tuyển tối thiểu là 1.';
            return null;
        }
        case 'shiftBlocks':
            if (action === JOB_POST_ACTION.SUBMIT && !hasValidShiftBlock(form.shiftBlocks)) {
                return 'Vui lòng thêm ít nhất một khung giờ làm việc hợp lệ.';
            }
            return null;
        default:
            return null;
    }
};

/** Map tên field validate -> key hiển thị lỗi trên form */
export const getJobFormErrorKey = (field) => {
    if (field === 'salaryMin' || field === 'salaryMax') return 'salaryMax';
    return field;
};

/** Validate trước khi gọi API — trả { valid, errors } */
export const validateJobForm = (form, action) => {
    const errors = {};
    const fields = ['title', 'jobType', 'locationId', 'salaryMin', 'requiredCandidates'];

    fields.forEach((field) => {
        const message = validateJobFormField(field, form, action);
        const errorKey = getJobFormErrorKey(field);
        if (message) errors[errorKey] = message;
    });

    const shiftMessage = validateJobFormField('shiftBlocks', form, action);
    if (shiftMessage) errors.shiftBlocks = shiftMessage;

    return {
        valid: Object.keys(errors).length === 0,
        errors,
    };
};

/** Hiển thị địa điểm doanh nghiệp (1 business = 1 location) */
export const formatLocationDisplay = (loc) => {
    if (!loc) return '—';
    const parts = [loc.name, loc.address, loc.ward, loc.city].filter(Boolean);
    return parts.join(', ') || `Địa điểm #${loc.id}`;
};

export const formatSalaryRange = (min, max) => {
    const fmt = (v) => formatVndSalary(v);

    const a = fmt(min);
    const b = fmt(max);
    if (a && b) return `${a} – ${b}`;
    if (a) return `Từ ${a}`;
    if (b) return `Đến ${b}`;
    return 'Thỏa thuận';
};

/** Định dạng tiền Việt — dưới 1tr: ₫/giờ, từ 1tr: triệu ₫/tháng */
export const formatVndSalary = (value) => {
    if (value == null || value === '') return null;
    const n = Number(value);
    if (!Number.isFinite(n)) return null;

    if (n >= 1_000_000) {
        const millions = n / 1_000_000;
        const text =
            millions % 1 === 0
                ? millions.toLocaleString('vi-VN')
                : millions.toLocaleString('vi-VN', { maximumFractionDigits: 1 });
        return `${text} triệu ₫/tháng`;
    }

    return `${n.toLocaleString('vi-VN')} ₫/giờ`;
};
