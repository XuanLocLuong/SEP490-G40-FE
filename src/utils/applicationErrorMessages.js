// Map các mã lỗi/blockingReason thật từ ApplicationService -> tiếng Việt dễ hiểu.
import { getProfileIncompleteMessage } from './applyProfileFields.js';

const REASON_MESSAGES = {
    JOB_NOT_OPEN: 'Tin tuyển dụng này hiện không còn mở.',
    JOB_DEADLINE_PASSED: 'Đã hết hạn nộp đơn cho tin tuyển dụng này.',
    PROFILE_INCOMPLETE: 'Hồ sơ của bạn chưa đủ thông tin bắt buộc.',
    ALREADY_APPLIED: 'Bạn đã ứng tuyển công việc này rồi.',
    JOB_FULL: 'Tin tuyển dụng đã đủ số lượng ứng viên cần tuyển.',
    EMAIL_NOT_VERIFIED: 'Bạn cần xác thực email trước khi ứng tuyển.',
    JOB_NOT_FOUND: 'Không tìm thấy tin tuyển dụng này.',
    CANDIDATE_PROFILE_NOT_FOUND: 'Không tìm thấy hồ sơ ứng viên của bạn.',
    CV_INVALID_FORMAT: 'Định dạng CV không hợp lệ (hỗ trợ PDF, DOC, DOCX).',
    CV_FILE_TOO_LARGE: 'Dung lượng CV quá lớn (tối đa 5MB).',
    INVALID_APPLICATION_SOURCE: 'Nguồn ứng tuyển không hợp lệ.',
};

const DEFAULT_MESSAGE = 'Không thể thực hiện ứng tuyển. Vui lòng thử lại.';

export const getReasonMessage = (reasonCode, { missingProfileFields } = {}) => {
    if (reasonCode === 'PROFILE_INCOMPLETE') {
        return getProfileIncompleteMessage(missingProfileFields);
    }
    return REASON_MESSAGES[reasonCode] || reasonCode;
};

export const getApplyErrorMessage = (error) => {
    const data = error?.response?.data;
    const backendMessage = data?.message;
    if (backendMessage === 'PROFILE_INCOMPLETE') {
        return getProfileIncompleteMessage(
            data?.missingProfileFields || data?.data?.missingProfileFields
        );
    }
    if (backendMessage && REASON_MESSAGES[backendMessage]) {
        return REASON_MESSAGES[backendMessage];
    }
    // Nếu backend trả câu văn bản tiếng Việt trực tiếp (ví dụ: "Đã tuyển đủ người cho vị trí này.")
    if (typeof backendMessage === 'string' && backendMessage.trim() && !/^[A-Z0-9_]+$/.test(backendMessage.trim())) {
        return backendMessage;
    }
    return DEFAULT_MESSAGE;
};

export const APPLICATION_REJECT_REASONS = {
    INSUFFICIENT_EXPERIENCE: 'Chưa đủ kinh nghiệm yêu cầu',
    SKILL_MISMATCH: 'Kỹ năng chưa phù hợp',
    POSITION_FILLED: 'Vị trí tuyển dụng đã đủ người',
    CANDIDATE_WITHDREW: 'Ứng viên đã rút đơn',
    INVALID_PROFILE: 'Thông tin hồ sơ chưa hợp lệ',
    OFFER_DECLINED: 'Ứng viên từ chối nhận việc',
    OFFER_EXPIRED: 'Lời mời nhận việc đã hết hạn',
    OTHER: 'Lý do khác',
};

export const getRejectReasonLabel = (reason) => {
    if (!reason) return 'Chưa có lý do cụ thể';
    return APPLICATION_REJECT_REASONS[reason] || reason;
};

