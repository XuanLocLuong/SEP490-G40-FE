import {
    formatChatListTime,
    getInitials,
    previewLastMessage,
} from '../../utils/chatDisplay.js';

const ChatConversationList = ({
    conversations,
    activeId,
    activeIds,
    loading,
    error,
    search,
    onSearchChange,
    onSelect,
    hideTitle = false,
}) => {
    const openIds = new Set(
        (activeIds ?? (activeId != null ? [activeId] : [])).map(String)
    );
    const q = search.trim().toLowerCase();
    const filtered = q
        ? conversations.filter((c) => {
              const hay = `${c.otherPartyName || ''} ${c.jobTitle || ''} ${c.businessName || ''}`.toLowerCase();
              return hay.includes(q);
          })
        : conversations;

    return (
        <aside className="chat-panel__inbox">
            <div className="chat-panel__inbox-head">
                {!hideTitle ? (
                    <h2 className="chat-panel__inbox-title">Tin nhắn</h2>
                ) : null}
                <label className="chat-panel__search">
                    <span className="chat-panel__search-icon" aria-hidden="true">
                        ⌕
                    </span>
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Tìm cuộc trò chuyện..."
                    />
                </label>
            </div>

            <div className="chat-panel__inbox-body">
                {loading && conversations.length === 0 && (
                    <p className="chat-panel__state">Đang tải...</p>
                )}
                {!loading && error && conversations.length === 0 && (
                    <p className="chat-panel__state chat-panel__state--error">{error}</p>
                )}
                {!loading && !error && filtered.length === 0 && (
                    <p className="chat-panel__state">Chưa có cuộc trò chuyện.</p>
                )}

                <ul className="chat-panel__conv-list">
                    {filtered.map((conv) => {
                        const active = openIds.has(String(conv.id));
                        const unread = Number(conv.unreadCount) > 0;
                        return (
                            <li key={conv.id}>
                                <button
                                    type="button"
                                    className={`chat-panel__conv${active ? ' chat-panel__conv--active' : ''}${unread ? ' chat-panel__conv--unread' : ''}`}
                                    onClick={() => onSelect(conv)}
                                >
                                    <span className="chat-panel__avatar" aria-hidden="true">
                                        {conv.otherPartyAvatar ? (
                                            <img src={conv.otherPartyAvatar} alt="" />
                                        ) : (
                                            getInitials(conv.otherPartyName)
                                        )}
                                    </span>
                                    <span className="chat-panel__conv-main">
                                        <span className="chat-panel__conv-top">
                                            <span className="chat-panel__conv-name">
                                                {conv.otherPartyName || 'Người dùng'}
                                            </span>
                                            <span className="chat-panel__conv-time">
                                                {formatChatListTime(conv.lastMessageAt)}
                                            </span>
                                        </span>
                                        {conv.jobTitle ? (
                                            <span className="chat-panel__conv-job" title={conv.jobTitle}>
                                                Việc làm: {conv.jobTitle}
                                            </span>
                                        ) : null}
                                        <span className="chat-panel__conv-preview">
                                            {previewLastMessage(conv)}
                                        </span>
                                    </span>
                                    {unread ? (
                                        <span className="chat-panel__unread-dot" aria-hidden="true" />
                                    ) : null}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </aside>
    );
};

export default ChatConversationList;
