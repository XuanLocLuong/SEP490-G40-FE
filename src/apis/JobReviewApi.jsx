import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const BASE = `${API_PREFIX}/job-reviews`;

export const getApiErrorMessage = (error, fallback = 'Có lỗi xảy ra') =>
    error?.response?.data?.message || error?.message || fallback;

/** GET /job-reviews/queue — danh sách chờ duyệt của PM đang login. */
export const getJobReviewQueue = (params) => axiosClient.get(`${BASE}/queue`, { params });

/** GET /job-reviews/{reviewId} — chi tiết + AI + rule engine. */
export const getJobReviewDetail = (reviewId) => axiosClient.get(`${BASE}/${reviewId}`);

/**
 * POST /job-reviews/{reviewId}/decide
 * @param {{ decision: 'APPROVED'|'REJECTED'|'REVISION_REQUESTED', note?: string }} payload
 */
export const decideJobReview = (reviewId, payload) =>
    axiosClient.post(`${BASE}/${reviewId}/decide`, payload);
