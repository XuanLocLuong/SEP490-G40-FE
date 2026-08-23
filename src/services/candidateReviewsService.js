import { getCandidateReviews, getReviewApiErrorMessage } from '../apis/ReviewApi.jsx';

const unwrap = (res) => res?.data?.data ?? res?.data ?? null;
const toArray = (value) => (Array.isArray(value) ? value : []);

export const normalizeCandidateReview = (raw = {}) => ({
    id: raw.id,
    applicationId: raw.applicationId ?? null,
    rating: Number(raw.rating) || 0,
    comment: raw.comment || '',
    reviewType: raw.reviewType || '',
    reviewerName: raw.reviewerName || 'Nhà tuyển dụng',
    reviewerProfilePicture: raw.reviewerProfilePicture || null,
    status: raw.status || '',
    createdAt: raw.createdAt || null,
});

export const normalizeCandidateReviewStats = (raw = {}) => ({
    averageRating: Number(raw.averageRating) || 0,
    totalReviews: Number(raw.totalReviews) || 0,
    recentReviews: toArray(raw.recentReviews).map(normalizeCandidateReview),
});

/** GET /api/v1/candidates/{userId}/reviews — userId = users.id */
export const fetchCandidateReviews = async (userId, { page = 0, size = 20 } = {}) => {
    const res = await getCandidateReviews(userId, { page, size });
    return normalizeCandidateReviewStats(unwrap(res));
};

export { getReviewApiErrorMessage };
