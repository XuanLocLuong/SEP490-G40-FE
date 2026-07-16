import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const BASE = `${API_PREFIX}/applications`;

// GET /applications/jobs/{jobId}/preview — check điều kiện trước khi apply thật.
export const previewApply = (jobId) => axiosClient.get(`${BASE}/jobs/${jobId}/preview`);

// POST /applications/jobs/{jobId} — apply thật, không có body.
export const applyToJob = (jobId) => axiosClient.post(`${BASE}/jobs/${jobId}`);

// GET /applications/me — lịch sử ứng tuyển, params: { page, size, status, fromDate, toDate }.
export const getMyApplications = (params) => axiosClient.get(`${BASE}/me`, { params });

// PUT /applications/{id}/confirm — xác nhận offer (application phải ở trạng thái ACCEPTED)
export const confirmOffer = (applicationId) =>
    axiosClient.put(`${BASE}/${applicationId}/confirm`);

// PUT /applications/{id}/decline — từ chối offer (application phải ở trạng thái ACCEPTED)
export const declineOffer = (applicationId) =>
    axiosClient.put(`${BASE}/${applicationId}/decline`);
