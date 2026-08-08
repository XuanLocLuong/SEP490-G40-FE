/** Invite-group ACTION messages: show card + buttons for the recipient. */
export const INVITE_GROUP_ACTIONS = new Set([
    'INVITE',
    'CONFIRM_WORK',
    'REQUEST_REVIEW',
]);

/** Decision actions from GET /actions or button clicks. */
export const DECISION_ACTIONS = new Set([
    'ACCEPT_INVITE',
    'REJECT_INVITE',
    'ACCEPT_WORK',
    'REJECT_WORK',
    'ACCEPT_APPLICATION',
    'REJECT_APPLICATION',
]);

/** Sticky /actions names FE will render. */
export const CHAT_UI_ACTIONS = new Set([
    'INVITE',
    'CONFIRM_WORK',
    'REQUEST_REVIEW',
    'ACCEPT_INVITE',
    'REJECT_INVITE',
    'ACCEPT_WORK',
    'REJECT_WORK',
    'ACCEPT_APPLICATION',
    'REJECT_APPLICATION',
    // legacy aliases (pre-rename)
    'CONFIRM_HIRED',
    'REJECT_INVITATION',
]);

export const isNotifyAction = (actionName) =>
    typeof actionName === 'string' && actionName.startsWith('NOTIFY_');

export const normalizeChatAction = (actionName) => {
    if (actionName === 'CONFIRM_HIRED') return 'ACCEPT_WORK';
    if (actionName === 'REJECT_INVITATION') return 'REJECT_INVITE';
    return actionName;
};

/**
 * Normalize GET /actions item (legacy string or ActionTarget object).
 * @returns {{ action: string, applicationId?: number|null, invitationId?: number|null, candidateProfileId?: number|null } | null}
 */
export const normalizeActionTarget = (item) => {
    if (item == null) return null;

    if (typeof item === 'string') {
        const action = normalizeChatAction(item);
        if (!CHAT_UI_ACTIONS.has(action)) return null;
        return {
            action,
            applicationId: null,
            invitationId: null,
            candidateProfileId: null,
        };
    }

    if (typeof item !== 'object') return null;

    const raw = item.action ?? item.actionName ?? item.name;
    if (typeof raw !== 'string') return null;
    const action = normalizeChatAction(raw);
    if (!CHAT_UI_ACTIONS.has(action)) return null;

    return {
        action,
        applicationId: item.applicationId ?? item.application_id ?? null,
        invitationId: item.invitationId ?? item.invitation_id ?? null,
        candidateProfileId:
            item.candidateProfileId ?? item.candidate_profile_id ?? null,
    };
};

/** @returns {ReturnType<typeof normalizeActionTarget>[]} */
export const filterChatUiActions = (actions = []) =>
    (Array.isArray(actions) ? actions : [])
        .map(normalizeActionTarget)
        .filter(Boolean);

export const findActionTarget = (actions, actionName) => {
    const want = normalizeChatAction(actionName);
    if (!want) return null;
    return (
        (Array.isArray(actions) ? actions : []).find((item) => {
            const target = normalizeActionTarget(item);
            return target?.action === want;
        }) ?? null
    );
};

export const getActionApplicationId = (actions, ...actionNames) => {
    for (const name of actionNames) {
        const id = findActionTarget(actions, name)?.applicationId;
        if (id != null) return id;
    }
    return null;
};

export const getActionInvitationId = (actions, ...actionNames) => {
    for (const name of actionNames) {
        const id = findActionTarget(actions, name)?.invitationId;
        if (id != null) return id;
    }
    return null;
};

export const getActionCandidateProfileId = (actions, ...actionNames) => {
    for (const name of actionNames) {
        const id = findActionTarget(actions, name)?.candidateProfileId;
        if (id != null) return id;
    }
    return null;
};

/**
 * Collapse paired decision actions into one sticky card descriptor.
 * @returns {{ key: string, kind: string, actions: string[] }[]}
 */
export const groupStickyActions = (actions = []) => {
    const targets = filterChatUiActions(actions);
    const set = new Set(targets.map((t) => t.action));
    const groups = [];

    const takePair = (kind, accept, reject) => {
        const hasA = set.has(accept);
        const hasR = set.has(reject);
        if (!hasA && !hasR) return;
        const list = [];
        if (hasA) list.push(accept);
        if (hasR) list.push(reject);
        set.delete(accept);
        set.delete(reject);
        groups.push({ key: kind, kind, actions: list });
    };

    takePair('WORK', 'ACCEPT_WORK', 'REJECT_WORK');
    takePair('INVITE_DECISION', 'ACCEPT_INVITE', 'REJECT_INVITE');
    takePair('APPLICATION', 'ACCEPT_APPLICATION', 'REJECT_APPLICATION');

    if (set.has('INVITE')) {
        set.delete('INVITE');
        groups.push({ key: 'INVITE', kind: 'INVITE', actions: ['INVITE'] });
    }
    if (set.has('CONFIRM_WORK')) {
        set.delete('CONFIRM_WORK');
        // Sticky CONFIRM_WORK is unusual (usually a bubble); treat as work pair if alone
        groups.push({
            key: 'CONFIRM_WORK',
            kind: 'WORK',
            actions: ['ACCEPT_WORK', 'REJECT_WORK'],
        });
    }
    if (set.has('REQUEST_REVIEW')) {
        set.delete('REQUEST_REVIEW');
        groups.push({
            key: 'REQUEST_REVIEW',
            kind: 'REQUEST_REVIEW',
            actions: ['REQUEST_REVIEW'],
        });
    }

    return groups;
};

