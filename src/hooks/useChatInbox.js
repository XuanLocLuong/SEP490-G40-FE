import { useCallback, useEffect, useState } from 'react';
import { fetchConversations } from '../apis/ChatApi.jsx';
import {
    conversationHasMessages,
    unwrapPageContent,
} from '../utils/chatDisplay.js';

export const useChatInbox = ({ enabled = false } = {}) => {
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
