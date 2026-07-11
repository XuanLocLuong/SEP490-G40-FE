import axios from 'axios';
import { getAuth, setAuth, clearAuth } from '../utils/Auth.jsx';

// Backend chạy tất cả API dưới prefix /api/v1 (xem SecurityConfig / *Controller.java).
// VITE_API_URL chỉ nên chứa domain gốc (vd: http://localhost:8080), KHÔNG kèm /api/v1.
export const API_PREFIX = '/api/v1';

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

axiosClient.interceptors.request.use((config) => {
    const auth = getAuth();
    if (auth?.token) {
        config.headers.Authorization = `Bearer ${auth.token}`;
    }
    return config;
});

// Tự động refresh access token khi bị 401, retry lại request gốc 1 lần.
// Nếu refresh cũng fail thì clear auth và đá về /login.
let isRefreshing = false;
let pendingQueue = [];

const processQueue = (error, token = null) => {
    pendingQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve(token);
    });
    pendingQueue = [];
};

axiosClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;
        const isAuthEndpoint = originalRequest?.url?.includes('/auth/');

        if (status !== 401 || isAuthEndpoint || originalRequest._retry) {
            return Promise.reject(error);
        }

        const auth = getAuth();
        if (!auth?.refreshToken) {
            clearAuth();
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                pendingQueue.push({ resolve, reject });
            }).then((newToken) => {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return axiosClient(originalRequest);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const res = await axios.post(
                `${import.meta.env.VITE_API_URL}${API_PREFIX}/auth/refresh`,
                { refreshToken: auth.refreshToken }
            );
            const newAuth = { ...auth, ...res.data.data };
            setAuth(newAuth);
            processQueue(null, newAuth.token);
            originalRequest.headers.Authorization = `Bearer ${newAuth.token}`;
            return axiosClient(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError, null);
            clearAuth();
            window.location.href = '/login';
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default axiosClient;
