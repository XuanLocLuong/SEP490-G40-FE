// Map mã lỗi/thông điệp thô từ backend -> tiếng Việt dễ hiểu cho người dùng.
const AUTH_ERROR_MESSAGES = {
    EMAIL_ALREADY_USED: 'Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.',
    ROLE_REQUIRED: 'Vui lòng chọn vai trò (Ứng viên hoặc Nhà tuyển dụng).',
    ROLE_MUST_BE_CANDIDATE_OR_RECRUITER: 'Vai trò không hợp lệ. Vui lòng chọn Ứng viên hoặc Nhà tuyển dụng.',
    USERNAME_OR_EMAIL_REQUIRED: 'Vui lòng nhập email.',
    'Incorrect username/email or password!': 'Email hoặc mật khẩu không đúng.',
    'User is disabled': 'Tài khoản của bạn đang bị khoá hoặc chưa được kích hoạt. Vui lòng liên hệ hỗ trợ.',
    'Invalid refresh token': 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    'Refresh token is invalid or expired': 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
};

const DEFAULT_MESSAGE = 'Đã có lỗi xảy ra. Vui lòng thử lại.';

// Backend đôi khi trả message thô từ Spring validation (@Valid) — quá kỹ
// thuật để hiển thị thẳng, nên fallback về câu chung chung dễ hiểu hơn.
const VALIDATION_FALLBACK_MESSAGE =
    'Thông tin bạn nhập chưa hợp lệ. Vui lòng kiểm tra lại email và mật khẩu (tối thiểu 6 ký tự).';

export function getAuthErrorMessage(error) {
    const backendMessage = error?.response?.data?.message;

    if (!backendMessage) {
        return DEFAULT_MESSAGE;
    }

    if (AUTH_ERROR_MESSAGES[backendMessage]) {
        return AUTH_ERROR_MESSAGES[backendMessage];
    }

    if (backendMessage.startsWith('Validation failed for argument')) {
        return VALIDATION_FALLBACK_MESSAGE;
    }

    return DEFAULT_MESSAGE;
}