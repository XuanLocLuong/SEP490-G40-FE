import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const BASE = `${API_PREFIX}/invitations`;

const ERROR_MESSAGES = {
    INVALID_STATUS: 'Lời mời không còn ở trạng thái chờ phản hồi.',
    INVITATION_EXPIRED: 'Lời mời đã hết hạn.',
    INVITATION_INVALIDATED: 'Lời mời không còn hiệu lực (tin đã đóng hoặc không hợp lệ).',
    INVITATION_NOT_FOUND: 'Không tìm thấy lời mời.',
    NOT_OWNER: 'Bạn không có quyền thao tác lời mời này.',
};

export const getInvitationApiErrorMessage = (error, fallback = 'Có lỗi xảy ra') => {
    const message = error?.response?.data?.message || error?.message || fallback;
    return ERROR_MESSAGES[message] || message;
};

/** GET /invitations/me — params: { status?, page?, size? } */
export const getMyInvitations = (params) => axiosClient.get(`${BASE}/me`, { params });

/** GET /invitations/{id} */
export const getInvitationDetail = (invitationId) =>
    axiosClient.get(`${BASE}/${invitationId}`);

/** PUT /invitations/{id}/accept */
export const acceptInvitation = (invitationId) =>
    axiosClient.put(`${BASE}/${invitationId}/accept`);

/** PUT /invitations/{id}/reject */
export const rejectInvitation = (invitationId) =>
    axiosClient.put(`${BASE}/${invitationId}/reject`);
