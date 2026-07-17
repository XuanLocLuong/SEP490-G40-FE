import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const JOBS_BASE = `${API_PREFIX}/jobs`;

const unwrapData = (response) => response.data.data;

export const getRecruiterJobApiErrorMessage = (error, fallback = 'Có lỗi xảy ra') =>
    error?.response?.data?.message || error?.message || fallback;

/**
 * Thin API layer — chỉ gọi HTTP, không transform dữ liệu.
 * Transform nằm ở services/jobPostService.js (giống candidateProfileService).
 */
const recruiterJobApi = {
    createJob: async (payload) => {
        const res = await axiosClient.post(JOBS_BASE, payload);
        return unwrapData(res);
    },

    updateJob: async (jobId, payload) => {
        const res = await axiosClient.put(`${JOBS_BASE}/${jobId}`, payload);
        return unwrapData(res);
    },

    deleteJob: async (jobId) => {
        await axiosClient.delete(`${JOBS_BASE}/${jobId}`);
    },

    /** @param {{ status?: string, page?: number, size?: number }} params */
    getMyJobs: async (params = {}) => {
        const res = await axiosClient.get(`${JOBS_BASE}/my-jobs`, { params });
        return unwrapData(res);
    },

    getJobDetail: async (jobId) => {
        const res = await axiosClient.get(`${JOBS_BASE}/my-jobs/${jobId}`);
        return unwrapData(res);
    },

    /** OPEN ↔ CLOSED — BE: PATCH /api/v1/{jobId}/status */
    changeJobStatus: async (jobId, status) => {
        const res = await axiosClient.patch(`${API_PREFIX}/${jobId}/status`, { status });
        return unwrapData(res);
    },
};

export default recruiterJobApi;
