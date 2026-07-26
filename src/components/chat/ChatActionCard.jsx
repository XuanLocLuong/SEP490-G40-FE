import { getActionCardCopy } from '../../utils/chatDisplay.js';

const ChatActionCard = ({ actionName, busy, onAction }) => {
    const copy = getActionCardCopy(actionName);

    return (
        <div className="chat-action-card">
            <p className="chat-action-card__title">{copy.title}</p>
            {copy.body ? <p className="chat-action-card__body">{copy.body}</p> : null}
            <button
                type="button"
                className="chat-action-card__cta"
                disabled={busy}
                onClick={() => onAction?.(actionName)}
            >
                {busy ? 'Đang xử lý...' : copy.cta}
            </button>
        </div>
    );
};

export default ChatActionCard;
