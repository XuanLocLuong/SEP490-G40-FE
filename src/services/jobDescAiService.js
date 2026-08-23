import recruiterJobApi, { getRecruiterJobApiErrorMessage } from '../apis/RecruiterJobApi.jsx';
import { joinJobTypeCodes, resolveSkillsFromCatalog } from './jobPostService.js';

/**
 * Adapter AI gợi ý mô tả tin tuyển dụng.
 * BE: POST /jobs/ai/generate-description
 * Request: title + businessName bắt buộc; các field còn lại optional.
 * Response: { variants: [{ tone, label, description }] }
 */

/** Nhãn hiển thị FE — override youthful ("Trẻ trung" từ BE) → Thân thiện. */
export const TONE_DISPLAY_LABELS = {
    default: 'Chuyên nghiệp',
    concise: 'Ngắn gọn',
    youthful: 'Thân thiện',
};

const GENDER_AI_LABELS = {
    MALE: 'Nam',
    FEMALE: 'Nữ',
};

export const validateAiDescBasics = ({ title, businessName }) => {
    if (!title?.trim()) return 'Vui lòng nhập tiêu đề tin tuyển dụng trước.';
    if (!businessName?.trim()) return 'Thiếu tên doanh nghiệp. Hãy hoàn thiện hồ sơ trước.';
    return null;
};

const toOptionalNumber = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
};

const toOptionalString = (value) => {
    const s = value == null ? '' : String(value).trim();
    return s || null;
};

const resolveEducationLabel = (code, educationLevelOptions = []) => {
    const normalized = toOptionalString(code);
    if (!normalized) return null;
    const match = educationLevelOptions.find(
        (opt) => String(opt.value).toUpperCase() === normalized.toUpperCase()
    );
    return match?.label || normalized;
};

/** Map skillIds form → tên skill gửi BE (không gửi id). */
export const mapSkillIdsToNames = (skillIds, skillsCatalog = []) => {
    const names = resolveSkillsFromCatalog(skillIds, skillsCatalog).map((s) => s.name);
    return names.length ? names : null;
};

/**
 * Build payload generate-description từ form + profile.
 * Chỉ include field có giá trị. jobType = CSV ngành nghề (không gửi industry).
 */
export const buildGeneratePayload = ({
    title,
    businessName,
    jobTypes,
    jobType,
    salaryMin,
    salaryMax,
    requiredSkills,
    skillIds,
    skillsCatalog,
    requiredCandidates,
    location,
    isUrgent,
    minEducationLevel,
    educationRequirementMode,
    genderRequirement,
    minAge,
    maxAge,
    educationLevelOptions,
}) => {
    const payload = {
        title: String(title || '').trim(),
        businessName: String(businessName || '').trim(),
    };

    const jobTypeCsv =
        Array.isArray(jobTypes) && jobTypes.length
            ? joinJobTypeCodes(jobTypes)
            : toOptionalString(jobType);
    if (jobTypeCsv) payload.jobType = jobTypeCsv;

    const min = toOptionalNumber(salaryMin);
    if (min != null) payload.salaryMin = min;

    const max = toOptionalNumber(salaryMax);
    if (max != null) payload.salaryMax = max;

    const skills =
        Array.isArray(requiredSkills) && requiredSkills.length
            ? requiredSkills
            : mapSkillIdsToNames(skillIds, skillsCatalog);
    if (skills?.length) payload.requiredSkills = skills;

    const candidates = toOptionalNumber(requiredCandidates);
    if (candidates != null) payload.requiredCandidates = Math.trunc(candidates);

    const locationVal = toOptionalString(location);
    if (locationVal && locationVal !== '—') payload.location = locationVal;

    if (typeof isUrgent === 'boolean') payload.isUrgent = isUrgent;

    if (educationRequirementMode === 'MIN' && minEducationLevel) {
        const eduLabel = resolveEducationLabel(minEducationLevel, educationLevelOptions);
        if (eduLabel) payload.minEducationLevel = eduLabel;
    }

    const gender = toOptionalString(genderRequirement);
    if (gender && gender !== 'ANY') {
        payload.genderRequirement = GENDER_AI_LABELS[gender] || gender;
    }

    const ageMin = toOptionalNumber(minAge);
    if (ageMin != null) payload.minAge = Math.trunc(ageMin);

    const ageMax = toOptionalNumber(maxAge);
    if (ageMax != null) payload.maxAge = Math.trunc(ageMax);

    return payload;
};

export const resolveVariantLabel = (variant) => {
    const tone = variant?.tone;
    if (tone && TONE_DISPLAY_LABELS[tone]) return TONE_DISPLAY_LABELS[tone];
    return variant?.label || tone || 'Phiên bản';
};

/** Chuẩn hoá & sắp xếp variants theo thứ tự tab. */
export const normalizeVariants = (data) => {
    const list = Array.isArray(data?.variants) ? data.variants : [];
    const order = ['concise', 'default', 'youthful'];
    const sorted = [...list].sort((a, b) => {
        const ia = order.indexOf(a?.tone);
        const ib = order.indexOf(b?.tone);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
    return sorted
        .filter((v) => v?.description?.trim())
        .map((v) => ({
            tone: v.tone,
            label: resolveVariantLabel(v),
            description: v.description.trim(),
        }));
};

export const fetchJobDescription = async (formContext) => {
    const error = validateAiDescBasics(formContext);
    if (error) throw new Error(error);
    const payload = buildGeneratePayload(formContext);
    return recruiterJobApi.generateJobDescription(payload);
};

export { getRecruiterJobApiErrorMessage };
