import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const BASE = `${API_PREFIX}/trust-scores`;

/** GET /trust-scores/me — điểm hiện tại + cảnh báo (Candidate / Recruiter) */
export const getMyTrustScore = () => axiosClient.get(`${BASE}/me`);

/**
 * GET /trust-scores/history — lịch sử thay đổi điểm (phân trang)
 * @param {{ page?: number, size?: number }} [params]
 */
export const getMyTrustScoreHistory = (params = {}) =>
    axiosClient.get(`${BASE}/history`, {
        params: {
            page: params.page ?? 0,
            size: params.size ?? 20,
        },
    });

export const getTrustScoreApiErrorMessage = (
    error,
    fallback = 'Không tải được điểm uy tín.'
) => error?.response?.data?.message || error?.message || fallback;
