import { useCallback, useEffect, useRef, useState } from 'react';
import {
    fetchConversationActions,
    fetchMessages,
    markConversationRead,
    sendMessage,
} from '../apis/ChatApi.jsx';
import { filterChatUiActions, unwrapData } from '../utils/chatDisplay.js';
import {
    isChatSocketConnected,
    onChatSocketConnectionChange,
    subscribeConversationRealtime,
} from '../utils/chatSocket.js';

const PAGE_SIZE = 30;
const POLL_CONNECTED_MS = 30000;
const POLL_DISCONNECTED_MS = 8000;
const ACTIONS_DEBOUNCE_MS = 300;

const upsertMessage = (prev, msg) => {
    if (msg?.id == null) return prev;
    const idx = prev.findIndex((m) => m.id === msg.id);
    if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...msg };
        return next;
    }
    return [...prev, msg].sort((a, b) => a.id - b.id);
};

export const useChatThread = (conversationId) => {
    const [messages, setMessages] = useState([]);
    const [actions, setActions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [sending, setSending] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [error, setError] = useState('');
    const [socketConnected, setSocketConnected] = useState(() => isChatSocketConnected());
    const pollRef = useRef(null);
    const actionsDebounceRef = useRef(null);
    const loadActionsRef = useRef(null);

    const loadActions = useCallback(async () => {
        if (conversationId == null) return;
        try {
            const res = await fetchConversationActions(conversationId);
            const data = unwrapData(res);
            const list = data?.availableActions ?? data ?? [];
            setActions(filterChatUiActions(list));
        } catch {
            setActions([]);
        }
    }, [conversationId]);

    loadActionsRef.current = loadActions;

    const scheduleReloadActions = useCallback(() => {
        if (actionsDebounceRef.current) {
            window.clearTimeout(actionsDebounceRef.current);
        }
        actionsDebounceRef.current = window.setTimeout(() => {
            loadActionsRef.current?.();
        }, ACTIONS_DEBOUNCE_MS);
    }, []);

    const loadInitial = useCallback(async () => {
        if (conversationId == null) return;
        setLoading(true);
        setError('');
        setMessages([]);
        try {
            const [msgRes] = await Promise.all([
                fetchMessages(conversationId, { size: PAGE_SIZE }),
                markConversationRead(conversationId).catch(() => null),
            ]);
            const list = unwrapData(msgRes);
            const content = Array.isArray(list) ? list : [];
            setMessages(content);
            setHasMore(content.length >= PAGE_SIZE);
            await loadActions();
        } catch {
            setError('Không thể tải tin nhắn.');
            setMessages([]);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    }, [conversationId, loadActions]);

    const loadOlder = useCallback(async () => {
        if (conversationId == null || loadingMore || !hasMore || messages.length === 0) {
            return;
        }
        const beforeId = messages[0]?.id;
        if (beforeId == null) return;

        setLoadingMore(true);
        try {
            const res = await fetchMessages(conversationId, {
                beforeId,
                size: PAGE_SIZE,
            });
            const older = unwrapData(res);
            const list = Array.isArray(older) ? older : [];
            setMessages((prev) => {
                const seen = new Set(prev.map((m) => m.id));
                const merged = list.filter((m) => !seen.has(m.id));
                return [...merged, ...prev];
            });
            setHasMore(list.length >= PAGE_SIZE);
        } catch {
            setError('Không thể tải thêm tin nhắn.');
        } finally {
            setLoadingMore(false);
        }
    }, [conversationId, hasMore, loadingMore, messages]);

    const refreshLatest = useCallback(async () => {
        if (conversationId == null) return;
        try {
            const res = await fetchMessages(conversationId, { size: PAGE_SIZE });
            const list = unwrapData(res);
            const content = Array.isArray(list) ? list : [];
            setMessages((prev) => {
                if (prev.length === 0) return content;
                const oldestKept = prev[0]?.id;
                const older = prev.filter((m) => content.every((n) => n.id !== m.id));
                const merged = [...older, ...content].sort((a, b) => a.id - b.id);
                if (oldestKept != null && !merged.some((m) => m.id === oldestKept)) {
                    return content;
                }
                return merged;
            });
            await loadActions();
        } catch {
            // silent poll failure
        }
    }, [conversationId, loadActions]);

    const sendText = useCallback(
        async (content) => {
            const text = String(content || '').trim();
            if (!text || conversationId == null || sending) return null;
            setSending(true);
            try {
                const res = await sendMessage(conversationId, {
                    content: text,
                    messageType: 'TEXT',
                });
                const created = unwrapData(res);
                if (created?.id) {
                    setMessages((prev) => upsertMessage(prev, created));
                } else {
                    await refreshLatest();
                }
                return created;
            } catch {
                setError('Không gửi được tin nhắn.');
                return null;
            } finally {
                setSending(false);
            }
        },
        [conversationId, refreshLatest, sending]
    );

    useEffect(() => {
        return onChatSocketConnectionChange(setSocketConnected);
    }, []);

    useEffect(() => {
        if (conversationId == null) {
            setMessages([]);
            setActions([]);
            return undefined;
        }

        loadInitial();

        const unsubscribe = subscribeConversationRealtime(conversationId, {
            onMessage: (msg) => {
                setMessages((prev) => upsertMessage(prev, msg));
            },
            onActionsUpdated: () => {
                scheduleReloadActions();
            },
        });

        const startPoll = () => {
            if (pollRef.current) window.clearInterval(pollRef.current);
            const interval = isChatSocketConnected()
                ? POLL_CONNECTED_MS
                : POLL_DISCONNECTED_MS;
            pollRef.current = window.setInterval(refreshLatest, interval);
        };
        startPoll();

        const stopListenConn = onChatSocketConnectionChange(() => {
            startPoll();
        });

        return () => {
            unsubscribe();
            stopListenConn();
            if (pollRef.current) window.clearInterval(pollRef.current);
            if (actionsDebounceRef.current) {
                window.clearTimeout(actionsDebounceRef.current);
            }
        };
    }, [conversationId, loadInitial, refreshLatest, scheduleReloadActions]);

    return {
        messages,
        actions,
        loading,
        loadingMore,
        sending,
        hasMore,
        error,
        socketConnected,
        loadOlder,
        sendText,
        reloadThread: loadInitial,
        reloadActions: loadActions,
    };
};
