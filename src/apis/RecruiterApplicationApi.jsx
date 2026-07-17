import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const RECRUITER_BASE = `${API_PREFIX}/recruiter`;

export const getRecruiterApplicationApiErrorMessage = (error, fallback = 'Có lỗi xảy ra') =>
    error?.response?.data?.message || error?.message || fallback;

export const fetchJobApplications = (jobId, params = {}) =>
    axiosClient.get(`${RECRUITER_BASE}/jobs/${jobId}/applications`, { params });

export const acceptApplication = (applicationId) =>
    axiosClient.put(`${RECRUITER_BASE}/applications/${applicationId}/accept`);

export const rejectApplication = (applicationId, body) =>
    axiosClient.put(`${RECRUITER_BASE}/applications/${applicationId}/reject`, body);
