import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from './authContext.js';
import { ChatContext } from './chatContext.js';
import { USER_ROLES } from '../utils/Constants.jsx';
import { OPEN_CHAT_PANEL_EVENT } from '../utils/chatEvents.js';
import { useChatInbox } from '../hooks/useChatInbox.js';
import { ChatFloat, ChatPicker } from '../components/chat/ChatPanel.jsx';
import '../assets/styles/ChatPanelStyle.css';

const CHAT_ROLES = new Set([USER_ROLES.CANDIDATE, USER_ROLES.RECRUITER]);

const ChatDockHost = ({
    enabled,
    pickerOpen,
    setPickerOpen,
    activeConv,
    selectConversation,
    closeFloat,
    backToList,
    reloadInbox,
    floatOpen,
}) => {
    const dockOpen = pickerOpen || floatOpen;

    useEffect(() => {
        if (!enabled || !dockOpen) return undefined;

        const handleKeyDown = (event) => {
            if (event.key !== 'Escape') return;
            if (floatOpen) closeFloat();
            else setPickerOpen(false);
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [enabled, dockOpen, floatOpen, closeFloat, setPickerOpen]);

    if (!enabled || !dockOpen) return null;

    return createPortal(
        <div className="chat-dock">
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
    );
};

export const ChatProvider = ({ children }) => {
    const { auth } = useAuth();
    const chatEnabled = Boolean(auth && CHAT_ROLES.has(auth.role));

    const [pickerOpen, setPickerOpen] = useState(false);
    const [activeConv, setActiveConv] = useState(null);
    const { reloadInbox, totalUnread } = useChatInbox({ enabled: chatEnabled });

    const floatOpen = Boolean(activeConv);

    const closeFloat = useCallback(() => setActiveConv(null), []);

    const openPicker = useCallback(() => {
        setActiveConv(null);
        setPickerOpen(true);
        reloadInbox();
    }, [reloadInbox]);

    const selectConversation = useCallback((conv) => {
        setActiveConv(conv);
        setPickerOpen(false);
    }, []);

    const backToList = useCallback(() => {
        setActiveConv(null);
        setPickerOpen(true);
        reloadInbox();
    }, [reloadInbox]);

    const closeAll = useCallback(() => {
        setPickerOpen(false);
        setActiveConv(null);
    }, []);

    useEffect(() => {
        if (!chatEnabled) closeAll();
    }, [chatEnabled, closeAll]);

    useEffect(() => {
        if (!chatEnabled) return undefined;
        const handleOpenEvent = () => openPicker();
        window.addEventListener(OPEN_CHAT_PANEL_EVENT, handleOpenEvent);
        return () => window.removeEventListener(OPEN_CHAT_PANEL_EVENT, handleOpenEvent);
    }, [chatEnabled, openPicker]);

    const value = useMemo(
        () => ({
            chatEnabled,
            pickerOpen,
            setPickerOpen,
            activeConv,
            totalUnread,
            reloadInbox,
            openPicker,
            selectConversation,
            closeFloat,
            backToList,
            closeAll,
            floatOpen,
            dockOpen: pickerOpen || floatOpen,
        }),
        [
            chatEnabled,
            pickerOpen,
            activeConv,
            totalUnread,
            reloadInbox,
            openPicker,
            selectConversation,
            closeFloat,
            backToList,
            closeAll,
            floatOpen,
        ]
    );

    return (
        <ChatContext.Provider value={value}>
            {children}
            <ChatDockHost
                enabled={chatEnabled}
                pickerOpen={pickerOpen}
                setPickerOpen={setPickerOpen}
                activeConv={activeConv}
                selectConversation={selectConversation}
                closeFloat={closeFloat}
                backToList={backToList}
                reloadInbox={reloadInbox}
                floatOpen={floatOpen}
            />
        </ChatContext.Provider>
    );
};
