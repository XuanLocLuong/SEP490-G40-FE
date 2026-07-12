import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const USERS_BASE = `${API_PREFIX}/users`;

const unwrapData = (response) => response.data.data;

export const getApiErrorMessage = (error, fallback = 'Có lỗi xảy ra') =>
    error?.response?.data?.message || error?.message || fallback;

const userApi = {
    getCurrentUser: async () => {
        const res = await axiosClient.get(`${USERS_BASE}/me`);
        return unwrapData(res);
    },

    // Cap nhat ten + so dien thoai (email KHONG gui len vi chi read-only)
    // data: { fullName, phone? }
    updateCurrentUser: async (data) => {
        const res = await axiosClient.put(`${USERS_BASE}/me`, data);
        return unwrapData(res);
    },

    // Upload avatar — multipart field "file" (BE: POST /users/me/avatar)
    uploadAvatar: async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const res = await axiosClient.post(`${USERS_BASE}/me/avatar`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });

        return unwrapData(res);
    },

    deleteAvatar: async () => {
        await axiosClient.delete(`${USERS_BASE}/me/avatar`);
    },

    // Doi mat khau — data: { currentPassword, newPassword }
    changePassword: async (data) => {
        await axiosClient.post(`${USERS_BASE}/change-password`, data);
    },
};

export default userApi;
