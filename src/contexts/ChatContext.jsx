import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import { createOrGetConversation } from '../apis/ChatApi.jsx';
import { ChatFloat, ChatPicker } from '../components/chat/ChatPanel.jsx';
import { useChatInbox } from '../hooks/useChatInbox.js';
import { OPEN_CHAT_PANEL_EVENT } from '../utils/chatEvents.js';
import { unwrapData } from '../utils/chatDisplay.js';
import { USER_ROLES } from '../utils/Constants.jsx';
import '../assets/styles/ChatPanelStyle.css';
import { useAuth } from './authContext.js';
import { ChatContext } from './chatContext.js';

const CHAT_ROLES = new Set([USER_ROLES.CANDIDATE, USER_ROLES.RECRUITER]);
/** Desktop / tablet landscape: up to 3 floats. Narrower: 1. */
const MULTI_CHAT_MQ = '(min-width: 900px)';
const MAX_FLOATS_WIDE = 3;
const MAX_FLOATS_NARROW = 1;

const getMaxFloats = () =>
    typeof window !== 'undefined' && window.matchMedia(MULTI_CHAT_MQ).matches
        ? MAX_FLOATS_WIDE
        : MAX_FLOATS_NARROW;

const useMaxChatFloats = () => {
    const [maxFloats, setMaxFloats] = useState(getMaxFloats);

    useEffect(() => {
        const mq = window.matchMedia(MULTI_CHAT_MQ);
        const sync = () => setMaxFloats(mq.matches ? MAX_FLOATS_WIDE : MAX_FLOATS_NARROW);
        sync();
        mq.addEventListener('change', sync);
        return () => mq.removeEventListener('change', sync);
    }, []);

    return maxFloats;
};

