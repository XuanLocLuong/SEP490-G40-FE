import { getBusinessInitial } from '../../../utils/formatters.js';
import { ChatIcon } from '../../common/icons.jsx';
import {
    formatInvitationSentTime,
    getInvitationStatusLabel,
    getInvitationStatusTone,
} from '../../../services/recruiterInvitationService.js';

const InvitationCard = ({ invitation, onViewProfile }) => {
    const tone = getInvitationStatusTone(invitation.status);
    const score =
        invitation.matchScore != null && !Number.isNaN(Number(invitation.matchScore))
            ? `${Number(invitation.matchScore).toFixed(0)}%`
            : null;

    return (
        <article className="application-card">
            <div className="application-card__header">
                {invitation.candidateAvatar ? (
                    <img
                        src={invitation.candidateAvatar}
                        alt=""
                        className="application-card__avatar"
                    />
                ) : (
                    <div
                        className="application-card__avatar application-card__avatar--placeholder"
                        aria-hidden="true"
                    >
                        {getBusinessInitial(invitation.candidateName)}
                    </div>
                )}
                <div className="application-card__heading">
                    <h3 className="application-card__name">{invitation.candidateName}</h3>
                    <span className={`application-card__status application-card__status--${tone}`}>
                        {getInvitationStatusLabel(invitation.status)}
                    </span>
                    <p className="application-card__time">
                        {formatInvitationSentTime(invitation.sentAt)}
                        {score ? ` · Khớp ${score}` : ''}
                    </p>
                </div>
            </div>

            {invitation.message ? (
                <p className="invitation-card__message">{invitation.message}</p>
            ) : null}

            <div className="application-card__actions">
                <button
                    type="button"
                    className="btn application-card__btn application-card__btn--view"
                    onClick={() => onViewProfile?.(invitation)}
                >
                    Xem hồ sơ
                </button>
                <button
                    type="button"
                    className="btn application-card__btn application-card__btn--chat"
                    title="Nhắn tin"
                    aria-label="Nhắn tin"
                >
                    <ChatIcon width={18} height={18} />
                </button>
            </div>
        </article>
    );
};

export default InvitationCard;
