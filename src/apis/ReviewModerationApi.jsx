import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const BASE = `${API_PREFIX}/review-moderation`;

export const getApiErrorMessage = (error, fallback = 'Có lỗi xảy ra') =>
    error?.response?.data?.message || error?.message || fallback;

/** GET /review-moderation/queue */
export const getReviewModerationQueue = (params) =>
    axiosClient.get(`${BASE}/queue`, { params });

/** GET /review-moderation/{contentValidationId} */
export const getReviewModerationDetail = (contentValidationId) =>
    axiosClient.get(`${BASE}/${contentValidationId}`);

/**
 * POST /review-moderation/{contentValidationId}/decide
 * @param {{ decision: 'APPROVED'|'REJECTED'|'HIDDEN', note?: string }} payload
 */
export const decideReviewModeration = (contentValidationId, payload) =>
    axiosClient.post(`${BASE}/${contentValidationId}/decide`, payload);
