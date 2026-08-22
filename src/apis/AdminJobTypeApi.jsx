import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const BASE = `${API_PREFIX}/admin/job-types`;

const ERROR_MESSAGES = {
    'Không tìm thấy loại công việc': 'Không tìm thấy lĩnh vực.',
    'Mã loại công việc đã tồn tại': 'Mã lĩnh vực đã tồn tại.',
    'Code is required': 'Mã lĩnh vực là bắt buộc.',
    'Name is required': 'Tên lĩnh vực là bắt buộc.',
};

const unwrap = (response) => response?.data?.data ?? response?.data;

export const getJobTypeApiErrorMessage = (error, fallback = 'Có lỗi xảy ra') => {
    const raw = error?.response?.data?.message || error?.message || '';
    return ERROR_MESSAGES[raw] || raw || fallback;
};

export const listJobTypes = async (params = {}) => {
    const response = await axiosClient.get(BASE, { params });
    return unwrap(response);
};

export const getJobType = async (id) => {
    const response = await axiosClient.get(`${BASE}/${id}`);
    return unwrap(response);
};

export const createJobType = async (payload) => {
    const response = await axiosClient.post(BASE, payload);
    return unwrap(response);
};

export const updateJobType = async (id, payload) => {
    const response = await axiosClient.put(`${BASE}/${id}`, payload);
    return unwrap(response);
};

export const toggleJobTypeStatus = async (id) => {
    const response = await axiosClient.patch(`${BASE}/${id}/status`);
    return unwrap(response);
};
