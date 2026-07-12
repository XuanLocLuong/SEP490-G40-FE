import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const PROFILE_BASE = `${API_PREFIX}/recruiter/profile`;

const unwrapData = (response) => response.data.data;

export const getApiErrorMessage = (error, fallback = 'Có lỗi xảy ra') =>
    error?.response?.data?.message || error?.message || fallback;

const recruiterProfileApi = {
    getProfile: async () => {
        const res = await axiosClient.get(PROFILE_BASE);
        return unwrapData(res);
    },

    createProfile: async (data) => {
        const res = await axiosClient.post(PROFILE_BASE, data);
        return unwrapData(res);
    },

    updateProfile: async (data) => {
        const res = await axiosClient.put(PROFILE_BASE, data);
        return unwrapData(res);
    },

    uploadLogo: async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const res = await axiosClient.post(`${PROFILE_BASE}/logo`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });

        return unwrapData(res);
    },

    deleteLogo: async () => {
        await axiosClient.delete(`${PROFILE_BASE}/logo`);
    },

    uploadGallery: async (files) => {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));

        const res = await axiosClient.post(`${PROFILE_BASE}/gallery`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });

        return unwrapData(res);
    },

    deleteGalleryImage: async (imageId) => {
        await axiosClient.delete(`${PROFILE_BASE}/gallery/${imageId}`);
    },
};

export default recruiterProfileApi;
