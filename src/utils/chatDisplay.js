/** Actions rendered as sticky cards in chat UI. */
export const CHAT_UI_ACTIONS = new Set([
    'CONFIRM_HIRED',
    'REQUEST_REVIEW',
    'REJECT_INVITATION',
]);

export const filterChatUiActions = (actions = []) =>
    (Array.isArray(actions) ? actions : []).filter((name) => CHAT_UI_ACTIONS.has(name));

export const getActionCardCopy = (actionName) => {
    switch (actionName) {
        case 'CONFIRM_HIRED':
            return {
                title: 'Xác nhận nhận việc',
                body: 'Nhà tuyển dụng đã chấp nhận đơn của bạn. Xác nhận để chuyển sang trạng thái đã nhận việc (HIRED).',
                cta: 'Xác nhận nhận việc',
            };
        case 'REQUEST_REVIEW':
            return {
                title: 'Viết đánh giá',
                body: 'Công việc đã đủ điều kiện đánh giá. Gửi review cho đối phương ngay tại đây.',
                cta: 'Viết đánh giá',
            };
        case 'REJECT_INVITATION':
            return {
                title: 'Từ chối lời mời',
                body: 'Bạn có lời mời ứng tuyển đang chờ phản hồi. Từ chối sẽ cập nhật trạng thái lời mời.',
                cta: 'Từ chối lời mời',
            };
        default:
            return {
                title: actionName,
                body: '',
                cta: 'Tiếp tục',
            };
    }
};

export const formatChatListTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '';

    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const dayDiff = Math.round((startToday - startTarget) / 86_400_000);

    if (dayDiff === 0) {
        return date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
    }
    if (dayDiff === 1) return 'Hôm qua';
    if (dayDiff < 7) {
        return date.toLocaleDateString('vi-VN', { weekday: 'short' });
    }
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};

export const formatMessageTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
};

export const getInitials = (name = '') => {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase();
};

export const previewLastMessage = (conv) => {
    if (!conv) return 'Chưa có tin nhắn';
    if (conv.lastMessageType === 'ACTION' && conv.lastMessageActionName) {
        const copy = getActionCardCopy(conv.lastMessageActionName);
        return copy.title;
    }
    return conv.lastMessageContent || 'Chưa có tin nhắn';
};

export const unwrapData = (res) => res?.data?.data ?? res?.data;

export const unwrapPageContent = (res) => {
    const page = unwrapData(res);
    if (Array.isArray(page)) return page;
    if (Array.isArray(page?.content)) return page.content;
    return [];
};
