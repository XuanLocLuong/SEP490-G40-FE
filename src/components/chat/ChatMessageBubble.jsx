import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/authContext.js';
import {
    canEditChatMessage,
    canRecallChatMessage,
    formatMessageTime,
    INVITE_GROUP_ACTIONS,
    isNotifyAction,
} from '../../utils/chatDisplay.js';
import ChatActionCard from './ChatActionCard.jsx';

const MessageMoreMenu = ({
    editable,
    recallable,
    busy,
    open,
    onOpenChange,
    onEdit,
    onRecall,
    align = 'end',
}) => {
    const rootRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;

        const onPointerDown = (event) => {
            if (rootRef.current && !rootRef.current.contains(event.target)) {
                onOpenChange(false);
            }
        };
        const onKeyDown = (event) => {
            if (event.key === 'Escape') onOpenChange(false);
        };

        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open, onOpenChange]);

    if (!editable && !recallable) return null;

    return (
        <div
            className={`chat-msg__more${align === 'start' ? ' chat-msg__more--start' : ''}`}
            ref={rootRef}
        >
            <button
                type="button"
                className="chat-msg__more-btn"
                aria-label="Thêm thao tác"
                aria-haspopup="menu"
                aria-expanded={open}
                disabled={busy}
                onClick={() => onOpenChange(!open)}
            >
                ⋯
            </button>
            {open ? (
                <div className="chat-msg__menu" role="menu">
                    {editable ? (
                        <button
                            type="button"
                            role="menuitem"
                            className="chat-msg__menu-item"
                            disabled={busy}
                            onClick={() => {
                                onOpenChange(false);
                                onEdit?.();
                            }}
                        >
                            Sửa
                        </button>
                    ) : null}
                    {recallable ? (
                        <button
                            type="button"
                            role="menuitem"
                            className="chat-msg__menu-item chat-msg__menu-item--danger"
                            disabled={busy}
                            onClick={() => {
                                onOpenChange(false);
                                onRecall?.();
                            }}
                        >
                            Thu hồi
                        </button>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
};

const ChatMessageBubble = ({
    message,
    onEdit,
    onRecall,
    mutating = false,
}) => {
    const { auth } = useAuth();
    const [editing, setEditing] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [draft, setDraft] = useState(message?.content || '');
    const [saving, setSaving] = useState(false);

    const mine =
        message.senderId != null &&
        Number(message.senderId) === Number(auth?.userId ?? auth?.id);
    const deleted = Boolean(message.deleted);
    const isAction = message.messageType === 'ACTION' && message.actionName;
    const actionName = message.actionName;
    const editable = mine && canEditChatMessage(message);
    const recallable = mine && canRecallChatMessage(message);
    const busy = Boolean(mutating || saving);
    const showMenu = editable || recallable;

    useEffect(() => {
        if (!editing) setDraft(message?.content || '');
    }, [message?.content, editing]);

    useEffect(() => {
        setMenuOpen(false);
    }, [message?.id, deleted]);

    const handleSaveEdit = async () => {
        const text = String(draft || '').trim();
        if (!text || text === message.content || !onEdit) {
            setEditing(false);
            return;
        }
        setSaving(true);
        try {
            const ok = await onEdit(message.id, text);
            if (ok !== false) setEditing(false);
        } finally {
            setSaving(false);
        }
    };

    const handleRecall = () => {
        if (!onRecall || busy) return;
        onRecall(message.id);
    };

    const menu = showMenu ? (
        <MessageMoreMenu
            editable={editable}
            recallable={recallable}
            busy={busy}
            open={menuOpen}
            onOpenChange={setMenuOpen}
            align="start"
            onEdit={() => setEditing(true)}
            onRecall={handleRecall}
        />
    ) : null;

    // Recalled: same placeholder for TEXT / ACTION / NOTIFY
    if (deleted) {
        return (
            <div className={`chat-msg${mine ? ' chat-msg--mine' : ''}`}>
                <div className="chat-msg__bubble chat-msg__bubble--deleted">
                    Tin nhắn đã bị thu hồi
                </div>
                <span className="chat-msg__meta">{formatMessageTime(message.createdAt)}</span>
            </div>
        );
    }

    // Notify group: centered system banner (distinct from chat bubbles)
    if (isAction && isNotifyAction(actionName)) {
        return (
            <div className="chat-msg chat-msg--system">
                <div className="chat-msg__system" role="status">
                    <span className="chat-msg__system-label">Thông báo</span>
                    <p className="chat-msg__system-body">
                        {message.content || 'Thông báo hệ thống'}
                    </p>
                </div>
                <span className="chat-msg__meta">{formatMessageTime(message.createdAt)}</span>
            </div>
        );
    }

    // Invite-group: info card in history; buttons live in bottom sticky dock
    if (isAction && INVITE_GROUP_ACTIONS.has(actionName)) {
        return (
            <div className={`chat-msg chat-msg--action${mine ? ' chat-msg--mine' : ''}`}>
                <div className="chat-msg__row">
                    {menu}
                    <ChatActionCard
                        actionName={actionName}
                        body={message.content || ''}
                        hideActions
                        disabled={Boolean(message.actionDisabled)}
                    />
                </div>
                <span className="chat-msg__meta">{formatMessageTime(message.createdAt)}</span>
            </div>
        );
    }

    // Other ACTION types (decision messages if ever stored): show content as text
    if (isAction) {
        return (
            <div className={`chat-msg${mine ? ' chat-msg--mine' : ''}`}>
                <div className="chat-msg__row">
                    {menu}
                    <div className="chat-msg__bubble">
                        {message.content || actionName}
                    </div>
                </div>
                <span className="chat-msg__meta">{formatMessageTime(message.createdAt)}</span>
            </div>
        );
    }

    if (editing) {
        return (
            <div className={`chat-msg chat-msg--mine chat-msg--editing`}>
                <textarea
                    className="chat-msg__edit-input"
                    rows={3}
                    value={draft}
                    disabled={busy}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                            e.preventDefault();
                            setEditing(false);
                            setDraft(message.content || '');
                        }
                    }}
                    autoFocus
                />
                <div className="chat-msg__edit-actions">
                    <button
                        type="button"
                        className="chat-msg__action-btn"
                        disabled={busy}
                        onClick={() => {
                            setEditing(false);
                            setDraft(message.content || '');
                        }}
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        className="chat-msg__action-btn chat-msg__action-btn--primary"
                        disabled={busy || !String(draft || '').trim()}
                        onClick={handleSaveEdit}
                    >
                        {busy ? 'Đang lưu…' : 'Lưu'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`chat-msg${mine ? ' chat-msg--mine' : ''}`}>
            <div className="chat-msg__row">
                {menu}
                <div className="chat-msg__bubble">{message.content}</div>
            </div>
            <span className="chat-msg__meta">
                {formatMessageTime(message.createdAt)}
                {message.editedAt ? ' · đã chỉnh sửa' : ''}
                {mine && message.readAt ? ' · Đã xem' : ''}
            </span>
        </div>
    );
};

export default ChatMessageBubble;
