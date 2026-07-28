import { useCallback, useEffect, useState } from 'react';
import { fetchConversations } from '../apis/ChatApi.jsx';
import { useAuth } from '../contexts/authContext.js';
import {
    conversationHasMessages,
    unwrapPageContent,
} from '../utils/chatDisplay.js';
import { subscribeUserChatInbox } from '../utils/chatSocket.js';

const upsertConversation = (list, summary) => {
    if (!summary?.id) return list;

    const next = list.filter((c) => String(c.id) !== String(summary.id));
    if (conversationHasMessages(summary)) {
        next.unshift(summary);
    }

    next.sort((a, b) => {
        const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return tb - ta;
    });

    return next;
};

export const useChatInbox = ({ enabled = false } = {}) => {
    const { auth } = useAuth();
    const userId = auth?.userId ?? auth?.id ?? null;
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const loadInbox = useCallback(async () => {
        if (!enabled) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetchConversations({ page: 0, size: 50 });
            // Hide empty threads in inbox; open via Chat buttons still works.
            setConversations(
                unwrapPageContent(res).filter(conversationHasMessages)
            );
        } catch {
            setError('Không thể tải danh sách tin nhắn.');
            setConversations([]);
        } finally {
            setLoading(false);
        }
    }, [enabled]);

    useEffect(() => {
        if (!enabled) return undefined;
        loadInbox();
        return undefined;
    }, [enabled, loadInbox]);

    // Keep badge + list live via BE `/topic/user/{userId}/chat-inbox`.
    useEffect(() => {
        if (!enabled || userId == null) return undefined;

        return subscribeUserChatInbox(userId, (summary) => {
            setConversations((prev) => upsertConversation(prev, summary));
        });
    }, [enabled, userId]);

    const totalUnread = conversations.reduce(
        (sum, c) => sum + (Number(c.unreadCount) || 0),
        0
    );

    return {
        conversations,
        loading,
        error,
        totalUnread,
        reloadInbox: loadInbox,
        setConversations,
    };
};
