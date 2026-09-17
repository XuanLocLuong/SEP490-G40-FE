import {
    fetchJobRecruitmentAnalytics,
    fetchRecruitmentAnalytics,
    getRecruitmentAnalyticsApiErrorMessage,
} from '../apis/RecruitmentAnalyticsApi.jsx';
import { RECRUITMENT_PAGE_SIZE } from '../utils/recruitmentPagination.js';

export { getRecruitmentAnalyticsApiErrorMessage };

const unwrapData = (response) => response?.data?.data ?? response?.data;

export const formatCount = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.trunc(n));
};

/**
 * Kỳ báo cáo N ngày gần nhất → Instant ISO cho query BE.
 * toDate exclusive theo MD; dùng now làm mốc kết thúc.
 */
export const lastNDays = (days = 30, now = new Date()) => {
    const safeDays = Math.max(1, Math.min(Number(days) || 30, 366));
    const to = new Date(now);
    const from = new Date(to.getTime() - safeDays * 24 * 60 * 60 * 1000);
    return {
        fromDate: from.toISOString(),
        toDate: to.toISOString(),
    };
};

const buildAnalyticsParams = ({
    fromDate,
    toDate,
    jobId,
    scope,
    includeHistorical,
    page,
    size,
} = {}) => {
    const params = {};
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    if (jobId != null && jobId !== '') params.jobId = jobId;
    if (scope) params.scope = scope;
    if (includeHistorical != null) params.includeHistorical = includeHistorical;
    if (page != null) params.page = page;
    if (size != null) params.size = size;
    return params;
};

export const getTrendPoints = (data) => data?.trend?.points ?? [];

export const getJobsList = (data) => data?.jobs?.content ?? [];

/**
 * GET /api/v1/recruiter/recruitment-analytics
 */
export const loadRecruitmentAnalytics = async (filters = {}) => {
    const res = await fetchRecruitmentAnalytics(buildAnalyticsParams(filters));
    return unwrapData(res);
};

/**
 * Màn thống kê tổng: 1 request, scope ACTIVE hoặc HISTORY.
 */
export const loadRecruiterAnalyticsDashboard = async ({
    fromDate,
    toDate,
    includeHistorical = false,
    page = 0,
    size = RECRUITMENT_PAGE_SIZE,
} = {}) => {
    return loadRecruitmentAnalytics({
        fromDate,
        toDate,
        scope: includeHistorical ? 'HISTORY' : 'ACTIVE',
        page,
        size,
    });
};

/** Chi tiết analytics một tin. */
export const loadJobRecruitmentAnalytics = async (jobId, filters = {}) => {
    const res = await fetchJobRecruitmentAnalytics(jobId, buildAnalyticsParams(filters));
    return unwrapData(res);
};
