// Map các mã lỗi/blockingReason thật từ ApplicationService -> tiếng Việt dễ hiểu.
const REASON_MESSAGES = {
    JOB_NOT_OPEN: 'Tin tuyển dụng này hiện không còn mở.',
    JOB_DEADLINE_PASSED: 'Đã hết hạn nộp đơn cho tin tuyển dụng này.',
    PROFILE_INCOMPLETE: 'Hồ sơ của bạn chưa đủ thông tin bắt buộc (họ tên, email, số điện thoại, ngày sinh).',
    ALREADY_APPLIED: 'Bạn đã ứng tuyển công việc này rồi.',
    JOB_FULL: 'Tin tuyển dụng đã đủ số lượng ứng viên cần tuyển.',
    EMAIL_NOT_VERIFIED: 'Bạn cần xác thực email trước khi ứng tuyển.',
    JOB_NOT_FOUND: 'Không tìm thấy tin tuyển dụng này.',
    CANDIDATE_PROFILE_NOT_FOUND: 'Không tìm thấy hồ sơ ứng viên của bạn.',
};

const DEFAULT_MESSAGE = 'Không thể thực hiện ứng tuyển. Vui lòng thử lại.';

export const getReasonMessage = (reasonCode) => REASON_MESSAGES[reasonCode] || reasonCode;

export const getApplyErrorMessage = (error) => {
    const backendMessage = error?.response?.data?.message;
    if (backendMessage && REASON_MESSAGES[backendMessage]) {
        return REASON_MESSAGES[backendMessage];
    }
    return DEFAULT_MESSAGE;
};