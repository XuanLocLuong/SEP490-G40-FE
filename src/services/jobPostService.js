import {
    JOB_POST_ACTION,
    JOB_POST_MAX_AGE,
    JOB_POST_MAX_JOB_TYPES,
    JOB_POST_MAX_REQUIRED_CANDIDATES,
    JOB_POST_MIN_AGE,
} from '../constants/jobPost.js';

export { JOB_POST_MAX_REQUIRED_CANDIDATES };

// ---------------------------------------------------------------------------
// Adapter giữa shape UI (form + shiftBlocks) <-> payload BE (JobSaveRequest).
//
// Điểm quan trọng:
//   - UI dùng shiftBlocks: [{ days: ['2','4'], startTime, endTime }]
//   - BE cần jobShifts: mỗi phần tử = 1 ngày + 1 khung giờ
//   - expandShiftBlocks() "bẻ" block ra; groupShiftsForUi() gom lại khi edit
// ---------------------------------------------------------------------------

const toArray = (value) => (Array.isArray(value) ? value : []);

const JOB_TYPES_SEPARATOR = ',';

/** UI jobTypes[] → CSV lưu BE (jobs.job_type). */
export const joinJobTypeCodes = (jobTypes) => {
    const codes = toArray(jobTypes)
        .map((code) => String(code).trim())
        .filter(Boolean);
    return codes.length ? codes.join(JOB_TYPES_SEPARATOR) : '';
};

/** BE CSV → UI jobTypes[]. */
export const splitJobTypeCodes = (raw) => {
    if (!raw) return [];
    return String(raw)
        .split(JOB_TYPES_SEPARATOR)
        .map((code) => code.trim())
        .filter(Boolean);
};

const normalizeEducationLevelCode = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'object' && value.name) return String(value.name).trim();
    return String(value).trim();
};

export const sameSkillId = (a, b) =>
    a != null && b != null && String(a) === String(b);

/** Resolve skillIds → { id, name } từ catalog BE. */
export const resolveSkillsFromCatalog = (skillIds, skillsCatalog = []) => {
    const catalog = toArray(skillsCatalog);
    return toArray(skillIds)
        .map((skillId) => catalog.find((s) => sameSkillId(s.id, skillId)))
        .filter(Boolean)
        .map((skill) => ({ id: skill.id, name: skill.name }));
};

/** Chỉ giữ chữ số — lưu trong form (VD: "22000") */
export const parseSalaryInput = (value) => String(value ?? '').replace(/\D/g, '');

/** Hiển thị input lương: 4000 → "4.000" */
export const formatSalaryInputDisplay = (value) => {
    const digits = parseSalaryInput(value);
    if (!digits) return '';
    return Number(digits).toLocaleString('vi-VN');
};

/** Giá trị min cho hạn nộp — không chọn quá khứ */
export const getMinApplicationDeadline = () => {
    const now = new Date();
    now.setSeconds(0, 0);
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

/** "YYYY-MM-DDTHH:mm" → { date, time } */
export const splitDateTimeLocal = (value) => {
    if (!value) return { date: '', time: '' };
    const [date = '', time = ''] = String(value).split('T');
    return { date, time: time.slice(0, 5) };
};

/** Ghép ngày + giờ 24h thành "YYYY-MM-DDTHH:mm" */
export const joinDateTimeLocal = (date, time) => {
    if (!date) return '';
    const normalizedTime = time?.includes(':') ? time.slice(0, 5) : '08:00';
    return `${date}T${normalizedTime}`;
};

const isPastApplicationDeadline = (value) => {
    if (!value) return false;
    const deadline = new Date(value);
    return !Number.isNaN(deadline.getTime()) && deadline.getTime() <= Date.now();
};

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
    jobTypes: [],
    salaryMin: '',
    salaryMax: '',
    requiredCandidates: 1,
    businessId: null,
    locationId: '',
    applicationDeadline: '',
    isUrgent: false,
    minAge: '',
    maxAge: '',
    genderRequirement: 'ANY',
    educationRequirementMode: 'NONE',
    minEducationLevel: '',
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

    const minEducationCode = normalizeEducationLevelCode(detail.minEducationLevel);

    return {
        title: detail.title || '',
        description: detail.description || '',
        jobTypes: splitJobTypeCodes(detail.jobType),
        salaryMin: detail.salaryMin != null ? String(detail.salaryMin) : '',
        salaryMax: detail.salaryMax != null ? String(detail.salaryMax) : '',
        requiredCandidates: detail.requiredCandidates ?? 1,
        businessId: detail.businessId ?? detail.business?.id ?? null,
        locationId: detail.location?.id ? String(detail.location.id) : '',
        applicationDeadline: deadline,
        isUrgent: Boolean(detail.urgent),
        minAge: detail.minAge != null ? String(detail.minAge) : '',
        maxAge: detail.maxAge != null ? String(detail.maxAge) : '',
        genderRequirement: detail.genderRequirement || 'ANY',
        educationRequirementMode: minEducationCode ? 'MIN' : 'NONE',
        minEducationLevel: minEducationCode,
        skillIds: toArray(detail.requiredSkills).map((s) => s.id),
        shiftBlocks: groupShiftsForUi(detail.shifts),
    };
};

