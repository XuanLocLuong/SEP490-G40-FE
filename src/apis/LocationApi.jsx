import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const LOCATIONS_BASE = `${API_PREFIX}/locations`;

const unwrapData = (response) => response.data.data;

export const getLocationApiErrorMessage = (error, fallback = 'Có lỗi xảy ra') =>
    error?.response?.data?.message || error?.message || fallback;

/**
 * Payload khớp BE CreateLocationRequest:
 * - name:     tên chi nhánh / cơ sở (vd: "Cafe BU – Cầu Giấy")
 * - address:  số nhà, đường (chi tiết)
 * - city:     Tỉnh / Thành phố (tên text)
 * - district: Phường / Xã (tên text — BE đặt tên field là district)
 * - latitude, longitude: tọa độ từ map (optional nhưng nên có)
 */
const locationApi = {
    /** GET /locations/me — danh sách địa điểm của business recruiter hiện tại */
    getMyLocations: async () => {
        const res = await axiosClient.get(`${LOCATIONS_BASE}/me`);
        return unwrapData(res);
    },

    /** GET /locations/{id} — chi tiết 1 địa điểm */
    getLocationById: async (id) => {
        const res = await axiosClient.get(`${LOCATIONS_BASE}/${id}`);
        return unwrapData(res);
    },

    /** POST /locations — tạo địa điểm mới (lần đầu thêm địa chỉ cơ sở) */
    createLocation: async (data) => {
        const res = await axiosClient.post(LOCATIONS_BASE, data);
        return unwrapData(res);
    },

    /** PUT /locations/{id} — cập nhật địa điểm đã có */
    updateLocation: async (id, data) => {
        const res = await axiosClient.put(`${LOCATIONS_BASE}/${id}`, data);
        return unwrapData(res);
    },

    /** DELETE /locations/{id} — xóa (BE chặn nếu location đang gắn job) */
    deleteLocation: async (id) => {
        await axiosClient.delete(`${LOCATIONS_BASE}/${id}`);
    },
};

export default locationApi;
