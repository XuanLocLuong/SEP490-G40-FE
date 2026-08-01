import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const ANALYTICS_BASE = `${API_PREFIX}/recruiter/recruitment-analytics`;

const ERROR_MESSAGES = {
    INVALID_REPORTING_PERIOD: 'Kỳ báo cáo không hợp lệ.',
    REPORTING_PERIOD_TOO_LARGE: 'Kỳ báo cáo không được vượt quá 366 ngày.',
    RECRUITER_INACTIVE: 'Tài khoản nhà tuyển dụng không còn hoạt động.',
    JOB_NOT_FOUND: 'Không tìm thấy tin tuyển dụng hoặc bạn không có quyền xem.',
    UNAUTHORIZED: 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.',
};

export const getRecruitmentAnalyticsApiErrorMessage = (error, fallback = 'Có lỗi xảy ra') => {
    const message = error?.response?.data?.message || error?.message;
    if (message && ERROR_MESSAGES[message]) return ERROR_MESSAGES[message];
    return message || fallback;
};

/**
 * GET /api/v1/recruiter/recruitment-analytics
 * @param {{ fromDate?: string, toDate?: string, jobId?: number, jobStatus?: string, includeHistorical?: boolean }} params
 */
export const fetchRecruitmentAnalytics = (params = {}) =>
    axiosClient.get(ANALYTICS_BASE, { params });

/**
 * GET /api/v1/recruiter/recruitment-analytics/jobs/{jobId}
 * @param {number|string} jobId
 * @param {{ fromDate?: string, toDate?: string, jobStatus?: string }} params
 */
export const fetchJobRecruitmentAnalytics = (jobId, params = {}) =>
    axiosClient.get(`${ANALYTICS_BASE}/jobs/${jobId}`, { params });
