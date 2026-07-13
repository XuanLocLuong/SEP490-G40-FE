import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const JOBS_BASE = `${API_PREFIX}/jobs`;

export const fetchHomepageJobs = (page = 0, size = 8) =>
    axiosClient.get(`${JOBS_BASE}/homepage`, { params: { page, size } });

export const searchJobs = (params) =>
    axiosClient.get(`${JOBS_BASE}/search`, { params });

export const fetchNearbyJobs = (body) =>
    axiosClient.post(`${JOBS_BASE}/near-me`, body);

export const saveJob = (jobId) =>
    axiosClient.post(`${JOBS_BASE}/${jobId}/save`);

export const unsaveJob = (jobId) =>
    axiosClient.delete(`${JOBS_BASE}/${jobId}/save`);

export const fetchJobDetail = (jobId) =>
    axiosClient.get(`${JOBS_BASE}/${jobId}`);
