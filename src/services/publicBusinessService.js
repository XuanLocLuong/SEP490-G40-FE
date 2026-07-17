import {
    fetchPublicBusinessJobs,
    fetchPublicBusinessProfile,
} from '../apis/PublicBusinessApi.jsx';

const unwrapData = (response) => response?.data?.data ?? null;

export const getApiErrorMessage = (error, fallback = 'Có lỗi xảy ra') =>
    error?.response?.data?.message || error?.message || fallback;

export const mapPublicBusinessProfile = (data) => ({
    businessId: data?.businessId ?? null,
    businessName: data?.businessName || 'Doanh nghiệp',
    logoUrl: data?.logoUrl || null,
    businessType: data?.businessType || '',
    description: data?.description || '',
    phone: data?.phone || '',
    email: data?.email || '',
    websiteUrl: data?.websiteUrl || '',
    locations: Array.isArray(data?.locations) ? data.locations : [],
    averageRating: data?.averageRating ?? 0,
    totalReviews: data?.totalReviews ?? 0,
    hiredCount: data?.hiredCount ?? 0,
    verificationStatus: data?.verificationStatus || null,
    badge: data?.badge || null,
    trustScore: data?.trustScore ?? null,
    memberSince: data?.memberSince || null,
});

export const mapPublicBusinessJobsPage = (data) => ({
    content: Array.isArray(data?.content) ? data.content : [],
    totalPages: data?.totalPages ?? 0,
    totalElements: data?.totalElements ?? 0,
    currentPage: data?.currentPage ?? 0,
    pageSize: data?.pageSize ?? 12,
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
};

export default publicBusinessService;
