import { useAuth } from '../../contexts/authContext.js';
import {
    formatMessageTime,
    INVITE_GROUP_ACTIONS,
    isNotifyAction,
} from '../../utils/chatDisplay.js';
import ChatActionCard from './ChatActionCard.jsx';

const ChatMessageBubble = ({ message }) => {
    const { auth } = useAuth();
    const mine =
        message.senderId != null &&
        Number(message.senderId) === Number(auth?.userId ?? auth?.id);
    const deleted = Boolean(message.deleted);
    const isAction = message.messageType === 'ACTION' && message.actionName;
    const actionName = message.actionName;

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
                <ChatActionCard
                    actionName={actionName}
                    body={message.content || ''}
                    hideActions
                    disabled={Boolean(message.actionDisabled)}
                />
                <span className="chat-msg__meta">{formatMessageTime(message.createdAt)}</span>
            </div>
        );
    }

    // Other ACTION types (decision messages if ever stored): show content as text
    if (isAction) {
        return (
            <div className={`chat-msg${mine ? ' chat-msg--mine' : ''}`}>
                <div className="chat-msg__bubble">
                    {message.content || actionName}
                </div>
                <span className="chat-msg__meta">{formatMessageTime(message.createdAt)}</span>
            </div>
        );
    }

    return (
        <div className={`chat-msg${mine ? ' chat-msg--mine' : ''}`}>
            <div className={`chat-msg__bubble${deleted ? ' chat-msg__bubble--deleted' : ''}`}>
                {deleted ? 'Tin nhắn đã bị thu hồi' : message.content}
            </div>
            <span className="chat-msg__meta">
                {formatMessageTime(message.createdAt)}
                {message.editedAt && !deleted ? ' · đã chỉnh sửa' : ''}
                {mine && message.readAt ? ' · Đã xem' : ''}
            </span>
        </div>
    );
};

export default ChatMessageBubble;
