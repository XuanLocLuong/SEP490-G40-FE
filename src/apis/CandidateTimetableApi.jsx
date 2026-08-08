import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const TIMETABLE_BASE = `${API_PREFIX}/candidate/timetable`;

const unwrap = (res) => res?.data?.data ?? res?.data ?? null;

export const getTimetable = () => axiosClient.get(TIMETABLE_BASE);

export const createTimetable = (payload) => axiosClient.post(TIMETABLE_BASE, payload);

export const updateTimetable = (payload) => axiosClient.put(TIMETABLE_BASE, payload);

export const applyTimetable = () => axiosClient.post(`${TIMETABLE_BASE}/apply`);

export const unapplyTimetable = () => axiosClient.post(`${TIMETABLE_BASE}/unapply`);

export const fetchTimetable = async () => unwrap(await getTimetable());
