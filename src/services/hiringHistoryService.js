import axiosClient, { API_PREFIX } from '../apis/AxiosClient.jsx';

/**
 * Lịch sử tuyển dụng của nhà tuyển dụng (các tin đã kết thúc + thống kê).
 *
 * ── ĐỀ XUẤT ENDPOINT CHO BE ────────────────────────────────────────────────
 * GET /api/v1/recruiter/hiring-history?page=&size=&year=
 *
 * Response.data = {
 *   summary: {
 *     totalClosedJobs: number,     // số tin đã kết thúc
 *     totalApplications: number,   // tổng lượt ứng tuyển đã nhận
 *     totalHired: number,          // tổng số đã tuyển
 *     successRate: number          // 0..1 (totalHired / totalApplications)
 *   },
 *   items: [{
 *     jobId, title,
 *     postedAt, closedAt,
 *     requiredCandidates: number,
 *     closeReason: 'FILLED' | 'EXPIRED' | 'MANUAL',
 *     applicationCounts: { total, pending, accepted, rejected, hired }
 *   }],
 *   page, size, totalPages, totalElements
 * }
 *
 * Khi BE có endpoint, chỉ cần bỏ MOCK và trả `unwrapData(res)`.
 * ───────────────────────────────────────────────────────────────────────────
 */

const HIRING_HISTORY_URL = `${API_PREFIX}/recruiter/hiring-history`;

// Bật MOCK khi BE chưa có endpoint. Đặt false khi BE đã sẵn sàng.
const USE_MOCK = true;

const MOCK_HISTORY = {
    summary: {
        totalClosedJobs: 6,
        totalApplications: 148,
        totalHired: 14,
        successRate: 14 / 148,
    },
    items: [
        {
            jobId: 'mock-1',
            title: 'Nhân viên phục vụ ca tối',
            postedAt: '2026-05-02T08:00:00Z',
            closedAt: '2026-05-20T17:00:00Z',
            requiredCandidates: 3,
            closeReason: 'FILLED',
            applicationCounts: { total: 32, pending: 0, accepted: 4, rejected: 28, hired: 3 },
        },
        {
            jobId: 'mock-2',
            title: 'Thu ngân part-time cuối tuần',
            postedAt: '2026-04-10T08:00:00Z',
            closedAt: '2026-04-30T17:00:00Z',
            requiredCandidates: 5,
            closeReason: 'EXPIRED',
            applicationCounts: { total: 21, pending: 0, accepted: 2, rejected: 15, hired: 2 },
        },
        {
            jobId: 'mock-3',
            title: 'Nhân viên pha chế',
            postedAt: '2026-03-15T08:00:00Z',
            closedAt: '2026-04-01T17:00:00Z',
            requiredCandidates: 4,
            closeReason: 'MANUAL',
            applicationCounts: { total: 40, pending: 0, accepted: 5, rejected: 30, hired: 4 },
        },
        {
            jobId: 'mock-4',
            title: 'Phụ bếp ca sáng',
            postedAt: '2026-02-01T08:00:00Z',
            closedAt: '2026-02-25T17:00:00Z',
            requiredCandidates: 2,
            closeReason: 'FILLED',
            applicationCounts: { total: 25, pending: 0, accepted: 2, rejected: 21, hired: 2 },
        },
        {
            jobId: 'mock-5',
            title: 'Nhân viên giao hàng khu vực Cầu Giấy',
            postedAt: '2026-01-05T08:00:00Z',
            closedAt: '2026-01-28T17:00:00Z',
            requiredCandidates: 3,
            closeReason: 'EXPIRED',
            applicationCounts: { total: 18, pending: 0, accepted: 1, rejected: 14, hired: 1 },
        },
        {
            jobId: 'mock-6',
            title: 'Cộng tác viên marketing',
            postedAt: '2025-12-01T08:00:00Z',
            closedAt: '2025-12-20T17:00:00Z',
            requiredCandidates: 2,
            closeReason: 'FILLED',
            applicationCounts: { total: 12, pending: 0, accepted: 1, rejected: 9, hired: 2 },
        },
    ],
    page: 0,
    size: 10,
    totalPages: 1,
    totalElements: 6,
};

const unwrapData = (response) => response?.data?.data ?? response?.data;

export const getHiringHistoryApiErrorMessage = (error, fallback = 'Không thể tải lịch sử tuyển dụng.') =>
    error?.response?.data?.message || error?.message || fallback;

export const fetchHiringHistory = async (params = {}) => {
    if (USE_MOCK) {
        // Giả lập độ trễ mạng để UI hiển thị loading state.
        await new Promise((resolve) => setTimeout(resolve, 350));
        return MOCK_HISTORY;
    }

    const res = await axiosClient.get(HIRING_HISTORY_URL, { params });
    return unwrapData(res);
};
