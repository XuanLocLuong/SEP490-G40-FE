import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const BASE = `${API_PREFIX}/admin/audit-logs`;

const unwrap = (res) => res?.data?.data ?? res?.data ?? null;

export const getAdminAuditLogApiErrorMessage = (error, fallback = 'Có lỗi xảy ra') => {
    const code = error?.response?.data?.message || error?.response?.data?.error;
    if (code === 'AUDIT_LOG_NOT_FOUND') return 'Không tìm thấy nhật ký.';
    if (typeof code === 'string' && code.trim() && !code.startsWith('{')) return code;
    return error?.message || fallback;
};

/** GET /admin/audit-logs */
export const searchAdminAuditLogs = (params = {}) =>
    axiosClient.get(BASE, { params }).then(unwrap);

/** GET /admin/audit-logs/{id} */
export const getAdminAuditLogDetail = (id) =>
    axiosClient.get(`${BASE}/${id}`).then(unwrap);

/** GET /admin/audit-logs/filter-options */
export const getAdminAuditLogFilterOptions = () =>
    axiosClient.get(`${BASE}/filter-options`).then(unwrap);
