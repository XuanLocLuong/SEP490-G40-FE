import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const AVAILABILITY_BASE = `${API_PREFIX}/candidate/availability`;
const SCHEDULE_SCAN_ENDPOINT = `${API_PREFIX}/candidate/schedule/scan`;

export const getAvailability = () => axiosClient.get(AVAILABILITY_BASE);

// Replace all availability slots. Backend expects the complete list.
export const updateAvailability = (slots) => axiosClient.put(AVAILABILITY_BASE, slots);

export const uploadTimetable = (image) => {
    const formData = new FormData();
    formData.append('image', image);

    return axiosClient.post(SCHEDULE_SCAN_ENDPOINT, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};
