import axios from 'axios';
import { getAuth, setAuth, clearAuth } from '../utils/Auth.jsx';
import {
    markSessionExpired,
    markAccountLocked,
    clearSessionExpiredFlag,
} from '../utils/sessionExpiredStorage.js';
import { ROUTES } from '../routes/path.js';
import { rememberPostLoginPath } from '../utils/authRedirect.js';

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

/** Chặn redirect /login khi đang logout chủ động (tránh race 401 in-flight). */
let suppressSessionExpiredRedirect = false;

export const setSuppressSessionExpiredRedirect = (value) => {
    suppressSessionExpiredRedirect = Boolean(value);
};

const PROTECTED_PATH_PREFIXES = [
    '/candidate',
    '/recruiter',
    '/admin',
    '/post-manager',
    '/manual-check',
];

const isProtectedAppPath = (path = '') =>
    PROTECTED_PATH_PREFIXES.some(
        (prefix) => path === prefix || path.startsWith(`${prefix}/`)
    );

/**
 * Session chết:
 * - Logout chủ động / trang public: clear lặng, về Landing (không hiện “hết hạn”).
 * - Đang ở trang nội bộ (đã login): mới mark flag + đá Login để hiện form lỗi.
 * @param {{ accountLock?: boolean }} [opts]
 */
const redirectToLoginAfterSessionExpired = ({ accountLock = false } = {}) => {
    if (suppressSessionExpiredRedirect) {
        clearAuth();
        clearSessionExpiredFlag();
        return;
    }

    const auth = getAuth();
    const path = window.location.pathname || '';
    const currentPath = `${path}${window.location.search || ''}${window.location.hash || ''}`;
    const hasReturnPath = Boolean(auth && rememberPostLoginPath(currentPath, auth.role));
    clearAuth();

    if (!hasReturnPath && !isProtectedAppPath(path)) {
        // Guest / Landing / jobs public: không hiện “Phiên đăng nhập đã hết hạn”.
        clearSessionExpiredFlag();
        if (path !== ROUTES.LANDING && path !== ROUTES.LOGIN) {
            window.location.href = ROUTES.LANDING;
        }
        return;
    }

    if (accountLock) markAccountLocked();
    else markSessionExpired();
    if (path !== ROUTES.LOGIN && !path.startsWith(`${ROUTES.LOGIN}/`)) {
        window.location.href = ROUTES.LOGIN;
    }
};

axiosClient.interceptors.request.use((config) => {
    const url = config.url || '';
    const isAuthEndpoint = url.includes('/auth/');
    const auth = getAuth();
    const shouldAttachToken =
        Boolean(auth?.token) && (!isAuthEndpoint || authEndpointNeedsBearer(url));

    if (shouldAttachToken) {
        config.headers.Authorization = `Bearer ${auth.token}`;
    } else {
        // Giữ Bearer truyền tay cho logout/resend sau clearAuth; còn lại bỏ Bearer cũ (retry).
        const keepManualBearer =
            authEndpointNeedsBearer(url) && Boolean(config.headers?.Authorization);
        if (!keepManualBearer && config.headers) {
            delete config.headers.Authorization;
            delete config.headers.authorization;
        }
    }
    return config;
});

// Tự động refresh access token khi bị 401, retry lại request gốc 1 lần.
// Nếu refresh cũng fail thì clear auth, báo hết phiên và đá về /login.
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
        const isLogoutCall = url.includes('/auth/logout');
        const isPublicAuthEndpoint = url.includes('/auth/') && !authEndpointNeedsBearer(url);

        // Logout chủ động: không refresh / không đá /login — AuthContext tự clear rồi về Landing.
        if (status === 401 && isLogoutCall) {
            return Promise.reject(error);
        }

        if (status !== 401 || isPublicAuthEndpoint || originalRequest._retry) {
            return Promise.reject(error);
        }

        const auth = getAuth();
        if (!auth?.refreshToken) {
            redirectToLoginAfterSessionExpired();
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
            const lockKey =
                refreshError?.response?.data?.message || refreshError?.response?.data?.code;
            redirectToLoginAfterSessionExpired({
                accountLock: lockKey === 'ACCOUNT_LOCK',
            });
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default axiosClient;
