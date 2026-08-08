import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const HIRED_JOBS_BASE = `${API_PREFIX}/candidate/jobs/hired`;

const unwrap = (res) => res?.data?.data ?? res?.data ?? null;

export const getHiredJobSchedules = () => axiosClient.get(HIRED_JOBS_BASE);

export const applyHiredJobSchedule = (applicationId) =>
    axiosClient.post(`${API_PREFIX}/candidate/jobs/${applicationId}/apply`);

export const unapplyHiredJobSchedule = (applicationId) =>
    axiosClient.post(`${API_PREFIX}/candidate/jobs/${applicationId}/unapply`);

export const fetchHiredJobSchedules = async () => {
    const data = unwrap(await getHiredJobSchedules());
    return Array.isArray(data) ? data : [];
};
