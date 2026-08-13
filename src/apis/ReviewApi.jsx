import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

/** POST /applications/{applicationId}/reviews */
export const submitApplicationReview = (applicationId, body) =>
    axiosClient.post(`${API_PREFIX}/applications/${applicationId}/reviews`, body);

/** GET /applications/{applicationId}/reviews/my — 404 nếu chưa đánh giá */
export const getMyApplicationReview = (applicationId) =>
    axiosClient.get(`${API_PREFIX}/applications/${applicationId}/reviews/my`);

/** GET /recruiter/reviews — danh sách review ứng viên theo job của recruiter. */
export const getRecruiterReviews = ({ jobId, page = 0, size = 5 } = {}) =>
    axiosClient.get(`${API_PREFIX}/recruiter/reviews`, {
        params: {
            ...(jobId ? { jobId } : {}),
            page,
            size,
        },
    });

export const getReviewApiErrorMessage = (error, fallback = 'Không gửi được đánh giá.') =>
    error?.response?.data?.message || error?.message || fallback;
