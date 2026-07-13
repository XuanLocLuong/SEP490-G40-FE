import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const APPLICATIONS_BASE = `${API_PREFIX}/applications`;

export const previewJobApplication = (jobId) =>
    axiosClient.get(`${APPLICATIONS_BASE}/jobs/${jobId}/preview`);

export const applyToJob = (jobId) =>
    axiosClient.post(`${APPLICATIONS_BASE}/jobs/${jobId}`);
