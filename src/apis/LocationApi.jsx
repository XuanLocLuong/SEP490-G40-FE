import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const LOCATIONS_BASE = `${API_PREFIX}/locations`;

const unwrapData = (response) => response.data.data;

export const getLocationApiErrorMessage = (error, fallback = 'Có lỗi xảy ra') =>
    error?.response?.data?.message || error?.message || fallback;

/**
 * Payload khớp BE CreateLocationRequest:
 * - name:     tên chi nhánh / cơ sở
 * - address:  số nhà, đường (chi tiết)
 * - city:     Tỉnh / Thành phố (tên text)
 * - ward:     Phường / Xã (tên text)
 * - latitude, longitude: tọa độ từ map (optional)
 */
const locationApi = {
    getMyLocations: async (businessId) => {
        const res = await axiosClient.get(`${LOCATIONS_BASE}/me`, {
            params: businessId != null ? { businessId } : {},
        });
        return unwrapData(res);
    },

    getLocationById: async (businessId, id) => {
        const res = await axiosClient.get(`${LOCATIONS_BASE}/${id}`, {
            params: { businessId },
        });
        return unwrapData(res);
    },

    createLocation: async (businessId, data) => {
        const res = await axiosClient.post(LOCATIONS_BASE, data, {
            params: { businessId },
        });
        return unwrapData(res);
    },

    updateLocation: async (businessId, id, data) => {
        const res = await axiosClient.put(`${LOCATIONS_BASE}/${id}`, data, {
            params: { businessId },
        });
        return unwrapData(res);
    },

    deleteLocation: async (businessId, id) => {
        await axiosClient.delete(`${LOCATIONS_BASE}/${id}`, {
            params: { businessId },
        });
    },
};

export default locationApi;