export const getActionCardCopy = (actionName) => {
    const name = normalizeChatAction(actionName);
    switch (name) {
        case 'INVITE':
            return {
                title: 'Mời ứng tuyển',
                body: 'Gửi lời mời ứng tuyển cho ứng viên trong hội thoại này.',
                cta: 'Gửi lời mời',
                acceptCta: null,
                rejectCta: null,
            };
        case 'CONFIRM_WORK':
            return {
                title: 'Xác nhận nhận việc',
                body: 'Nhà tuyển dụng đã chấp nhận đơn của bạn. Xác nhận để chuyển sang trạng thái đã nhận việc (HIRED).',
                cta: null,
                acceptCta: 'Xác nhận nhận việc',
                rejectCta: 'Từ chối nhận việc',
            };
        case 'ACCEPT_WORK':
        case 'REJECT_WORK':
            return {
                title: 'Xác nhận nhận việc',
                body: 'Đơn của bạn đang ở trạng thái ACCEPTED. Xác nhận hoặc từ chối nhận việc.',
                cta: null,
                acceptCta: 'Xác nhận nhận việc',
                rejectCta: 'Từ chối nhận việc',
            };
        case 'ACCEPT_INVITE':
        case 'REJECT_INVITE':
            return {
                title: 'Lời mời ứng tuyển',
                body: 'Bạn có lời mời đang chờ phản hồi.',
                cta: null,
                acceptCta: 'Đồng ý lời mời',
                rejectCta: 'Từ chối lời mời',
            };
        case 'ACCEPT_APPLICATION':
        case 'REJECT_APPLICATION':
            return {
                title: 'Duyệt đơn ứng tuyển',
                body: 'Ứng viên đang có đơn PENDING cho tin này. Chấp nhận hoặc từ chối.',
                cta: null,
                acceptCta: 'Chấp nhận đơn',
                rejectCta: 'Từ chối đơn',
            };
        case 'REQUEST_REVIEW':
            return {
                title: 'Viết đánh giá',
                body: 'Công việc đã đủ điều kiện đánh giá. Gửi review cho đối phương ngay tại đây.',
                cta: 'Viết đánh giá',
                acceptCta: null,
                rejectCta: null,
            };
        default:
            return {
                title: name || 'Hành động',
                body: '',
                cta: 'Tiếp tục',
                acceptCta: null,
                rejectCta: null,
            };
    }
};

/** Copy for invite-group bubbles by message.actionName */
export const getInviteGroupCardCopy = (actionName, content) => {
    const base = getActionCardCopy(actionName);
    if (content) {
        return { ...base, body: content };
    }
    if (actionName === 'INVITE') {
        return {
            title: 'Lời mời ứng tuyển',
            body: base.body,
            acceptCta: 'Đồng ý lời mời',
            rejectCta: 'Từ chối lời mời',
            cta: null,
        };
    }
    return base;
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

/** Matches BE `app.chat.edit-window-minutes` default. */
export const CHAT_EDIT_WINDOW_MINUTES = 15;

export const canEditChatMessage = (message, { now = Date.now() } = {}) => {
    if (!message || message.deleted || message.messageType !== 'TEXT') return false;
    if (!message.createdAt) return false;
    const created = new Date(message.createdAt).getTime();
    if (Number.isNaN(created)) return false;
    return now - created <= CHAT_EDIT_WINDOW_MINUTES * 60 * 1000;
};

export const canRecallChatMessage = (message) =>
    Boolean(message && !message.deleted && message.id != null);

export const getInitials = (name = '') => {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase();
};

/** True if inbox should list this conversation (has at least one message). */
export const conversationHasMessages = (conv) => {
    if (!conv) return false;
    return Boolean(
        conv.lastMessageAt ||
            conv.lastMessageContent ||
            conv.lastMessageType ||
            conv.lastMessageActionName
    );
};

export const previewLastMessage = (conv) => {
    if (!conv) return 'Chưa có tin nhắn';
    if (conv.lastMessageType === 'ACTION' && conv.lastMessageActionName) {
        if (isNotifyAction(conv.lastMessageActionName)) {
            return conv.lastMessageContent || 'Thông báo hệ thống';
        }
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