const ChatDockHost = ({
    enabled,
    pickerOpen,
    setPickerOpen,
    openFloats,
    selectConversation,
    closeFloat,
    closeNewestFloat,
    backToList,
    reloadInbox,
}) => {
    const floatOpen = openFloats.length > 0;
    const dockOpen = pickerOpen || floatOpen;

    useEffect(() => {
        if (!enabled || !dockOpen) return undefined;

        const handleKeyDown = (event) => {
            if (event.key !== 'Escape') return;
            if (floatOpen) closeNewestFloat();
            else setPickerOpen(false);
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [enabled, dockOpen, floatOpen, closeNewestFloat, setPickerOpen]);

    if (!enabled || !dockOpen) return null;

    const openIds = openFloats.map((c) => c.id);

    return createPortal(
        <div className="chat-dock">
            {openFloats.map((conv) => (
                <ChatFloat
                    key={conv.id}
                    conversation={conv}
                    onClose={() => closeFloat(conv.id)}
                    onBackToList={() => backToList(conv.id)}
                    onThreadChanged={reloadInbox}
                />
            ))}
            {pickerOpen ? (
                <ChatPicker
                    open={pickerOpen}
                    activeIds={openIds}
                    onSelect={selectConversation}
                    onClose={() => setPickerOpen(false)}
                />
            ) : null}
        </div>,
        document.body
    );
};

export const ChatProvider = ({ children }) => {
    const { auth } = useAuth();
    const chatEnabled = Boolean(auth && CHAT_ROLES.has(auth.role));
    const maxFloats = useMaxChatFloats();
    const maxFloatsRef = useRef(maxFloats);
    maxFloatsRef.current = maxFloats;

    const [pickerOpen, setPickerOpen] = useState(false);
    const [openFloats, setOpenFloats] = useState([]);
    const [openingChat, setOpeningChat] = useState(false);
    const { reloadInbox, totalUnread } = useChatInbox({ enabled: chatEnabled });

    const floatOpen = openFloats.length > 0;
    const activeConv = openFloats[openFloats.length - 1] ?? null;

    // Trim when viewport shrinks (3 → 1): keep newest floats.
    useEffect(() => {
        setOpenFloats((prev) =>
            prev.length > maxFloats ? prev.slice(-maxFloats) : prev
        );
    }, [maxFloats]);

    const pushFloat = useCallback((conv) => {
        if (!conv?.id) return;
        setOpenFloats((prev) => {
            const rest = prev.filter((c) => String(c.id) !== String(conv.id));
            const next = [...rest, conv];
            const max = maxFloatsRef.current;
            return next.length > max ? next.slice(-max) : next;
        });
    }, []);

    const closeFloat = useCallback((conversationId) => {
        setOpenFloats((prev) =>
            prev.filter((c) => String(c.id) !== String(conversationId))
        );
    }, []);

    const closeNewestFloat = useCallback(() => {
        setOpenFloats((prev) => (prev.length ? prev.slice(0, -1) : prev));
    }, []);

    const openPicker = useCallback(() => {
        // Narrow: only room for one panel — drop floats when opening inbox.
        if (maxFloatsRef.current <= 1) {
            setOpenFloats([]);
        }
        setPickerOpen(true);
        reloadInbox();
    }, [reloadInbox]);

    const selectConversation = useCallback(
        (conv) => {
            pushFloat(conv);
            // Narrow: hide list after pick. Wide: keep list so user can open more.
            if (maxFloatsRef.current <= 1) {
                setPickerOpen(false);
            }
        },
        [pushFloat]
    );

    const backToList = useCallback(
        (conversationId) => {
            closeFloat(conversationId);
            setPickerOpen(true);
            reloadInbox();
        },
        [closeFloat, reloadInbox]
    );

    const closeAll = useCallback(() => {
        setPickerOpen(false);
        setOpenFloats([]);
    }, []);

    /**
     * Open (or create) a conversation then show a float (multi on wide screens).
     * @param {{ jobId?: number|null, otherUserId: number }} params
     */
    const openConversationWith = useCallback(
        async ({ jobId = null, otherUserId }) => {
            if (!chatEnabled) return null;
            if (otherUserId == null) {
                toast.error('Không xác định được người dùng để mở chat.');
                return null;
            }
            if (openingChat) return null;

            setOpeningChat(true);
            try {
                const body = { otherUserId: Number(otherUserId) };
                if (jobId != null) body.jobId = Number(jobId);
                const res = await createOrGetConversation(body);
                const conv = unwrapData(res);
                if (!conv?.id) {
                    toast.error('Không mở được cuộc trò chuyện.');
                    return null;
                }
                pushFloat(conv);
                if (maxFloatsRef.current <= 1) {
                    setPickerOpen(false);
                }
                reloadInbox();
                return conv;
            } catch (err) {
                const msg = err?.response?.data?.message;
                toast.error(msg || 'Không mở được cuộc trò chuyện.');
                return null;
            } finally {
                setOpeningChat(false);
            }
        },
        [chatEnabled, openingChat, pushFloat, reloadInbox]
    );

    useEffect(() => {
        if (!chatEnabled) closeAll();
    }, [chatEnabled, closeAll]);

    useEffect(() => {
        if (!chatEnabled) return undefined;

        const handleOpenEvent = (event) => {
            const detail = event?.detail || {};
            if (detail.otherUserId != null) {
                void openConversationWith({
                    jobId: detail.jobId ?? null,
                    otherUserId: detail.otherUserId,
                });
                return;
            }
            if (detail.conversationId != null) {
                openPicker();
                return;
            }
            openPicker();
        };

        window.addEventListener(OPEN_CHAT_PANEL_EVENT, handleOpenEvent);
        return () => window.removeEventListener(OPEN_CHAT_PANEL_EVENT, handleOpenEvent);
    }, [chatEnabled, openConversationWith, openPicker]);

    const value = useMemo(
        () => ({
            chatEnabled,
            pickerOpen,
            setPickerOpen,
            openFloats,
            activeConv,
            totalUnread,
            reloadInbox,
            openPicker,
            openConversationWith,
            openingChat,
            selectConversation,
            closeFloat,
            closeNewestFloat,
            backToList,
            closeAll,
            floatOpen,
            maxFloats,
            dockOpen: pickerOpen || floatOpen,
        }),
        [
            chatEnabled,
            pickerOpen,
            openFloats,
            activeConv,
            totalUnread,
            reloadInbox,
            openPicker,
            openConversationWith,
            openingChat,
            selectConversation,
            closeFloat,
            closeNewestFloat,
            backToList,
            closeAll,
            floatOpen,
            maxFloats,
        ]
    );

    return (
        <ChatContext.Provider value={value}>
            {children}
            <ChatDockHost
                enabled={chatEnabled}
                pickerOpen={pickerOpen}
                setPickerOpen={setPickerOpen}
                openFloats={openFloats}
                selectConversation={selectConversation}
                closeFloat={closeFloat}
                closeNewestFloat={closeNewestFloat}
                backToList={backToList}
                reloadInbox={reloadInbox}
            />
        </ChatContext.Provider>
    );
};
