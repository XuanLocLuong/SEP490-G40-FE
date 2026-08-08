import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getAuth } from './Auth.jsx';

const getWsUrl = () => {
    const base = String(import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
    return `${base}/ws`;
};

/** @type {import('@stomp/stompjs').Client | null} */
let client = null;

/** @type {Map<string, { onMessage?: Function, onActionsUpdated?: Function, onSeen?: Function, onTyping?: Function, messageSub?: { unsubscribe: Function }, actionsSub?: { unsubscribe: Function }, seenSub?: { unsubscribe: Function }, typingSub?: { unsubscribe: Function } }>} */
const conversationHandlers = new Map();

/** @type {Map<string, { listeners: Set<(summary: object) => void>, sub?: { unsubscribe: Function } }>} */
const inboxHandlers = new Map();

/** @type {Map<string, { listeners: Set<(notification: object) => void>, sub?: { unsubscribe: Function } }>} */
const notificationHandlers = new Map();

/** @type {Set<(connected: boolean) => void>} */
const connectionListeners = new Set();

let connected = false;

const notifyConnection = (value) => {
    connected = value;
    connectionListeners.forEach((fn) => {
        try {
            fn(value);
        } catch {
            // ignore listener errors
        }
    });
};

const parseBody = (frame) => {
    try {
        return JSON.parse(frame.body);
    } catch {
        return null;
    }
};

const subscribeHandlers = (convId, entry) => {
    if (!client?.connected || convId == null) return;

    const id = String(convId);
    entry.messageSub?.unsubscribe?.();
    entry.actionsSub?.unsubscribe?.();
    entry.seenSub?.unsubscribe?.();
    entry.typingSub?.unsubscribe?.();

    entry.messageSub = client.subscribe(`/topic/conversation/${id}`, (frame) => {
        const data = parseBody(frame);
        if (data) entry.onMessage?.(data);
    });

    entry.actionsSub = client.subscribe(
        `/topic/conversation/${id}/actions-updated`,
        () => {
            entry.onActionsUpdated?.();
        }
    );

    entry.seenSub = client.subscribe(`/topic/conversation/${id}/seen`, (frame) => {
        const data = parseBody(frame);
        if (data) entry.onSeen?.(data);
    });

    entry.typingSub = client.subscribe(`/topic/conversation/${id}/typing`, (frame) => {
        const data = parseBody(frame);
        if (data) entry.onTyping?.(data);
    });
};

const fanOut = (entry, data) => {
    entry.listeners.forEach((listener) => {
        try {
            listener(data);
        } catch {
            // ignore listener errors
        }
    });
};

const subscribeInboxHandlers = (userId, entry) => {
    if (!client?.connected || userId == null) return;

    const id = String(userId);
    entry.sub?.unsubscribe?.();

    entry.sub = client.subscribe(`/topic/user/${id}/chat-inbox`, (frame) => {
        const data = parseBody(frame);
        if (data) fanOut(entry, data);
    });
};

const subscribeNotificationHandlers = (userId, entry) => {
    if (!client?.connected || userId == null) return;

    const id = String(userId);
    entry.sub?.unsubscribe?.();

    entry.sub = client.subscribe(`/topic/notifications/${id}`, (frame) => {
        const data = parseBody(frame);
        if (data) fanOut(entry, data);
    });
};

const resubscribeAll = () => {
    conversationHandlers.forEach((entry, convId) => {
        subscribeHandlers(convId, entry);
    });
    inboxHandlers.forEach((entry, userId) => {
        subscribeInboxHandlers(userId, entry);
    });
    notificationHandlers.forEach((entry, userId) => {
        subscribeNotificationHandlers(userId, entry);
    });
};

/**
 * Ensure a shared STOMP client is active (SockJS → `/ws`, JWT on CONNECT).
 */
export const ensureChatSocket = () => {
    if (client?.active) return client;

    client = new Client({
        webSocketFactory: () => new SockJS(getWsUrl()),
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        beforeConnect: () => {
            const auth = getAuth();
            client.connectHeaders = {
                Authorization: auth?.token ? `Bearer ${auth.token}` : '',
            };
        },
        onConnect: () => {
            notifyConnection(true);
            resubscribeAll();
        },
        onDisconnect: () => {
            notifyConnection(false);
        },
        onStompError: () => {
            notifyConnection(false);
        },
        onWebSocketClose: () => {
            notifyConnection(false);
        },
    });

    client.activate();
    return client;
};

export const isChatSocketConnected = () => connected;

export const onChatSocketConnectionChange = (listener) => {
    connectionListeners.add(listener);
    listener(connected);
    return () => connectionListeners.delete(listener);
};

/**
 * Subscribe to message + actions-updated + seen + typing topics for a conversation.
 * @returns {() => void} unsubscribe
 */
export const subscribeConversationRealtime = (conversationId, handlers = {}) => {
    if (conversationId == null) return () => {};

    const id = String(conversationId);
    ensureChatSocket();

    const entry = {
        onMessage: handlers.onMessage,
        onActionsUpdated: handlers.onActionsUpdated,
        onSeen: handlers.onSeen,
        onTyping: handlers.onTyping,
        messageSub: null,
        actionsSub: null,
        seenSub: null,
        typingSub: null,
    };
    conversationHandlers.set(id, entry);

    if (client?.connected) {
        subscribeHandlers(id, entry);
    }

    return () => {
        const current = conversationHandlers.get(id);
        if (current !== entry) return;
        current.messageSub?.unsubscribe?.();
        current.actionsSub?.unsubscribe?.();
        current.seenSub?.unsubscribe?.();
        current.typingSub?.unsubscribe?.();
        conversationHandlers.delete(id);
    };
};

/**
 * Publish typing indicator. Body: `{ typing: boolean }`.
 * Destination: `/app/chat/{convId}/typing`
 */
export const publishTyping = (conversationId, typing) => {
    if (conversationId == null) return false;
    ensureChatSocket();
    if (!client?.connected) return false;
    try {
        client.publish({
            destination: `/app/chat/${conversationId}/typing`,
            body: JSON.stringify({ typing: Boolean(typing) }),
        });
        return true;
    } catch {
        return false;
    }
};

/**
 * Send message over STOMP. Destination: `/app/chat/{convId}/send`
 * Body: `{ content, messageType, actionName? }` — BE broadcasts MessageDTO on topic.
 */
export const publishChatSend = (conversationId, body) => {
    if (conversationId == null || body == null) return false;
    ensureChatSocket();
    if (!client?.connected) return false;
    try {
        client.publish({
            destination: `/app/chat/${conversationId}/send`,
            body: JSON.stringify(body),
        });
        return true;
    } catch {
        return false;
    }
};

/**
 * Mark conversation read over STOMP. Destination: `/app/chat/{convId}/seen`
 */
export const publishSeen = (conversationId) => {
    if (conversationId == null) return false;
    ensureChatSocket();
    if (!client?.connected) return false;
    try {
        client.publish({
            destination: `/app/chat/${conversationId}/seen`,
            body: JSON.stringify({}),
        });
        return true;
    } catch {
        return false;
    }
};

/**
 * Subscribe to global inbox/badge updates for a user.
 * Topic: `/topic/user/{userId}/chat-inbox` (ConversationSummaryDTO).
 * @returns {() => void} unsubscribe
 */
export const subscribeUserChatInbox = (userId, onSummary) => {
    if (userId == null || typeof onSummary !== 'function') return () => {};

    const id = String(userId);
    ensureChatSocket();

    let entry = inboxHandlers.get(id);
    if (!entry) {
        entry = { listeners: new Set(), sub: null };
        inboxHandlers.set(id, entry);
        if (client?.connected) {
            subscribeInboxHandlers(id, entry);
        }
    }

    entry.listeners.add(onSummary);

    return () => {
        const current = inboxHandlers.get(id);
        if (!current) return;
        current.listeners.delete(onSummary);
        if (current.listeners.size > 0) return;
        current.sub?.unsubscribe?.();
        inboxHandlers.delete(id);
    };
};

/**
 * Subscribe to realtime notifications for a user.
 * Topic: `/topic/notifications/{userId}` (NotificationDTO).
 * @returns {() => void} unsubscribe
 */
export const subscribeUserNotifications = (userId, onNotification) => {
    if (userId == null || typeof onNotification !== 'function') return () => {};

    const id = String(userId);
    ensureChatSocket();

    let entry = notificationHandlers.get(id);
    if (!entry) {
        entry = { listeners: new Set(), sub: null };
        notificationHandlers.set(id, entry);
        if (client?.connected) {
            subscribeNotificationHandlers(id, entry);
        }
    }

    entry.listeners.add(onNotification);

    return () => {
        const current = notificationHandlers.get(id);
        if (!current) return;
        current.listeners.delete(onNotification);
        if (current.listeners.size > 0) return;
        current.sub?.unsubscribe?.();
        notificationHandlers.delete(id);
    };
};
