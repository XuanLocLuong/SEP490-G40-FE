import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const BASE = `${API_PREFIX}/admin/business-types`;

const ERROR_MESSAGES = {
    'Business type not found': 'Không tìm thấy loại hình doanh nghiệp.',
    'Business type code already exists': 'Mã loại hình đã tồn tại.',
    'Code is required': 'Mã loại hình là bắt buộc.',
    'Name is required': 'Tên loại hình là bắt buộc.',
    'Requires business license must be specified': 'Cần chọn yêu cầu giấy phép kinh doanh.',
};

export const getBusinessTypeApiErrorMessage = (error, fallback = 'Có lỗi xảy ra') => {
    const raw = error?.response?.data?.message || error?.message || '';
    if (ERROR_MESSAGES[raw]) return ERROR_MESSAGES[raw];
    return raw || fallback;
};

const unwrap = (response) => response?.data?.data ?? response?.data;

/** GET /admin/business-types — Spring Pageable: page, size, sort */
export const listBusinessTypes = async (params = {}) => {
    const response = await axiosClient.get(BASE, { params });
    return unwrap(response);
};

/** GET /admin/business-types/{id} */
export const getBusinessType = async (id) => {
    const response = await axiosClient.get(`${BASE}/${id}`);
    return unwrap(response);
};

/** POST /admin/business-types */
export const createBusinessType = async (payload) => {
    const response = await axiosClient.post(BASE, payload);
    return unwrap(response);
};

/** PUT /admin/business-types/{id} */
export const updateBusinessType = async (id, payload) => {
    const response = await axiosClient.put(`${BASE}/${id}`, payload);
    return unwrap(response);
};

/** PATCH /admin/business-types/{id}/status — toggle active */
export const toggleBusinessTypeStatus = async (id) => {
    const response = await axiosClient.patch(`${BASE}/${id}/status`);
    return unwrap(response);
};
