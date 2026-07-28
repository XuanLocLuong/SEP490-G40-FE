/** Custom events so header panel + JobChatButton can talk without deep context. */
export const OPEN_CHAT_PANEL_EVENT = 'joblink:open-chat';

/** Fired after chat business actions that change application / invitation status. */
export const RECRUITMENT_CHANGED_EVENT = 'joblink:recruitment-changed';

/** @param {{ conversationId?: number, jobId?: number, otherUserId?: number }} [detail] */
export const openChatPanel = (detail = {}) => {
    window.dispatchEvent(new CustomEvent(OPEN_CHAT_PANEL_EVENT, { detail }));
};

/**
 * @param {{
 *   jobId?: number|string|null,
 *   kind?: 'application' | 'invitation' | 'review',
 *   action?: string,
 *   source?: string,
 * }} [detail]
 */
export const notifyRecruitmentChanged = (detail = {}) => {
    window.dispatchEvent(new CustomEvent(RECRUITMENT_CHANGED_EVENT, { detail }));
};
