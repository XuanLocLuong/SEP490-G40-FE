import {
    fetchJobRecruitmentAnalytics,
    fetchRecruitmentAnalytics,
    getRecruitmentAnalyticsApiErrorMessage,
} from '../apis/RecruitmentAnalyticsApi.jsx';

export { getRecruitmentAnalyticsApiErrorMessage };

const unwrapData = (response) => response?.data?.data ?? response?.data;

/** Rate null từ BE → FE hiện N/A (UC-38 AF-4). */
export const formatRate = (value, digits = 2) => {
    if (value == null || Number.isNaN(Number(value))) return 'N/A';
    return `${Number(value).toFixed(digits)}%`;
};

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
    jobStatus,
    includeHistorical,
} = {}) => {
    const params = {};
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    if (jobId != null && jobId !== '') params.jobId = jobId;
    if (jobStatus) params.jobStatus = jobStatus;
    if (includeHistorical != null) params.includeHistorical = includeHistorical;
    return params;
};

/**
 * Tổng quan / Thống kê.
 * Tổng quan: gọi không truyền from/to → BE mặc định 30 ngày; includeHistorical=false.
 */
export const loadRecruitmentAnalytics = async (filters = {}) => {
    const res = await fetchRecruitmentAnalytics(buildAnalyticsParams(filters));
    return unwrapData(res);
};

/** Status FE cho phép trên Thống kê (không gồm draft/review/reject/revision). */
export const ANALYTICS_ALLOWED_JOB_STATUSES = ['OPEN', 'CLOSED', 'BLOCKED'];

const emptySummary = () => ({
    uniqueCandidateViews: 0,
    applicationCount: 0,
    successfulHireCount: 0,
    invitationSentCount: 0,
    acceptedInvitationCount: 0,
    rejectedInvitationCount: 0,
    expiredInvitationCount: 0,
    viewToApplicationRatePercent: null,
    applicationToHireRatePercent: null,
    invitationAcceptanceRatePercent: null,
});

const rateOrNull = (numerator, denominator) => {
    if (!denominator) return null;
    return Number(((numerator / denominator) * 100).toFixed(2));
};

const mergeSummaries = (summaries) => {
    const total = emptySummary();
    summaries.forEach((summary) => {
        if (!summary) return;
        total.uniqueCandidateViews += formatCount(summary.uniqueCandidateViews);
        total.applicationCount += formatCount(summary.applicationCount);
        total.successfulHireCount += formatCount(summary.successfulHireCount);
        total.invitationSentCount += formatCount(summary.invitationSentCount);
        total.acceptedInvitationCount += formatCount(summary.acceptedInvitationCount);
        total.rejectedInvitationCount += formatCount(summary.rejectedInvitationCount);
        total.expiredInvitationCount += formatCount(summary.expiredInvitationCount);
    });
    total.viewToApplicationRatePercent = rateOrNull(
        total.applicationCount,
        total.uniqueCandidateViews
    );
    total.applicationToHireRatePercent = rateOrNull(
        total.successfulHireCount,
        total.applicationCount
    );
    total.invitationAcceptanceRatePercent = rateOrNull(
        total.acceptedInvitationCount,
        total.invitationSentCount
    );
    return total;
};

const mergeTrends = (trendLists) => {
    const byDate = new Map();
    trendLists.forEach((trends) => {
        (Array.isArray(trends) ? trends : []).forEach((row) => {
            const key = row?.date;
            if (!key) return;
            const prev = byDate.get(key) || {
                date: key,
                uniqueCandidateViews: 0,
                applicationCount: 0,
                successfulHireCount: 0,
                invitationSentCount: 0,
                acceptedInvitationCount: 0,
                rejectedInvitationCount: 0,
                expiredInvitationCount: 0,
                urgentEmailSentCount: 0,
                urgentEmailDeliveredCount: 0,
                urgentEmailFailedCount: 0,
            };
            prev.uniqueCandidateViews += formatCount(row.uniqueCandidateViews);
            prev.applicationCount += formatCount(row.applicationCount);
            prev.successfulHireCount += formatCount(row.successfulHireCount);
            prev.invitationSentCount += formatCount(row.invitationSentCount);
            prev.acceptedInvitationCount += formatCount(row.acceptedInvitationCount);
            prev.rejectedInvitationCount += formatCount(row.rejectedInvitationCount);
            prev.expiredInvitationCount += formatCount(row.expiredInvitationCount);
            prev.urgentEmailSentCount += formatCount(row.urgentEmailSentCount);
            prev.urgentEmailDeliveredCount += formatCount(row.urgentEmailDeliveredCount);
            prev.urgentEmailFailedCount += formatCount(row.urgentEmailFailedCount);
            byDate.set(key, prev);
        });
    });
    return Array.from(byDate.values()).sort((a, b) => String(a.date).localeCompare(String(b.date)));
};

const latestInstant = (values) => {
    let latest = null;
    values.forEach((value) => {
        if (!value) return;
        if (!latest || new Date(value).getTime() > new Date(latest).getTime()) {
            latest = value;
        }
    });
    return latest;
};

/**
 * Load analytics cho UI Recruiter (chỉ FE):
 * - Tin mới: chỉ OPEN
 * - Bao gồm tin cũ: gộp OPEN + CLOSED + BLOCKED (không lấy PENDING/REJECTED/REVISION/DRAFT)
 */
export const loadRecruiterAnalyticsDashboard = async ({
    fromDate,
    toDate,
    includeHistorical = false,
} = {}) => {
    const base = { fromDate, toDate, includeHistorical: Boolean(includeHistorical) };

    if (!includeHistorical) {
        return loadRecruitmentAnalytics({ ...base, jobStatus: 'OPEN' });
    }

    const chunks = await Promise.all(
        ANALYTICS_ALLOWED_JOB_STATUSES.map((jobStatus) =>
            loadRecruitmentAnalytics({ ...base, jobStatus })
        )
    );

    const jobs = chunks
        .flatMap((chunk) => (Array.isArray(chunk?.jobs) ? chunk.jobs : []))
        .filter((job) => ANALYTICS_ALLOWED_JOB_STATUSES.includes(job?.jobStatus))
        .sort((a, b) => {
            const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
            if (bTime !== aTime) return bTime - aTime;
            return formatCount(b?.jobId) - formatCount(a?.jobId);
        });

    return {
        periodStart: chunks[0]?.periodStart ?? null,
        periodEnd: chunks[0]?.periodEnd ?? null,
        lastUpdatedAt: latestInstant(chunks.map((chunk) => chunk?.lastUpdatedAt)),
        jobId: null,
        jobStatus: null,
        includeHistorical: true,
        summary: mergeSummaries(chunks.map((chunk) => chunk?.summary)),
        trends: mergeTrends(chunks.map((chunk) => chunk?.trends)),
        jobs,
    };
};

/** Chi tiết analytics một tin (AF-1). */
export const loadJobRecruitmentAnalytics = async (jobId, filters = {}) => {
    const res = await fetchJobRecruitmentAnalytics(jobId, buildAnalyticsParams(filters));
    return unwrapData(res);
};
