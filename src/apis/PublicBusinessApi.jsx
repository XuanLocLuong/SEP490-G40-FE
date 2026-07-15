import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const BUSINESS_BASE = `${API_PREFIX}/businesses`;

export const fetchPublicBusinessProfile = (businessId) =>
    axiosClient.get(`${BUSINESS_BASE}/${businessId}`);

export const fetchPublicBusinessJobs = (businessId, page = 0, size = 12) =>
    axiosClient.get(`${BUSINESS_BASE}/${businessId}/jobs`, { params: { page, size } });
