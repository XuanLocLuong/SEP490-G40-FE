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
 * Draft hồ sơ (shape FE nested) đã đủ field bắt buộc để apply.
 * Dùng để chỉ hiện popup "Quay lại tin tuyển dụng" khi đủ điều kiện.
 */
export const isCandidateDraftReadyToApply = (draft) => {
    if (!draft) return false;

    const personal = draft.personalInfo || {};
    const pref = draft.jobPreference || {};
    const edu = draft.education || {};

    if (!hasText(draft.fullName)) return false;
    if (!hasText(draft.email)) return false;
    if (!hasText(personal.phone)) return false;
    if (!personal.birthday) return false;
    if (!hasText(personal.gender)) return false;
    if (!hasText(personal.address)) return false;
    if (!hasText(edu.educationLevel)) return false;
    if (!Array.isArray(draft.skills) || draft.skills.length === 0) return false;
    if (!Array.isArray(pref.jobTypes) || pref.jobTypes.length === 0) return false;
    if (pref.latitude == null || pref.longitude == null) return false;

    return true;
};
