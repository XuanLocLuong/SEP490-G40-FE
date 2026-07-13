const APPLICATION_ERROR_MESSAGES = {
    JOB_NOT_OPEN: 'Tin tuyển dụng hiện không nhận ứng tuyển.',
    JOB_DEADLINE_PASSED: 'Đã quá hạn nộp hồ sơ cho tin này.',
    PROFILE_INCOMPLETE: 'Hồ sơ chưa đủ thông tin. Vui lòng cập nhật hồ sơ trước khi ứng tuyển.',
    ALREADY_APPLIED: 'Bạn đã ứng tuyển tin tuyển dụng này.',
    JOB_FULL: 'Tin tuyển dụng đã đủ số lượng ứng viên.',
    EMAIL_NOT_VERIFIED: 'Vui lòng xác thực email trước khi ứng tuyển.',
    JOB_NOT_FOUND: 'Không tìm thấy tin tuyển dụng.',
};

const BLOCKING_REASON_MESSAGES = {
    ...APPLICATION_ERROR_MESSAGES,
};

export const getApplicationErrorMessage = (error, fallback = 'Không thể ứng tuyển. Vui lòng thử lại.') => {
    const code = error?.response?.data?.message;
    if (code && APPLICATION_ERROR_MESSAGES[code]) {
        return APPLICATION_ERROR_MESSAGES[code];
    }
    return fallback;
};

export const getBlockingReasonMessage = (reason) =>
    BLOCKING_REASON_MESSAGES[reason] || 'Bạn chưa đủ điều kiện ứng tuyển tin này.';
