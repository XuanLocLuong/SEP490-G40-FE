import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const BASE = `${API_PREFIX}/admin/skills`;

const ERROR_MESSAGES = {
    SKILL_ALREADY_EXISTS: 'Tên kỹ năng đã tồn tại.',
    SKILL_NOT_FOUND: 'Không tìm thấy kỹ năng.',
    NO_UPDATE_REQUIRED: 'Trạng thái kỹ năng không thay đổi.',
};

export const getApiErrorMessage = (error, fallback = 'Có lỗi xảy ra') => {
    const raw = error?.response?.data?.message || error?.message || '';
    return ERROR_MESSAGES[raw] || raw || fallback;
};

/** GET /admin/skills — keyword, status, category, page, size */
export const searchSkills = (params) => axiosClient.get(BASE, { params });

/** GET /admin/skills/{id} */
export const getSkillDetail = (id) => axiosClient.get(`${BASE}/${id}`);

/** POST /admin/skills */
export const createSkill = (payload) => axiosClient.post(BASE, payload);

/** PUT /admin/skills/{id} */
export const updateSkill = (id, payload) => axiosClient.put(`${BASE}/${id}`, payload);

/** POST /admin/skills/{id}/activate */
export const activateSkill = (id, payload) =>
    axiosClient.post(`${BASE}/${id}/activate`, payload);

/** POST /admin/skills/{id}/deactivate */
export const deactivateSkill = (id, payload) =>
    axiosClient.post(`${BASE}/${id}/deactivate`, payload);
