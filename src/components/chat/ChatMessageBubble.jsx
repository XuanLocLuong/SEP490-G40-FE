import { useAuth } from '../../contexts/authContext.js';
import { formatMessageTime } from '../../utils/chatDisplay.js';
import { CHAT_UI_ACTIONS } from '../../utils/chatDisplay.js';
import ChatActionCard from './ChatActionCard.jsx';

const ChatMessageBubble = ({ message, onAction, actionBusy }) => {
    const { auth } = useAuth();
    const mine = message.senderId != null && Number(message.senderId) === Number(auth?.userId ?? auth?.id);
    const deleted = Boolean(message.deleted);
    const isAction = message.messageType === 'ACTION' && message.actionName;

    if (isAction && !CHAT_UI_ACTIONS.has(message.actionName)) {
        // Hidden in UI per product scope (INVITE / ACCEPT_APPLICATION stay out of chat)
        return null;
    }

    if (isAction && CHAT_UI_ACTIONS.has(message.actionName)) {
        return (
            <div className={`chat-msg chat-msg--action${mine ? ' chat-msg--mine' : ''}`}>
                <ChatActionCard
                    actionName={message.actionName}
                    busy={actionBusy}
                    onAction={onAction}
                />
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
