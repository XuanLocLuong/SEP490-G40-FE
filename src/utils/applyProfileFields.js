/**
 * Field bắt buộc để Candidate apply (khớp BE missingProfileFields).
 * Không gồm: bio, school/MSSV, work history, availability, lương, quốc tịch…
 */
export const APPLY_REQUIRED_PROFILE_FIELD_LABELS = {
    fullName: 'Họ tên',
    email: 'Email',
    phone: 'Số điện thoại',
    dateOfBirth: 'Ngày sinh',
    gender: 'Giới tính',
    address: 'Địa chỉ',
    educationLevel: 'Trình độ học vấn',
    skills: 'Kỹ năng (ít nhất 1)',
    preferredJobType: 'Lĩnh vực mong muốn',
    preferredLocation: 'Địa điểm tìm việc',
};

export const getMissingProfileFieldLabel = (key) =>
    APPLY_REQUIRED_PROFILE_FIELD_LABELS[key] || key;

/** Danh sách nhãn VI từ missingProfileFields preview. */
export const formatMissingProfileFieldLabels = (fields) => {
    if (!Array.isArray(fields) || fields.length === 0) return [];
    return fields.map((key) => getMissingProfileFieldLabel(String(key).trim())).filter(Boolean);
};

/**
 * Message PROFILE_INCOMPLETE — ưu tiên liệt kê field thiếu từ preview.
 */
export const getProfileIncompleteMessage = (missingFields) => {
    const labels = formatMissingProfileFieldLabels(missingFields);
    if (labels.length === 0) {
        return 'Hồ sơ của bạn chưa đủ thông tin bắt buộc.';
    }
    return `Hồ sơ của bạn chưa đủ thông tin bắt buộc (${labels.join(', ')}).`;
};

const hasText = (value) => Boolean(String(value ?? '').trim());

/**
 * Trả về danh sách các trường tiếng Việt còn thiếu để Candidate đủ điều kiện apply.
 */
export const getCandidateMissingApplyFields = (draft) => {
    if (!draft) return [];
    const missing = [];
    const personal = draft.personalInfo || {};
    const pref = draft.jobPreference || {};
    const edu = draft.education || {};

    if (!hasText(draft.fullName)) missing.push('họ tên');
    if (!hasText(personal.phone)) missing.push('số điện thoại');
    if (!personal.birthday) missing.push('ngày sinh');
    if (!hasText(personal.gender)) missing.push('giới tính');
    if (!hasText(personal.address)) missing.push('địa chỉ');
    if (!hasText(edu.educationLevel)) missing.push('trình độ học vấn');
    if (!Array.isArray(pref.jobTypes) || pref.jobTypes.length === 0) missing.push('lĩnh vực mong muốn');
    if (pref.latitude == null || pref.longitude == null) missing.push('địa điểm tìm việc');
    if (!Array.isArray(draft.skills) || draft.skills.length === 0) missing.push('kỹ năng');

    return missing;
};

export const isCandidateDraftReadyToApply = (draft) =>
    getCandidateMissingApplyFields(draft).length === 0;