const parseNumber = (value) => {
    if (value === '' || value == null) return null;
    const cleaned = String(value).replace(/\D/g, '');
    if (!cleaned) return null;
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
};

/** Form UI -> JobSaveRequest payload */
export const buildSavePayload = (form, action, businessId) => {
    const jobShifts = expandShiftBlocks(form.shiftBlocks);
    const jobTypeCsv = joinJobTypeCodes(form.jobTypes);
    const minEducationLevel =
        form.educationRequirementMode === 'MIN' && form.minEducationLevel
            ? form.minEducationLevel
            : null;
    const gender =
        form.genderRequirement && form.genderRequirement !== 'ANY'
            ? form.genderRequirement
            : null;

    return {
        businessId: Number(businessId ?? form.businessId),
        title: form.title.trim(),
        description: form.description?.trim() || null,
        jobType: jobTypeCsv || null,
        minEducationLevel,
        genderRequirement: gender,
        minAge: parseNumber(form.minAge),
        maxAge: parseNumber(form.maxAge),
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
            block.endTime 
    );

const salaryRangeError = (form) => {
    const min = parseNumber(form.salaryMin);
    const max = parseNumber(form.salaryMax);
    if (min != null && max != null && min > max) {
        return 'Lương tối đa phải lớn hơn hoặc bằng lương tối thiểu.';
    }
    return null;
};

const ageRangeError = (form) => {
    const min = parseNumber(form.minAge);
    const max = parseNumber(form.maxAge);
    const outOfRange = (age) => age < JOB_POST_MIN_AGE || age > JOB_POST_MAX_AGE;
    if (min != null && outOfRange(min)) {
        return `Tuổi tối thiểu từ ${JOB_POST_MIN_AGE} đến ${JOB_POST_MAX_AGE}.`;
    }
    if (max != null && outOfRange(max)) {
        return `Tuổi tối đa từ ${JOB_POST_MIN_AGE} đến ${JOB_POST_MAX_AGE}.`;
    }
    if (min != null && max != null && min > max) {
        return 'Tuổi tối đa phải lớn hơn hoặc bằng tuổi tối thiểu.';
    }
    return null;
};

/** Mô tả là HTML (editor). Bỏ thẻ để biết còn chữ hay không. */
const descriptionHasText = (html) => {
    const text = String(html || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .trim();
    return text.length > 0;
};

const jobTypesError = (form, action) => {
    const types = toArray(form.jobTypes);
    if (action === JOB_POST_ACTION.SUBMIT && types.length === 0) {
        return 'Vui lòng chọn ít nhất một ngành nghề.';
    }
    if (types.length > JOB_POST_MAX_JOB_TYPES) {
        return 'Chỉ chọn tối đa ' + JOB_POST_MAX_JOB_TYPES + ' ngành nghề.';
    }
    return null;
};

/** Validate một field — dùng on blur; trả message hoặc null */
export const validateJobFormField = (field, form, action = null) => {
    switch (field) {
        case 'title':
            return !form.title?.trim() ? 'Vui lòng nhập tiêu đề tin tuyển dụng.' : null;
        case 'jobTypes':
            return jobTypesError(form, action);
        case 'minAge':
        case 'maxAge':
            return ageRangeError(form);
        case 'minEducationLevel':
            if (
                form.educationRequirementMode === 'MIN' &&
                action === JOB_POST_ACTION.SUBMIT &&
                !form.minEducationLevel
            ) {
                return 'Vui lòng chọn bậc học tối thiểu.';
            }
            return null;
        case 'locationId':
            return !form.locationId ? 'Vui lòng chọn địa điểm làm việc.' : null;
        case 'salaryMin':
        case 'salaryMax':
            return salaryRangeError(form);
        case 'applicationDeadline':
            // Nháp: để trống được. Đăng tin: bắt buộc. Có điền thì không được ở quá khứ.
            if (!form.applicationDeadline) {
                return action === JOB_POST_ACTION.SUBMIT
                    ? 'Vui lòng chọn hạn nộp hồ sơ.'
                    : null;
            }
            if (isPastApplicationDeadline(form.applicationDeadline)) {
                return 'Hạn nộp hồ sơ phải sau thời điểm hiện tại.';
            }
            return null;
        case 'description':
            if (action === JOB_POST_ACTION.SUBMIT && !descriptionHasText(form.description)) {
                return 'Vui lòng nhập mô tả công việc.';
            }
            return null;
        case 'skillIds':
            if (
                action === JOB_POST_ACTION.SUBMIT &&
                toArray(form.skillIds).length === 0
            ) {
                return 'Vui lòng chọn ít nhất một kỹ năng.';
            }
            return null;
        case 'requiredCandidates': {
            const n = parseNumber(form.requiredCandidates);
            if (n == null || n < 1) {
                return 'Số lượng tuyển tối thiểu là 1 người.';
            }
            if (n > JOB_POST_MAX_REQUIRED_CANDIDATES) {
                return 'Số lượng tuyển tối đa là ' + JOB_POST_MAX_REQUIRED_CANDIDATES + ' người.';
            }
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
    if (field === 'minAge' || field === 'maxAge') return 'maxAge';
    return field;
};

/** Validate trước khi gọi API — trả { valid, errors } */
export const validateJobForm = (form, action) => {
    const errors = {};
    const fields =
        action === JOB_POST_ACTION.SUBMIT
            ? [
                  'title',
                  'jobTypes',
                  'locationId',
                  'salaryMin',
                  'requiredCandidates',
                  'applicationDeadline',
                  'minEducationLevel',
                  'minAge',
                  'description',
                  'skillIds',
              ]
            : ['title', 'locationId', 'salaryMin', 'minAge'];
        
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

/** Map form đăng tin → shape JobDetailDTO cho JobDetailPanel preview */
export const toPreviewJobDetail = (
    form,
    businessName,
    businessLocation,
    logoUrl = null,
    skillsCatalog = []
) => {
    const requiredCandidates = parseNumber(form.requiredCandidates) ?? 1;
    const applicationDeadline = form.applicationDeadline
        ? new Date(form.applicationDeadline).toISOString()
        : null;

    const requiredSkills = resolveSkillsFromCatalog(form.skillIds, skillsCatalog).map(
        (skill) => ({ id: skill.id, name: skill.name, weight: 1 })
    );

    return {
        id: 'preview',
        title: form.title?.trim() || 'Tiêu đề tin tuyển dụng',
        description: form.description?.trim() || '',
        jobType: joinJobTypeCodes(form.jobTypes) || null,
        salaryMin: parseNumber(form.salaryMin),
        salaryMax: parseNumber(form.salaryMax),
        requiredCandidates,
        urgent: Boolean(form.isUrgent),
        applicationDeadline,
        createdAt: new Date().toISOString(),
        applicationCount: 0,
        filledPositions: 0,
        remainingPositions: requiredCandidates,
        vacancyAvailable: true,
        saveCount: 0,
        viewCount: 0,
        saved: false,
        applied: false,
        location: businessLocation
            ? {
                  ward: businessLocation.ward,
                  district: businessLocation.ward,
                  city: businessLocation.city,
                  address: businessLocation.address,
                  name: businessLocation.name,
              }
            : null,
        business: {
            name: businessName?.trim() || 'Doanh nghiệp của bạn',
            logoUrl: logoUrl || null,
        },
        shifts: expandShiftBlocks(form.shiftBlocks),
        requiredSkills,
    };
};

/** Map form → shape list card (Landing JobCard) */
export const toPreviewJob = (
    form,
    businessName,
    businessLocation,
    logoUrl = null,
    skillsCatalog = []
) => {
    const detail = toPreviewJobDetail(
        form,
        businessName,
        businessLocation,
        logoUrl,
        skillsCatalog
    );
    return {
        id: detail.id,
        title: detail.title,
        jobType: detail.jobType,
        salaryMin: detail.salaryMin,
        salaryMax: detail.salaryMax,
        urgent: detail.urgent,
        createdAt: detail.createdAt,
        location: detail.location,
        business: detail.business,
        shifts: detail.shifts,
        // Preview chưa có apply → chỗ trống = số người cần tuyển recruiter nhập
        requiredCandidates: detail.requiredCandidates,
        remainingPositions: detail.remainingPositions,
        vacancyAvailable: detail.vacancyAvailable,
    };
};

/** Hiển thị địa điểm doanh nghiệp (1 business = 1 location) */
export const formatLocationDisplay = (loc) => {
    if (!loc) return '—';
    const parts = [loc.name, loc.address, loc.ward, loc.city].filter(Boolean);
    return parts.join(', ') || `Địa điểm #${loc.id}`;
};
