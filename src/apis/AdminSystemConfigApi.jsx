import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const BASE = `${API_PREFIX}/admin/system-configurations`;

const unwrap = (res) => res?.data?.data ?? res?.data ?? null;

export const getAdminSystemConfigApiErrorMessage = (error, fallback = 'Có lỗi xảy ra') => {
    const code = error?.response?.data?.message || error?.response?.data?.error;
    const map = {
        CONFIG_NOT_FOUND: 'Không tìm thấy cấu hình hoặc key không được phép quản lý.',
        INVALID_VALUE: 'Giá trị không hợp lệ.',
        INVALID_VALUE_FORMAT: 'Định dạng giá trị không đúng với kiểu dữ liệu.',
    };
    if (typeof code === 'string' && map[code]) return map[code];
    if (typeof code === 'string' && code.trim() && !code.startsWith('{')) return code;
    return error?.message || fallback;
};

/** GET /admin/system-configurations */
export const listAdminSystemConfigurations = () =>
    axiosClient.get(BASE).then(unwrap);

/** PUT /admin/system-configurations/{key} — { newValue, reason } */
export const updateAdminSystemConfiguration = (key, payload) =>
    axiosClient.put(`${BASE}/${encodeURIComponent(key)}`, payload).then(unwrap);
