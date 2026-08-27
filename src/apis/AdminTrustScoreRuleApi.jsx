import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const BASE = `${API_PREFIX}/trust-scores/rules`;

const ERROR_MESSAGES = {
    NO_TRUST_SCORE_RULE_CHANGES: 'Không có thay đổi nào để cập nhật.',
    TRUST_SCORE_RULE_NOT_FOUND: 'Không tìm thấy quy tắc điểm uy tín.',
    TRUST_SCORE_RULE_CODE_EXISTS: 'Mã quy tắc đã tồn tại.',
    TRUST_SCORE_RULE_CONFLICT:
        'Quy tắc đang hoạt động bị xung đột (cùng sự kiện + đối tượng + điều kiện).',
    TRUST_SCORE_RULE_CHANGED:
        'Quy tắc đã bị Admin khác thay đổi. Vui lòng tải lại rồi thử lại.',
    SYSTEM_TRUST_SCORE_RULE_TYPE_NOT_CONFIGURABLE:
        'Loại quy tắc hệ thống không thể cấu hình từ màn này.',
    TRUST_SCORE_WARNING_THRESHOLDS_INVALID:
        'Thứ tự ngưỡng cảnh báo không hợp lệ (Rủi ro cao < Công khai < Nhẹ).',
    REPORT_TRUST_EVENT_TYPE_IMMUTABLE:
        'Không thể thay đổi loại sự kiện (eventType) của quy tắc báo cáo vi phạm khi chỉnh sửa.',
};

export const getTrustScoreRuleApiErrorMessage = (error, fallback = 'Có lỗi xảy ra') => {
    const raw = error?.response?.data?.message || error?.message || '';
    if (ERROR_MESSAGES[raw]) return ERROR_MESSAGES[raw];
    if (typeof raw === 'string' && raw.startsWith('INVALID_')) {
        return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại các trường.';
    }
    if (typeof raw === 'string' && raw.includes('OUT_OF_RANGE')) {
        return 'Giá trị điểm nằm ngoài khoảng cho phép.';
    }
    return raw || fallback;
};

const unwrap = (response) => response?.data?.data ?? response?.data;

/** GET /trust-scores/rules */
export const searchTrustScoreRules = async (params) => {
    const response = await axiosClient.get(BASE, { params });
    return unwrap(response);
};

/** GET /trust-scores/rules/{id} */
export const getTrustScoreRuleDetail = async (id) => {
    const response = await axiosClient.get(`${BASE}/${id}`);
    return unwrap(response);
};

/** GET /trust-scores/rules/report-event-types */
export const getReportEventTypes = async () => {
    const response = await axiosClient.get(`${BASE}/report-event-types`);
    return unwrap(response);
};

/** POST /trust-scores/rules */
export const createTrustScoreRule = async (payload) => {
    const response = await axiosClient.post(BASE, payload);
    return unwrap(response);
};

/** PUT /trust-scores/rules/{id} */
export const updateTrustScoreRule = async (id, payload) => {
    const response = await axiosClient.put(`${BASE}/${id}`, payload);
    return unwrap(response);
};

/** POST /trust-scores/rules/{id}/activate */
export const activateTrustScoreRule = async (id, payload) => {
    const response = await axiosClient.post(`${BASE}/${id}/activate`, payload);
    return unwrap(response);
};

/** POST /trust-scores/rules/{id}/deactivate */
export const deactivateTrustScoreRule = async (id, payload) => {
    const response = await axiosClient.post(`${BASE}/${id}/deactivate`, payload);
    return unwrap(response);
};
