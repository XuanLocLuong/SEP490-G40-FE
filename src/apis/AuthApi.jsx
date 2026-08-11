import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const AUTH_BASE = `${API_PREFIX}/auth`;

export const login = (data) => axiosClient.post(`${AUTH_BASE}/login`, data);

// data: { email, password, role } — role bắt buộc, chỉ nhận 'CANDIDATE' | 'RECRUITER'
// (AuthService.parsePublicRole bên BE chỉ tự tạo được 2 role này khi đăng ký công khai).
export const register = (data) => axiosClient.post(`${AUTH_BASE}/register`, data);

// data: { idToken, role? } — role optional nếu Google account đã tồn tại
export const loginWithGoogle = (data) => axiosClient.post(`${AUTH_BASE}/google`, data);

export const refreshToken = (data) => axiosClient.post(`${AUTH_BASE}/refresh`, data);

/**
 * Revoke session trên BE. Có thể truyền accessToken khi local auth đã clear
 * (tránh race: landing refetch gắn Bearer đã revoke → 401 trên API public).
 */
export const logout = (accessToken) =>
    axiosClient.post(
        `${AUTH_BASE}/logout`,
        null,
        accessToken
            ? { headers: { Authorization: `Bearer ${accessToken}` } }
            : undefined
    );

/** data: { email } — luôn 200 nếu hợp lệ; không lộ email có/không tồn tại. */
export const forgotPassword = (data) =>
    axiosClient.post(`${AUTH_BASE}/forgot-password`, data);

/** data: { token, newPassword } — min password 6 ký tự (BE). */
export const resetPassword = (data) =>
    axiosClient.post(`${AUTH_BASE}/reset-password`, data);

/** POST /auth/resend-verification-email — Bearer bắt buộc, không body, không gửi email. */
export const resendVerificationEmail = () =>
    axiosClient.post(`${AUTH_BASE}/resend-verification-email`);
