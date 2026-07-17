import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const BASE = `${API_PREFIX}/recommendation`;

/** GET /recommendation/jobs — gợi ý job cho candidate đang đăng nhập. */
export const fetchRecommendedJobs = (page = 0, size = 10) =>
    axiosClient.get(`${BASE}/jobs`, { params: { page, size } });
