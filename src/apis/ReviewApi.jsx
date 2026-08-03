import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

/** POST /applications/{applicationId}/reviews */
export const submitApplicationReview = (applicationId, body) =>
    axiosClient.post(`${API_PREFIX}/applications/${applicationId}/reviews`, body);

/** GET /applications/{applicationId}/reviews/my — 404 nếu chưa đánh giá */
export const getMyApplicationReview = (applicationId) =>
    axiosClient.get(`${API_PREFIX}/applications/${applicationId}/reviews/my`);

export const getReviewApiErrorMessage = (error, fallback = 'Không gửi được đánh giá.') =>
    error?.response?.data?.message || error?.message || fallback;
