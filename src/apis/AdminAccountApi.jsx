import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const BASE = `${API_PREFIX}/admin/accounts`;

const unwrap = (res) => res?.data?.data ?? res?.data ?? null;

export const getAdminAccountApiErrorMessage = (error, fallback = 'Có lỗi xảy ra') => {
    const code =
        error?.response?.data?.code ||
        error?.response?.data?.message ||
        error?.response?.data?.error;
    const map = {
        ACCOUNT_NOT_FOUND: 'Không tìm thấy tài khoản.',
        CANNOT_RESTRICT_SELF: 'Không thể khóa / hạn chế chính tài khoản của bạn.',
        CANNOT_RESTRICT_LAST_ADMIN: 'Không thể khóa Admin active cuối cùng.',
        CANNOT_CHANGE_OWN_ROLE: 'Không thể đổi role của chính bạn.',
        CANNOT_CHANGE_LAST_ADMIN_ROLE: 'Không thể đổi role của Admin active cuối cùng.',
        EMAIL_ALREADY_EXISTS: 'Email đã tồn tại.',
        INVALID_INTERNAL_ROLE: 'Role không hợp lệ cho tài khoản nội bộ.',
        PUBLIC_ROLE_CHANGE_NOT_ALLOWED:
            'Không được đổi role của tài khoản Candidate / Recruiter. Chỉ đổi được giữa các role nội bộ.',
    };
    if (typeof code === 'string' && map[code]) return map[code];
    if (typeof code === 'string' && code.trim() && !code.startsWith('{') && Number.isNaN(Number(code))) {
        return code;
    }
    return error?.message || fallback;
};

/** GET /admin/accounts — search / filter / page */
export const searchAdminAccounts = (params = {}) =>
    axiosClient.get(BASE, { params }).then(unwrap);

/** GET /admin/accounts/{id} */
export const getAdminAccountDetail = (id) =>
    axiosClient.get(`${BASE}/${id}`).then(unwrap);

/** POST /admin/accounts/{id}/status — { status, reason } */
export const changeAdminAccountStatus = (id, payload) =>
    axiosClient.post(`${BASE}/${id}/status`, payload).then(unwrap);

/** POST /admin/accounts/{id}/revoke-sessions — { reason } */
export const revokeAdminAccountSessions = (id, payload) =>
    axiosClient.post(`${BASE}/${id}/revoke-sessions`, payload).then(unwrap);

/** POST /admin/accounts/internal — create staff */
export const createInternalStaffAccount = (payload) =>
    axiosClient.post(`${BASE}/internal`, payload).then(unwrap);

/** POST /admin/accounts/{id}/role — { role, reason } */
export const changeAdminAccountRole = (id, payload) =>
    axiosClient.post(`${BASE}/${id}/role`, payload).then(unwrap);
