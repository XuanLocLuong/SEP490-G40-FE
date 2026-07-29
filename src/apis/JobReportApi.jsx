import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const JOBS_BASE = `${API_PREFIX}/jobs`;

const unwrapData = (res) => res?.data?.data ?? res?.data;

export const getJobReportApiErrorMessage = (error, fallback = 'Có lỗi xảy ra') => {
    const data = error?.response?.data;
    return (
        data?.message ||
        data?.error ||
        (typeof data === 'string' ? data : null) ||
        error?.message ||
        fallback
    );
};

/** GET /api/v1/jobs/report-reasons */
export const fetchReportReasons = async () => {
    const res = await axiosClient.get(`${JOBS_BASE}/report-reasons`);
    return unwrapData(res) || [];
};

/** GET /api/v1/jobs/{jobId}/report/status */
export const fetchJobReportStatus = async (jobId) => {
    const res = await axiosClient.get(`${JOBS_BASE}/${jobId}/report/status`);
    return unwrapData(res);
};

/**
 * POST /api/v1/jobs/{jobId}/report (multipart)
 * parts: request (JSON), evidence (optional files, max 3)
 */
export const submitJobReport = async (jobId, { reportReasonCodes, description }, evidenceFiles = []) => {
    const formData = new FormData();
    const payload = {
        reportReasonCodes,
        description,
    };
    formData.append(
        'request',
        new Blob([JSON.stringify(payload)], { type: 'application/json' })
    );

    (evidenceFiles || []).slice(0, 3).forEach((file) => {
        if (file) formData.append('evidence', file);
    });

    const res = await axiosClient.post(`${JOBS_BASE}/${jobId}/report`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrapData(res);
};
