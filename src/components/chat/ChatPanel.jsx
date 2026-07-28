import { useEffect, useState } from 'react';
import ChatConversationList from './ChatConversationList.jsx';
import ChatThread from './ChatThread.jsx';

/** Single conversation — rendered inside bottom-right dock (Messenger-style). */
export const ChatFloat = ({
    conversation,
    onClose,
    onBackToList,
    onThreadChanged,
    isFront = false,
    onBringToFront,
}) => {
    if (!conversation) return null;

    return (
        <div
            className={`chat-float${isFront ? ' chat-float--front' : ''}`}
            role="dialog"
            aria-label="Hội thoại"
            onPointerDownCapture={onBringToFront}
        >
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
export const ChatPicker = ({
    open,
    activeId,
    activeIds,
    conversations = [],
    loading = false,
    error = '',
    onReload,
    onSelect,
    onClose,
    isFront = false,
    onBringToFront,
}) => {
    const [search, setSearch] = useState('');
    const resolvedActiveIds = activeIds ?? (activeId != null ? [activeId] : []);

    useEffect(() => {
        if (open) onReload?.();
        else setSearch('');
    }, [open, onReload]);

    if (!open) return null;

    return (
        <div
            className={`chat-picker${isFront ? ' chat-picker--front' : ''}`}
            role="listbox"
            aria-label="Chọn cuộc trò chuyện"
            onPointerDownCapture={onBringToFront}
        >
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
                activeIds={resolvedActiveIds}
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
