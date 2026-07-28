import { ChatIcon } from '../common/icons.jsx';
import { useChat } from '../../contexts/chatContext.js';
import '../../assets/styles/ChatPanelStyle.css';

/** Header trigger only — dock lives in ChatProvider so it survives layout switches. */
const ChatBell = () => {
    const {
        chatEnabled,
        dockOpen,
        pickerOpen,
        totalUnread,
        openPicker,
        setPickerOpen,
    } = useChat();

    if (!chatEnabled) return null;

    const badge =
        totalUnread > 99 ? '99+' : totalUnread > 0 ? String(totalUnread) : '';

    return (
        <div className="chat-bell">
            <button
                type="button"
                className="site-header__icon-btn chat-bell__trigger"
                aria-label="Tin nhắn"
                aria-expanded={dockOpen}
                onClick={() => {
                    // Toggle inbox only — do not close open chat floats (desktop).
                    if (pickerOpen) {
                        setPickerOpen(false);
                        return;
                    }
                    openPicker();
                }}
            >
                <ChatIcon />
                {badge ? (
                    <span className="chat-bell__badge" aria-hidden="true">
                        {badge}
                    </span>
                ) : null}
            </button>
        </div>
    );
};

export default ChatBell;
