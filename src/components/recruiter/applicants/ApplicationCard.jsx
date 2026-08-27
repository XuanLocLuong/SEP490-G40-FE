import { getBusinessInitial } from '../../../utils/formatters.js';
import { isValidAvatarUrl } from '../../../utils/profileFormat.js';
import { ChatIcon } from '../../common/icons.jsx';
import {
    formatAppliedRelativeTime,
    getApplicationStatusLabel,
    getApplicationStatusTone,
} from '../../../services/recruiterApplicationService.js';

const ApplicationCard = ({
    application,
    actionLoading,
    chatLoading = false,
    reviewLoading = false,
    hasReviewed = false,
    readOnly = false,
    onAccept,
    onReject,
    onViewProfile,
    onChat,
    onReview,
    onViewRejectReason,
}) => {
    const canDecide = !readOnly && application.status === 'PENDING';
    const tone = getApplicationStatusTone(application.status);
    const canChat = application.candidateUserId != null;
    const canReview = application.status === 'HIRED';

    return (
        <article className="application-card">
            <div className="application-card__header">
                {isValidAvatarUrl(application.candidateAvatar) ? (
                    <img
                        src={application.candidateAvatar}
                        alt=""
                        className="application-card__avatar"
                    />
                ) : (
                    <div
                        className="application-card__avatar application-card__avatar--placeholder"
                        aria-hidden="true"
                    >
                        {getBusinessInitial(application.candidateName)}
                    </div>
                )}
                <div className="application-card__heading">
                    <h3 className="application-card__name">{application.candidateName}</h3>
                    <span className={`application-card__status application-card__status--${tone}`}>
                        {getApplicationStatusLabel(application.status)}
                    </span>
                    <p className="application-card__time">
                        {formatAppliedRelativeTime(application.appliedAt)}
                    </p>
                    {application.matchScore != null &&
                    !(application.criticalMismatchReasons || []).length ? (
                        <p className="application-card__score">
                            Khớp {Number(application.matchScore).toFixed(0)}%
                        </p>
                    ) : null}
                    {(application.criticalMismatchReasons || []).length > 0 ? (
                        <ul className="application-card__reasons">
                            {application.criticalMismatchReasons.map((reason) => (
                                <li key={reason}>{reason}</li>
                            ))}
                        </ul>
                    ) : null}
                </div>
            </div>

            <div className="application-card__actions">
                {canDecide ? (
                    <>
                        <button
                            type="button"
                            className="btn application-card__btn application-card__btn--reject"
                            disabled={actionLoading}
                            onClick={() => onReject?.(application)}
                        >
                            Từ chối
                        </button>
                        <button
                            type="button"
                            className="btn application-card__btn application-card__btn--accept"
                            disabled={actionLoading}
                            onClick={() => onAccept?.(application)}
                        >
                            Chấp nhận
                        </button>
                    </>
                ) : null}
                <button
                    type="button"
                    className="btn application-card__btn application-card__btn--view"
                    onClick={() => onViewProfile?.(application)}
                >
                    Xem hồ sơ
                </button>
                {application.status === 'REJECTED' && (application.rejectReason || application.note) ? (
                    <button
                        type="button"
                        className="btn application-card__btn application-card__btn--reject-reason"
                        title="Xem chi tiết lý do từ chối đã gửi"
                        onClick={() => onViewRejectReason?.(application)}
                    >
                        Lý do từ chối
                    </button>
                ) : null}
                {canReview ? (
                    <button
                        type="button"
                        className={`btn application-card__btn application-card__btn--review${
                            hasReviewed ? ' is-view' : ''
                        }`}
                        disabled={reviewLoading || !onReview}
                        onClick={() => onReview?.(application)}
                    >
                        {hasReviewed ? 'Xem đánh giá' : 'Gửi đánh giá'}
                    </button>
                ) : null}
                <button
                    type="button"
                    className="btn application-card__btn application-card__btn--chat"
                    title={canChat ? 'Nhắn tin' : 'Thiếu candidateUserId từ API'}
                    aria-label="Nhắn tin"
                    disabled={chatLoading || !canChat}
                    onClick={() => onChat?.(application)}
                >
                    <ChatIcon width={18} height={18} />
                </button>
            </div>
        </article>
    );
};

export default ApplicationCard;
