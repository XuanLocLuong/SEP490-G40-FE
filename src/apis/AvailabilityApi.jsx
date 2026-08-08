import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const AVAILABILITY_BASE = `${API_PREFIX}/candidate/availability`;
const SCHEDULE_BASE = `${API_PREFIX}/candidate/schedule`;
const SCHEDULE_SCAN_ENDPOINT = `${SCHEDULE_BASE}/scan`;
const HIRED_JOBS_ENDPOINT = `${API_PREFIX}/candidate/jobs/hired`;

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

/** GET tổng quan: mode, TKB expired, hired counts, free slots. */
export const getScheduleSummary = () => axiosClient.get(`${SCHEDULE_BASE}/summary`);

/** Chuyển MANUAL ↔ CALCULATED. */
export const switchScheduleMode = (mode) =>
    axiosClient.post(`${SCHEDULE_BASE}/mode`, null, { params: { mode } });

/** Danh sách lịch job đã nhận (Hired). */
export const getHiredJobShifts = () => axiosClient.get(HIRED_JOBS_ENDPOINT);

export const applyJobSchedule = (applicationId) =>
    axiosClient.post(`${API_PREFIX}/candidate/jobs/${applicationId}/apply`);

export const unapplyJobSchedule = (applicationId) =>
    axiosClient.post(`${API_PREFIX}/candidate/jobs/${applicationId}/unapply`);
