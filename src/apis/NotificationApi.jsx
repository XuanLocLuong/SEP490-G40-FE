import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const BASE = `${API_PREFIX}/notifications`;

/**
 * GET /notifications?beforeId=&size=&isRead=
 * isRead: true | false | omit for all
 */
export const fetchNotifications = (params = {}) =>
    axiosClient.get(BASE, { params });

/** GET /notifications/summary — { totalCount, unreadCount, readCount } */
export const fetchNotificationSummary = () =>
    axiosClient.get(`${BASE}/summary`);

/** GET /notifications/unread-count */
export const fetchUnreadNotificationCount = () =>
    axiosClient.get(`${BASE}/unread-count`);

/** PUT /notifications/{id}/read */
export const markNotificationRead = (id) =>
    axiosClient.put(`${BASE}/${id}/read`);

/** PUT /notifications/read-all */
export const markAllNotificationsRead = () =>
    axiosClient.put(`${BASE}/read-all`);
