import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const BASE = `${API_PREFIX}/job-post-metrics`;

const unwrap = (res) => res?.data?.data ?? res?.data ?? null;

export const getJobPostMetricsApiErrorMessage = (error, fallback = 'Có lỗi xảy ra') => {
    const code = error?.response?.data?.code || error?.response?.data?.message || error?.response?.data?.error;
    const map = {
        INVALID_MONITORING_PERIOD: 'Kỳ giám sát không hợp lệ.',
        INVALID_MONITORING_FILTER: 'Bộ lọc giám sát không hợp lệ.',
        JOB_NOT_FOUND: 'Không tìm thấy tin tuyển dụng.',
    };
    if (typeof code === 'string' && map[code]) return map[code];
    if (typeof code === 'string' && code.trim() && !code.startsWith('{')) return code;
    return error?.message || fallback;
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
