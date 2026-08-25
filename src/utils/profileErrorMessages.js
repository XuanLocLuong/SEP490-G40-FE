// Map toàn bộ mã lỗi thật từ CandidateProfileService -> tiếng Việt dễ hiểu.
const PROFILE_ERROR_MESSAGES = {
    USER_NOT_FOUND: 'Không tìm thấy người dùng.',
    IDENTITY_FIELD_LOCKED:
        'Bạn đã xác thực danh tính nên không thể tự sửa các thông tin định danh (họ tên, ngày sinh, giới tính, quốc tịch).',
    DATE_OF_BIRTH_IN_FUTURE: 'Ngày sinh không thể ở tương lai.',
    AGE_TOO_YOUNG: 'Bạn chưa đủ tuổi để sử dụng hệ thống (>= 16 tuổi).',
    AGE_TOO_OLD: 'Ngày sinh không hợp lệ. Vui lòng kiểm tra lại.',
    INVALID_SALARY_RANGE: 'Lương tối thiểu phải nhỏ hơn hoặc bằng lương tối đa.',
    LOCATION_COORDINATES_INCOMPLETE: 'Vui lòng chọn đầy đủ toạ độ trên bản đồ cho địa điểm tìm việc.',
    INVALID_SKILL_ID: 'Có kỹ năng không hợp lệ trong danh sách đã chọn.',
    SKILL_INACTIVE:
        'Một số kỹ năng đã bị vô hiệu hóa. Vui lòng gỡ và chọn kỹ năng khác trước khi lưu.',
    AVATAR_FILE_REQUIRED: 'Vui lòng chọn file ảnh.',
    AVATAR_INVALID_FORMAT: 'Chỉ chấp nhận file ảnh định dạng JPG, JPEG hoặc PNG.',
};

const DEFAULT_SAVE_ERROR = 'Lưu hồ sơ thất bại. Vui lòng thử lại.';
const DEFAULT_AVATAR_ERROR = 'Tải ảnh đại diện thất bại. Vui lòng thử lại.';

const resolveErrorKey = (error) =>
    error?.response?.data?.message || '';

export const getProfileSaveErrorMessage = (error) => {
    const key = resolveErrorKey(error);
    return PROFILE_ERROR_MESSAGES[key] || DEFAULT_SAVE_ERROR;
};

export const getAvatarErrorMessage = (error) => {
    const key = resolveErrorKey(error);
    return PROFILE_ERROR_MESSAGES[key] || DEFAULT_AVATAR_ERROR;
};
