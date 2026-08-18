import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const WORK_HISTORY_BASE = `${API_PREFIX}/candidate/work-histories`;

export const getWorkHistories = () => axiosClient.get(WORK_HISTORY_BASE);

export const createWorkHistory = (payload) => axiosClient.post(WORK_HISTORY_BASE, payload);

export const updateWorkHistory = (id, payload) =>
    axiosClient.put(`${WORK_HISTORY_BASE}/${id}`, payload);

export const deleteWorkHistory = (id) => axiosClient.delete(`${WORK_HISTORY_BASE}/${id}`);
