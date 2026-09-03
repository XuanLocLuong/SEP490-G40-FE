import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const BASE = `${API_PREFIX}/admin/platform-monitoring`;

const ERROR_MESSAGES = {
    INVALID_MONITORING_PERIOD: 'Kỳ báo cáo không hợp lệ (Từ ngày phải trước hoặc bằng ngày đến).',
    MONITORING_PERIOD_TOO_LARGE: 'Kỳ báo cáo không được vượt quá 366 ngày.',
    INVALID_MONITORING_FILTER: 'Bộ lọc role/status không hợp lệ.',
    ADMIN_ROLE_REQUIRED: 'Chỉ Admin mới xem được dashboard này.',
    ADMIN_INACTIVE: 'Tài khoản Admin không còn hoạt động.',
    PLATFORM_ANALYTICS_UNAVAILABLE: 'Không thể tải dữ liệu giám sát nền tảng. Thử lại sau.',
    SECTION_DATA_UNAVAILABLE: 'Nhóm dữ liệu tạm thời không khả dụng.',
};

export const getApiErrorMessage = (error, fallback = 'Có lỗi xảy ra') => {
    const raw = error?.response?.data?.message || error?.message || '';
    return ERROR_MESSAGES[raw] || raw || fallback;
};

/**
 * GET /admin/platform-monitoring
 * @param {{ fromDate?: string, toDate?: string, userRole?: string, accountStatus?: string, jobStatus?: string }} params
 */
export const getPlatformMonitoring = (params) =>
    axiosClient.get(BASE, { params });
