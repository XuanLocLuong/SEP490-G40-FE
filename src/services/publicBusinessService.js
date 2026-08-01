import {
    fetchPublicBusinessClosedJobs,
    fetchPublicBusinessJobs,
    fetchPublicBusinessProfile,
    fetchPublicBusinessReviews,
} from '../apis/PublicBusinessApi.jsx';

const unwrapData = (response) => response?.data?.data ?? null;

export const getApiErrorMessage = (error, fallback = 'Có lỗi xảy ra') =>
    error?.response?.data?.message || error?.message || fallback;

const mapGalleryImages = (list) => {
    if (!Array.isArray(list)) return [];
    return list
        .map((img) => ({
            id: img?.id ?? null,
            fileUrl: img?.fileUrl || img?.url || '',
            sortOrder: img?.sortOrder ?? 0,
        }))
        .filter((img) => Boolean(img.fileUrl))
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
};

export const mapPublicBusinessProfile = (data) => ({
    businessId: data?.businessId ?? null,
    businessName: data?.businessName || 'Doanh nghiệp',
    logoUrl: data?.logoUrl || null,
    businessType: data?.businessType || '',
    businessTypeName: data?.businessTypeName || '',
    description: data?.description || '',
    phone: data?.phone || '',
    email: data?.email || '',
    websiteUrl: data?.websiteUrl || '',
    locations: Array.isArray(data?.locations) ? data.locations : [],
    galleryImages: mapGalleryImages(data?.galleryImages),
    averageRating: data?.averageRating ?? 0,
    // BE: validReviewCount / successfulHireCount (giữ alias cũ để UI không lệch)
    totalReviews: data?.validReviewCount ?? data?.totalReviews ?? 0,
    hiredCount: data?.successfulHireCount ?? data?.hiredCount ?? 0,
    verificationStatus: data?.verificationStatus || null,
    badge: data?.badge || null,
    trustScore: data?.trustScore ?? null,
    memberSince: data?.memberSince || null,
    hasReputationWarning: Boolean(data?.hasReputationWarning),
    reputationWarningMessage: data?.reputationWarningMessage || '',
});

export const mapPublicBusinessJobsPage = (data) => ({
    content: Array.isArray(data?.content) ? data.content : [],
    totalPages: data?.totalPages ?? 0,
    totalElements: data?.totalElements ?? 0,
    currentPage: data?.currentPage ?? 0,
    pageSize: data?.pageSize ?? 12,
});

export const mapPublicBusinessReviews = (data) => ({
    averageRating: data?.averageRating ?? 0,
    totalReviews: data?.totalReviews ?? 0,
    reviews: Array.isArray(data?.recentReviews) ? data.recentReviews : [],
});

export const publicBusinessService = {
    getProfile: async (businessId) => {
        const res = await fetchPublicBusinessProfile(businessId);
        return mapPublicBusinessProfile(unwrapData(res));
    },

    getOpenJobs: async (businessId, page = 0, size = 12) => {
        const res = await fetchPublicBusinessJobs(businessId, page, size);
        return mapPublicBusinessJobsPage(unwrapData(res));
    },

    getClosedJobs: async (businessId, page = 0, size = 12) => {
        const res = await fetchPublicBusinessClosedJobs(businessId, page, size);
        return mapPublicBusinessJobsPage(unwrapData(res));
    },

    getReviews: async (businessId, page = 0, size = 10) => {
        const res = await fetchPublicBusinessReviews(businessId, page, size);
        return mapPublicBusinessReviews(unwrapData(res));
    },
};

export default publicBusinessService;
