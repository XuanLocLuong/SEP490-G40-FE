import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const RECRUITER_BASE = `${API_PREFIX}/recruiter`;

export const getRecruiterInvitationApiErrorMessage = (error, fallback = 'Có lỗi xảy ra') =>
    error?.response?.data?.message || error?.message || fallback;

/** GET /api/v1/recruiter/jobs/{jobId}/invitations */
export const fetchJobInvitations = (jobId, params = {}) =>
    axiosClient.get(`${RECRUITER_BASE}/jobs/${jobId}/invitations`, { params });
