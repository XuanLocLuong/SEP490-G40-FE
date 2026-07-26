/** Custom events so header panel + JobChatButton can talk without deep context. */
export const OPEN_CHAT_PANEL_EVENT = 'joblink:open-chat';

/** @param {{ conversationId?: number, jobId?: number, otherUserId?: number }} [detail] */
export const openChatPanel = (detail = {}) => {
    window.dispatchEvent(new CustomEvent(OPEN_CHAT_PANEL_EVENT, { detail }));
};
