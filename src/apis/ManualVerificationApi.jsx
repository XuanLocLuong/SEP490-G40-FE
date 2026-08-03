import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const BASE = `${API_PREFIX}/manual-verifications`;

const unwrap = (res) => res?.data?.data ?? res?.data ?? null;

export const getManualVerificationApiErrorMessage = (error, fallback = 'Có lỗi xảy ra') => {
    const status = error?.response?.status;
    const code = error?.response?.data?.message || error?.response?.data?.error;
    if (status === 403) return 'Bạn không được gán xử lý hồ sơ này.';
    if (status === 404) return 'Không tìm thấy hồ sơ xác minh.';
    if (status === 400) return 'Hồ sơ không còn ở trạng thái chờ duyệt thủ công.';
    if (typeof code === 'string' && code.trim() && !code.startsWith('{')) return code;
    return error?.message || fallback;
};

/** GET /manual-verifications/queue */
export const getManualVerificationQueue = (params = {}) =>
    axiosClient.get(`${BASE}/queue`, { params }).then(unwrap);

/** GET /manual-verifications/{id} */
export const getManualVerificationDetail = (id) =>
    axiosClient.get(`${BASE}/${id}`).then(unwrap);

/** GET /manual-verifications/reject-reasons */
export const getManualRejectReasons = () =>
    axiosClient.get(`${BASE}/reject-reasons`).then(unwrap);

/**
 * POST /manual-verifications/{id}/decision
 * @param {{ decision: 'APPROVE'|'REJECTED', rejectReason?: string }} payload
 */
export const submitManualVerificationDecision = (id, payload) =>
    axiosClient.post(`${BASE}/${id}/decision`, payload).then(unwrap);
