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

// /auth/* public không gắn token (tránh token cũ làm BE chặn login/register).
// Một số /auth/* vẫn cần Bearer theo contract BE.
const AUTH_ENDPOINTS_NEEDING_BEARER = [
    '/auth/resend-verification-email',
    '/auth/change-email',
    '/auth/logout',
];

const authEndpointNeedsBearer = (url = '') =>
    AUTH_ENDPOINTS_NEEDING_BEARER.some((path) => url.includes(path));

axiosClient.interceptors.request.use((config) => {
    const url = config.url || '';
    const isAuthEndpoint = url.includes('/auth/');
    const auth = getAuth();
    const shouldAttachToken =
        Boolean(auth?.token) && (!isAuthEndpoint || authEndpointNeedsBearer(url));

    if (shouldAttachToken) {
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
        const url = originalRequest?.url || '';
        const isPublicAuthEndpoint = url.includes('/auth/') && !authEndpointNeedsBearer(url);

        if (status !== 401 || isPublicAuthEndpoint || originalRequest._retry) {
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
