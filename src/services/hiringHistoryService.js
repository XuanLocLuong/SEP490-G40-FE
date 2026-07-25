import axiosClient, { API_PREFIX } from '../apis/AxiosClient.jsx';

/**
 * Lịch sử tuyển dụng — tin CLOSED của doanh nghiệp.
 *
 * GET /api/v1/recruiter/profile/hiring-history?businessId=&year=&page=&size=
 * GET /api/v1/recruiter/profile/hiring-history/summary?businessId=&year=
 */

const HIRING_HISTORY_BASE = `${API_PREFIX}/recruiter/profile/hiring-history`;

const unwrapData = (response) => response?.data?.data ?? response?.data;

const buildParams = ({ businessId, year, page, size } = {}) => {
    const params = {};
    if (businessId != null && businessId !== '') params.businessId = businessId;
    if (year != null && year !== '' && year !== 'all') params.year = Number(year);
    if (page != null) params.page = page;
    if (size != null) params.size = size;
    return params;
};

export const getHiringHistoryApiErrorMessage = (error, fallback = 'Không thể tải lịch sử tuyển dụng.') =>
    error?.response?.data?.message || error?.message || fallback;

export const fetchHiringHistorySummary = async ({ businessId, year } = {}) => {
    const res = await axiosClient.get(`${HIRING_HISTORY_BASE}/summary`, {
        params: buildParams({ businessId, year }),
    });
    const data = unwrapData(res) || {};
    return {
        totalClosedJobs: data.totalClosedJobs ?? 0,
        totalApplications: data.totalApplications ?? 0,
        totalHired: data.totalHired ?? 0,
        successRate: data.successRate ?? 0,
    };
};

export const fetchHiringHistory = async ({ businessId, year, page = 0, size = 20 } = {}) => {
    const res = await axiosClient.get(HIRING_HISTORY_BASE, {
        params: buildParams({ businessId, year, page, size }),
    });
    const data = unwrapData(res) || {};
    return {
        items: Array.isArray(data.content) ? data.content : [],
        totalPages: data.totalPages ?? 0,
        totalElements: data.totalElements ?? 0,
        currentPage: data.currentPage ?? page,
        pageSize: data.pageSize ?? size,
    };
};
