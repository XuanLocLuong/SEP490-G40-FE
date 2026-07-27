import { useEffect, useState } from 'react';
import { useChatInbox } from '../../hooks/useChatInbox.js';
import ChatConversationList from './ChatConversationList.jsx';
import ChatThread from './ChatThread.jsx';

/** Single conversation — rendered inside bottom-right dock (Messenger-style). */
export const ChatFloat = ({ conversation, onClose, onBackToList, onThreadChanged }) => {
    if (!conversation) return null;

    return (
        <div className="chat-float" role="dialog" aria-label="Hội thoại">
            <div className="chat-float__chrome">
                <button
                    type="button"
                    className="chat-float__chrome-btn"
                    onClick={onBackToList}
                    aria-label="Danh sách hội thoại"
                    title="Đổi cuộc trò chuyện"
                >
                    ‹
                </button>
                <span className="chat-float__chrome-title">
                    {conversation.otherPartyName || 'Tin nhắn'}
                </span>
                <button
                    type="button"
                    className="chat-float__chrome-btn"
                    onClick={onClose}
                    aria-label="Đóng"
                >
                    ×
                </button>
            </div>
            <ChatThread
                conversation={conversation}
                compact
                onThreadChanged={onThreadChanged}
            />
        </div>
    );
};

/** Conversation list — same bottom-right dock, before picking a person. */
export const ChatPicker = ({ open, activeId, onSelect, onClose }) => {
    const [search, setSearch] = useState('');
    const { conversations, loading, error, reloadInbox } = useChatInbox({
        enabled: open,
    });

    useEffect(() => {
        if (open) reloadInbox();
        else setSearch('');
    }, [open, reloadInbox]);

    if (!open) return null;

    return (
        <div className="chat-picker" role="listbox" aria-label="Chọn cuộc trò chuyện">
            <div className="chat-picker__head">
                <h2 className="chat-picker__title">Tin nhắn</h2>
                <button
                    type="button"
                    className="chat-picker__close"
                    onClick={onClose}
                    aria-label="Đóng"
                >
                    ×
                </button>
            </div>
            <ChatConversationList
                conversations={conversations}
                activeId={activeId}
                loading={loading}
                error={error}
                search={search}
                onSearchChange={setSearch}
                onSelect={onSelect}
                hideTitle
            />
        </div>
    );
};
