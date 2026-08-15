import axiosClient, { API_PREFIX } from './AxiosClient.jsx';
import { resolveAiUserErrorMessage } from '../utils/aiErrorMessage.js';

const BASE = `${API_PREFIX}/report-reviews`;

export const getReportReviewApiErrorMessage = (error, fallback = 'Có lỗi xảy ra') =>
    resolveAiUserErrorMessage(
        error,
        error?.response?.data?.message || error?.message || fallback
    );

/** GET /report-reviews/queue — case báo cáo PENDING gán cho PM đang login. */
export const getReportCasesQueue = (params) => axiosClient.get(`${BASE}/queue`, { params });

/** GET /report-reviews/jobs/{jobId} — chi tiết case (job + reports + lịch sử). */
export const getReportCaseDetail = (jobId) => axiosClient.get(`${BASE}/jobs/${jobId}`);

/** GET /report-reviews/reports/{reportId} — chi tiết 1 báo cáo + evidence (đánh dấu đã đọc). */
export const getReportDetail = (reportId) => axiosClient.get(`${BASE}/reports/${reportId}`);

/** GET /report-reviews/penalty-rules — map code → điểm trừ khi BLOCK. */
export const getReportPenaltyRules = () => axiosClient.get(`${BASE}/penalty-rules`);

/** POST /report-reviews/jobs/{jobId}/ai-analyze — phân tích AI theo yêu cầu PM. */
export const analyzeReportCaseByAi = (jobId) =>
    axiosClient.post(`${BASE}/jobs/${jobId}/ai-analyze`);

/**
 * POST /report-reviews/jobs/{jobId}/decide
 * @param {{ decision: 'REJECT'|'BLOCK', reason: string, categories?: string[] }} payload
 */
export const decideReportCase = (jobId, payload) =>
    axiosClient.post(`${BASE}/jobs/${jobId}/decide`, payload);
