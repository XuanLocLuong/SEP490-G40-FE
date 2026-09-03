import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const BASE = `${API_PREFIX}/job-post-metrics`;

const unwrap = (res) => res?.data?.data ?? res?.data ?? null;

export const getJobPostMetricsApiErrorMessage = (error, fallback = 'Có lỗi xảy ra') => {
    const rawMessage = error?.response?.data?.message;
    const rawCode = error?.response?.data?.code;
    const rawError = error?.response?.data?.error;

    const map = {
        INVALID_MONITORING_PERIOD: 'Kỳ giám sát không hợp lệ.',
        INVALID_MONITORING_FILTER: 'Bộ lọc giám sát không hợp lệ.',
        JOB_NOT_FOUND: 'Không tìm thấy tin tuyển dụng.',
    };

    if (typeof rawMessage === 'string' && rawMessage.trim()) {
        const key = rawMessage.trim();
        if (map[key]) return map[key];
        if (!key.startsWith('{') && Number.isNaN(Number(key))) return key;
    }

    if (typeof rawCode === 'string' && rawCode.trim()) {
        const key = rawCode.trim();
        if (map[key]) return map[key];
        if (!key.startsWith('{') && Number.isNaN(Number(key))) return key;
    }

    if (typeof rawError === 'string' && rawError.trim()) {
        const key = rawError.trim();
        if (map[key]) return map[key];
        if (!key.startsWith('{')) return key;
    }

    return fallback;
};

/** GET /job-post-metrics/summary */
export const getJobPostMetricsSummary = (params = {}) =>
    axiosClient.get(`${BASE}/summary`, { params }).then(unwrap);

/** GET /job-post-metrics/jobs */
export const searchJobPostMetricsJobs = (params = {}) =>
    axiosClient.get(`${BASE}/jobs`, { params }).then(unwrap);

/** GET /job-post-metrics/jobs/{jobId} */
export const getJobPostMetricsDetail = (jobId, params = {}) =>
    axiosClient.get(`${BASE}/jobs/${jobId}`, { params }).then(unwrap);
