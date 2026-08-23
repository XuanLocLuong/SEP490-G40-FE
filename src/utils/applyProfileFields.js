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
    address: 'Địa chỉ (kèm vị trí trên bản đồ)',
    educationLevel: 'Trình độ học vấn',
    skills: 'Kỹ năng (ít nhất 1)',
    preferredJobType: 'Lĩnh vực mong muốn',
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
