import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const BASE = `${API_PREFIX}/chat`;

/** POST /chat/conversations — { jobId?, otherUserId } */
export const createOrGetConversation = (body) =>
    axiosClient.post(`${BASE}/conversations`, body);

/** GET /chat/conversations?page=&size= */
export const fetchConversations = (params = {}) =>
    axiosClient.get(`${BASE}/conversations`, { params });

/** GET /chat/conversations/{id}/messages?beforeId=&size= */
export const fetchMessages = (conversationId, params = {}) =>
    axiosClient.get(`${BASE}/conversations/${conversationId}/messages`, { params });

/** POST /chat/conversations/{id}/messages — { content, messageType, actionName? } */
export const sendMessage = (conversationId, body) =>
    axiosClient.post(`${BASE}/conversations/${conversationId}/messages`, body);

/** PUT /chat/conversations/{id}/read */
export const markConversationRead = (conversationId) =>
    axiosClient.put(`${BASE}/conversations/${conversationId}/read`);

/** GET /chat/conversations/{id}/actions */
export const fetchConversationActions = (conversationId) =>
    axiosClient.get(`${BASE}/conversations/${conversationId}/actions`);

/** PATCH /chat/messages/{id} — { content } */
export const editMessage = (messageId, body) =>
    axiosClient.patch(`${BASE}/messages/${messageId}`, body);

/** DELETE /chat/messages/{id} */
export const recallMessage = (messageId) =>
    axiosClient.delete(`${BASE}/messages/${messageId}`);
