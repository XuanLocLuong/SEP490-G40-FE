import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getAuth } from './Auth.jsx';

const getWsUrl = () => {
    const base = String(import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
    return `${base}/ws`;
};

/** @type {import('@stomp/stompjs').Client | null} */
let client = null;

/** @type {Map<string, { onMessage?: Function, onActionsUpdated?: Function, messageSub?: { unsubscribe: Function }, actionsSub?: { unsubscribe: Function } }>} */
const conversationHandlers = new Map();

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
};

const resubscribeAll = () => {
    conversationHandlers.forEach((entry, convId) => {
        subscribeHandlers(convId, entry);
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
 * Subscribe to message + actions-updated topics for a conversation.
 * @returns {() => void} unsubscribe
 */
export const subscribeConversationRealtime = (conversationId, handlers = {}) => {
    if (conversationId == null) return () => {};

    const id = String(conversationId);
    ensureChatSocket();

    const entry = {
        onMessage: handlers.onMessage,
        onActionsUpdated: handlers.onActionsUpdated,
        messageSub: null,
        actionsSub: null,
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
        conversationHandlers.delete(id);
    };
};
