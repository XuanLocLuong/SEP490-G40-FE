import { useCallback, useEffect, useRef, useState } from 'react';
import {
    editMessage,
    fetchConversationActions,
    fetchMessages,
    markConversationRead,
    recallMessage,
    sendMessage,
} from '../apis/ChatApi.jsx';
import { filterChatUiActions, unwrapData } from '../utils/chatDisplay.js';
import { getAuth } from '../utils/Auth.jsx';
import {
    isChatSocketConnected,
    onChatSocketConnectionChange,
    publishChatSend,
    publishSeen,
    publishTyping,
    subscribeConversationRealtime,
} from '../utils/chatSocket.js';

const PAGE_SIZE = 30;
const POLL_CONNECTED_MS = 30000;
const POLL_DISCONNECTED_MS = 8000;
const ACTIONS_DEBOUNCE_MS = 300;
const TYPING_IDLE_MS = 500;
const TYPING_TRUE_THROTTLE_MS = 1500;
const PEER_TYPING_HOLD_MS = 4000;
const WS_SEND_ECHO_MS = 1500;

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

/** Apply SeenEventDTO: mark unread messages from the other party as read. */
const applySeenEvent = (prev, event) => {
    const seenByUserId = event?.seenByUserId;
    const readAt = event?.readAt || new Date().toISOString();
    if (seenByUserId == null) return prev;

    let changed = false;
    const next = prev.map((m) => {
        // Peer read our messages: sender !== seenByUserId
        if (
            m.senderId != null &&
            Number(m.senderId) !== Number(seenByUserId) &&
            !m.readAt
        ) {
            changed = true;
            return { ...m, readAt };
        }
        return m;
    });
    return changed ? next : prev;
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
    const [peerTyping, setPeerTyping] = useState(false);
    const pollRef = useRef(null);
    const actionsDebounceRef = useRef(null);
    const loadActionsRef = useRef(null);
    const markReadDebounceRef = useRef(null);
    const typingIdleRef = useRef(null);
    const peerTypingHoldRef = useRef(null);
    const lastTypingTrueAtRef = useRef(0);
    const typingActiveRef = useRef(false);
    const echoWaiterRef = useRef(null);

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

    const markReadNow = useCallback(
        (convId = conversationId) => {
            if (convId == null) return;
            if (publishSeen(convId)) return;
            markConversationRead(convId).catch(() => null);
        },
        [conversationId]
    );

    const scheduleMarkRead = useCallback(() => {
        if (conversationId == null) return;
        if (markReadDebounceRef.current) {
            window.clearTimeout(markReadDebounceRef.current);
        }
        markReadDebounceRef.current = window.setTimeout(() => {
            markReadNow(conversationId);
        }, 400);
    }, [conversationId, markReadNow]);

    const waitForSendEcho = useCallback((predicate, timeoutMs = WS_SEND_ECHO_MS) => {
        return new Promise((resolve) => {
            let settled = false;
            const finish = (value) => {
                if (settled) return;
                settled = true;
                if (echoWaiterRef.current === onMsg) {
                    echoWaiterRef.current = null;
                }
                window.clearTimeout(timer);
                resolve(value);
            };
            const onMsg = (msg) => {
                try {
                    if (predicate(msg)) finish(msg);
                } catch {
                    // ignore predicate errors
                }
            };
            echoWaiterRef.current = onMsg;
            const timer = window.setTimeout(() => finish(null), timeoutMs);
        });
    }, []);

    const scheduleReloadActions = useCallback(() => {
        if (actionsDebounceRef.current) {
            window.clearTimeout(actionsDebounceRef.current);
        }
        actionsDebounceRef.current = window.setTimeout(() => {
            loadActionsRef.current?.();
        }, ACTIONS_DEBOUNCE_MS);
    }, []);

    const stopTyping = useCallback(() => {
        if (typingIdleRef.current) {
            window.clearTimeout(typingIdleRef.current);
            typingIdleRef.current = null;
        }
        if (!typingActiveRef.current) return;
        typingActiveRef.current = false;
        if (conversationId != null) {
            publishTyping(conversationId, false);
        }
    }, [conversationId]);

    const notifyTyping = useCallback(() => {
        if (conversationId == null) return;

        const now = Date.now();
        if (
            !typingActiveRef.current ||
            now - lastTypingTrueAtRef.current >= TYPING_TRUE_THROTTLE_MS
        ) {
            typingActiveRef.current = true;
            lastTypingTrueAtRef.current = now;
            publishTyping(conversationId, true);
        }

        if (typingIdleRef.current) {
            window.clearTimeout(typingIdleRef.current);
        }
        typingIdleRef.current = window.setTimeout(() => {
            typingIdleRef.current = null;
            stopTyping();
        }, TYPING_IDLE_MS);
    }, [conversationId, stopTyping]);

    const loadInitial = useCallback(async () => {
        if (conversationId == null) return;
        setLoading(true);
        setError('');
        setMessages([]);
        try {
            const [msgRes] = await Promise.all([
                fetchMessages(conversationId, { size: PAGE_SIZE }),
                Promise.resolve().then(() => markReadNow(conversationId)),
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
    }, [conversationId, loadActions, markReadNow]);

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
            stopTyping();
            setSending(true);
            try {
                const body = { content: text, messageType: 'TEXT' };
                if (publishChatSend(conversationId, body)) {
                    const me = getAuth()?.userId ?? getAuth()?.id;
                    const echoed = await waitForSendEcho((msg) => {
                        if (msg?.deleted) return false;
                        if (msg?.messageType && msg.messageType !== 'TEXT') return false;
                        if (String(msg?.content ?? '') !== text) return false;
                        if (me != null && msg?.senderId != null) {
                            return Number(msg.senderId) === Number(me);
                        }
                        return true;
                    });
                    if (echoed?.id) {
                        setMessages((prev) => upsertMessage(prev, echoed));
                        return echoed;
                    }
                }

                const res = await sendMessage(conversationId, body);
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
        [conversationId, refreshLatest, sending, stopTyping, waitForSendEcho]
    );

    const editTextMessage = useCallback(async (messageId, content) => {
        const text = String(content || '').trim();
        if (messageId == null || !text) return null;
        const res = await editMessage(messageId, { content: text });
        const updated = unwrapData(res);
        if (updated?.id) {
            setMessages((prev) => upsertMessage(prev, updated));
        }
        return updated;
    }, []);

    const recallMessageById = useCallback(async (messageId) => {
        if (messageId == null) return false;
        await recallMessage(messageId);
        setMessages((prev) =>
            prev.map((m) =>
                m.id === messageId
                    ? { ...m, deleted: true, content: null }
                    : m
            )
        );
        return true;
    }, []);

    useEffect(() => {
        return onChatSocketConnectionChange(setSocketConnected);
    }, []);

    useEffect(() => {
        if (conversationId == null) {
            setMessages([]);
            setActions([]);
            setPeerTyping(false);
            return undefined;
        }

        setPeerTyping(false);
        loadInitial();

        const unsubscribe = subscribeConversationRealtime(conversationId, {
            onMessage: (msg) => {
                echoWaiterRef.current?.(msg);
                setMessages((prev) => upsertMessage(prev, msg));
                const me = getAuth()?.userId ?? getAuth()?.id;
                // Peer sent a new message while this thread is open → mark read so they see "Đã xem".
                if (
                    me != null &&
                    msg?.senderId != null &&
                    Number(msg.senderId) !== Number(me)
                ) {
                    scheduleMarkRead();
                    setPeerTyping(false);
                    if (peerTypingHoldRef.current) {
                        window.clearTimeout(peerTypingHoldRef.current);
                        peerTypingHoldRef.current = null;
                    }
                }
            },
            onActionsUpdated: () => {
                scheduleReloadActions();
            },
            onSeen: (event) => {
                const me = getAuth()?.userId ?? getAuth()?.id;
                // Ignore own seen echo; only update when the peer marks read.
                if (me != null && Number(event?.seenByUserId) === Number(me)) {
                    return;
                }
                setMessages((prev) => applySeenEvent(prev, event));
            },
            onTyping: (event) => {
                const me = getAuth()?.userId ?? getAuth()?.id;
                if (me != null && Number(event?.userId) === Number(me)) {
                    return;
                }
                const isTyping = Boolean(event?.typing);
                setPeerTyping(isTyping);
                if (peerTypingHoldRef.current) {
                    window.clearTimeout(peerTypingHoldRef.current);
                    peerTypingHoldRef.current = null;
                }
                // Safety: hide indicator if peer never sends typing:false
                if (isTyping) {
                    peerTypingHoldRef.current = window.setTimeout(() => {
                        setPeerTyping(false);
                        peerTypingHoldRef.current = null;
                    }, PEER_TYPING_HOLD_MS);
                }
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
            stopTyping();
            unsubscribe();
            stopListenConn();
            if (pollRef.current) window.clearInterval(pollRef.current);
            if (actionsDebounceRef.current) {
                window.clearTimeout(actionsDebounceRef.current);
            }
            if (markReadDebounceRef.current) {
                window.clearTimeout(markReadDebounceRef.current);
            }
            if (peerTypingHoldRef.current) {
                window.clearTimeout(peerTypingHoldRef.current);
            }
            echoWaiterRef.current = null;
            setPeerTyping(false);
        };
    }, [
        conversationId,
        loadInitial,
        refreshLatest,
        scheduleReloadActions,
        scheduleMarkRead,
        stopTyping,
    ]);

    return {
        messages,
        actions,
        loading,
        loadingMore,
        sending,
        hasMore,
        error,
        socketConnected,
        peerTyping,
        notifyTyping,
        stopTyping,
        loadOlder,
        sendText,
        editTextMessage,
        recallMessageById,
        reloadThread: loadInitial,
        reloadActions: loadActions,
    };
};
