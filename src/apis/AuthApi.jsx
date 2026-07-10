import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const AUTH_BASE = `${API_PREFIX}/auth`;

export const login = (data) => axiosClient.post(`${AUTH_BASE}/login`, data);

// data: { email, password, role } — role bắt buộc, chỉ nhận 'CANDIDATE' | 'RECRUITER'
// (AuthService.parsePublicRole bên BE chỉ tự tạo được 2 role này khi đăng ký công khai).
export const register = (data) => axiosClient.post(`${AUTH_BASE}/register`, data);

// data: { idToken, role? } — role optional nếu Google account đã tồn tại
export const loginWithGoogle = (data) => axiosClient.post(`${AUTH_BASE}/google`, data);

export const refreshToken = (data) => axiosClient.post(`${AUTH_BASE}/refresh`, data);

// Cần gọi trước khi clear localStorage để backend revoke refresh token.
export const logout = () => axiosClient.post(`${AUTH_BASE}/logout`);
