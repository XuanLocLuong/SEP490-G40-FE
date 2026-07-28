import { getActionCardCopy, getInviteGroupCardCopy } from '../../utils/chatDisplay.js';

/**
 * Unified action card for sticky groups and invite-group bubbles.
 *
 * Sticky: pass `kind` + `actions` (e.g. kind="WORK", actions=["ACCEPT_WORK","REJECT_WORK"]).
 * Bubble: pass `actionName` ("INVITE"|"CONFIRM_WORK"|"REQUEST_REVIEW") + optional `body`.
 */
const ChatActionCard = ({
    kind,
    actionName,
    actions = [],
    title,
    body,
    busy = false,
    disabled = false,
    hideActions = false,
    onAction,
}) => {
    const locked = Boolean(disabled || busy);

    // ── Bubble invite-group ──────────────────────────────────────────────
    if (actionName === 'INVITE') {
        const copy = getInviteGroupCardCopy('INVITE', body);
        return (
            <CardShell
                title={title || copy.title}
                body={body || copy.body}
                disabled={disabled}
                locked={locked}
                busy={busy}
                hideActions={hideActions}
                acceptLabel={copy.acceptCta}
                rejectLabel={copy.rejectCta}
                onAccept={() => onAction?.('ACCEPT_INVITE')}
                onReject={() => onAction?.('REJECT_INVITE')}
            />
        );
    }

    if (actionName === 'CONFIRM_WORK') {
        const copy = getInviteGroupCardCopy('CONFIRM_WORK', body);
        return (
            <CardShell
                title={title || copy.title}
                body={body || copy.body}
                disabled={disabled}
                locked={locked}
                busy={busy}
                hideActions={hideActions}
                acceptLabel={copy.acceptCta}
                rejectLabel={copy.rejectCta}
                onAccept={() => onAction?.('ACCEPT_WORK')}
                onReject={() => onAction?.('REJECT_WORK')}
            />
        );
    }

    if (actionName === 'REQUEST_REVIEW' || kind === 'REQUEST_REVIEW') {
        const copy = getActionCardCopy('REQUEST_REVIEW');
        return (
            <CardShell
                title={title || copy.title}
                body={body || copy.body}
                disabled={disabled}
                locked={locked}
                busy={busy}
                hideActions={hideActions}
                primaryLabel={copy.cta}
                onPrimary={() => onAction?.('REQUEST_REVIEW')}
            />
        );
    }

    // ── Sticky groups ───────────────────────────────────────────────────
    if (kind === 'INVITE' || (actions.length === 1 && actions[0] === 'INVITE')) {
        const copy = getActionCardCopy('INVITE');
        return (
            <CardShell
                title={title || copy.title}
                body={body || copy.body}
                disabled={disabled}
                locked={locked}
                busy={busy}
                primaryLabel={copy.cta}
                onPrimary={() => onAction?.('INVITE')}
            />
        );
    }

    if (kind === 'WORK' || actions.includes('ACCEPT_WORK') || actions.includes('REJECT_WORK')) {
        const copy = getActionCardCopy('ACCEPT_WORK');
        return (
            <CardShell
                title={title || copy.title}
                body={body || copy.body}
                disabled={disabled}
                locked={locked}
                busy={busy}
                acceptLabel={actions.includes('ACCEPT_WORK') ? copy.acceptCta : null}
                rejectLabel={actions.includes('REJECT_WORK') ? copy.rejectCta : null}
                onAccept={() => onAction?.('ACCEPT_WORK')}
                onReject={() => onAction?.('REJECT_WORK')}
            />
        );
    }

    if (
        kind === 'INVITE_DECISION' ||
        actions.includes('ACCEPT_INVITE') ||
        actions.includes('REJECT_INVITE')
    ) {
        const copy = getActionCardCopy('ACCEPT_INVITE');
        return (
            <CardShell
                title={title || copy.title}
                body={body || copy.body}
                disabled={disabled}
                locked={locked}
                busy={busy}
                acceptLabel={actions.includes('ACCEPT_INVITE') ? copy.acceptCta : null}
                rejectLabel={actions.includes('REJECT_INVITE') ? copy.rejectCta : null}
                onAccept={() => onAction?.('ACCEPT_INVITE')}
                onReject={() => onAction?.('REJECT_INVITE')}
            />
        );
    }

    if (
        kind === 'APPLICATION' ||
        actions.includes('ACCEPT_APPLICATION') ||
        actions.includes('REJECT_APPLICATION')
    ) {
        const copy = getActionCardCopy('ACCEPT_APPLICATION');
        return (
            <CardShell
                title={title || copy.title}
                body={body || copy.body}
                disabled={disabled}
                locked={locked}
                busy={busy}
                acceptLabel={actions.includes('ACCEPT_APPLICATION') ? copy.acceptCta : null}
                rejectLabel={actions.includes('REJECT_APPLICATION') ? copy.rejectCta : null}
                onAccept={() => onAction?.('ACCEPT_APPLICATION')}
                onReject={() => onAction?.('REJECT_APPLICATION')}
            />
        );
    }

    const fallback = getActionCardCopy(actionName || actions[0]);
    return (
        <CardShell
            title={title || fallback.title}
            body={body || fallback.body}
            disabled={disabled}
            locked={locked}
            busy={busy}
            primaryLabel={fallback.cta || 'Tiếp tục'}
            onPrimary={() => onAction?.(actionName || actions[0])}
        />
    );
};

const CardShell = ({
    title,
    body,
    disabled,
    locked,
    busy,
    hideActions = false,
    acceptLabel,
    rejectLabel,
    primaryLabel,
    onAccept,
    onReject,
    onPrimary,
}) => {
    const showPair = !hideActions && Boolean(acceptLabel || rejectLabel);
    const showPrimary = !hideActions && !showPair;

    return (
        <div
            className={`chat-action-card${disabled ? ' chat-action-card--disabled' : ''}${hideActions ? ' chat-action-card--info' : ''}`}
        >
            <p className="chat-action-card__title">{title}</p>
            {body ? <p className="chat-action-card__body">{body}</p> : null}

            {showPair ? (
                <div className="chat-action-card__btn-row">
                    {acceptLabel ? (
                        <button
                            type="button"
                            className="chat-action-card__cta"
                            disabled={locked}
                            onClick={onAccept}
                        >
                            {busy ? 'Đang xử lý...' : acceptLabel}
                        </button>
                    ) : null}
                    {rejectLabel ? (
                        <button
                            type="button"
                            className="chat-action-card__cta chat-action-card__cta--ghost"
                            disabled={locked}
                            onClick={onReject}
                        >
                            {busy ? 'Đang xử lý...' : rejectLabel}
                        </button>
                    ) : null}
                </div>
            ) : null}

            {showPrimary ? (
                <button
                    type="button"
                    className="chat-action-card__cta"
                    disabled={locked}
                    onClick={onPrimary}
                >
                    {busy ? 'Đang xử lý...' : primaryLabel || 'Tiếp tục'}
                </button>
            ) : null}
        </div>
    );
};

export default ChatActionCard;
