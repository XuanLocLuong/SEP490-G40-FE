import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChatIcon } from '../common/icons.jsx';
import { OPEN_CHAT_PANEL_EVENT } from '../../utils/chatEvents.js';
import { ChatFloat, ChatPicker, useChatFloatState } from './ChatPanel.jsx';
import '../../assets/styles/ChatPanelStyle.css';

const ChatBell = () => {
    const dockRef = useRef(null);
    const {
        pickerOpen,
        setPickerOpen,
        activeConv,
        totalUnread,
        reloadInbox,
        openPicker,
        selectConversation,
        closeFloat,
        backToList,
        floatOpen,
    } = useChatFloatState();

    const dockOpen = pickerOpen || floatOpen;

    useEffect(() => {
        const handleOpenEvent = () => openPicker();
        window.addEventListener(OPEN_CHAT_PANEL_EVENT, handleOpenEvent);
        return () => window.removeEventListener(OPEN_CHAT_PANEL_EVENT, handleOpenEvent);
    }, [openPicker]);

    useEffect(() => {
        if (!dockOpen) return undefined;

        const handlePointerDown = (event) => {
            const inDock = dockRef.current?.contains(event.target);
            const onTrigger = event.target.closest?.('.chat-bell__trigger');
            if (!inDock && !onTrigger) {
                setPickerOpen(false);
                if (floatOpen) closeFloat();
            }
        };
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                if (floatOpen) closeFloat();
                else setPickerOpen(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [dockOpen, floatOpen, closeFloat, setPickerOpen]);

    const badge =
        totalUnread > 99 ? '99+' : totalUnread > 0 ? String(totalUnread) : '';

    const dock = dockOpen
        ? createPortal(
              <div className="chat-dock" ref={dockRef}>
                  {activeConv ? (
                      <ChatFloat
                          conversation={activeConv}
                          onClose={closeFloat}
                          onBackToList={backToList}
                          onThreadChanged={reloadInbox}
                      />
                  ) : (
                      <ChatPicker
                          open={pickerOpen}
                          activeId={null}
                          onSelect={selectConversation}
                          onClose={() => setPickerOpen(false)}
                      />
                  )}
              </div>,
              document.body
          )
        : null;

    return (
        <>
            <div className="chat-bell">
                <button
                    type="button"
                    className="site-header__icon-btn chat-bell__trigger"
                    aria-label="Tin nhắn"
                    aria-expanded={dockOpen}
                    onClick={() => {
                        if (dockOpen) {
                            setPickerOpen(false);
                            closeFloat();
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
            {dock}
        </>
    );
};

export default ChatBell;
