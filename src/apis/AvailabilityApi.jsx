import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const AVAILABILITY_BASE = `${API_PREFIX}/candidate/availability`;
const SCHEDULE_SCAN_ENDPOINT = `${API_PREFIX}/candidate/schedule/scan`;

export const getAvailability = () => axiosClient.get(AVAILABILITY_BASE);

/** Tạo lịch lần đầu (chưa có active). Body: { startDate, endDate, slots }. */
export const createAvailability = (payload) => axiosClient.post(AVAILABILITY_BASE, payload);

/** Cập nhật lịch (đã có active). Body: { startDate, endDate, slots }. */
export const updateAvailability = (payload) => axiosClient.put(AVAILABILITY_BASE, payload);

export const uploadTimetable = (image) => {
    const formData = new FormData();
    formData.append('image', image);

    return axiosClient.post(SCHEDULE_SCAN_ENDPOINT, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};
