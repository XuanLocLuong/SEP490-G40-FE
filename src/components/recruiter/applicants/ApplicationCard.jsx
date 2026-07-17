import { getBusinessInitial } from '../../../utils/formatters.js';
import {
    formatAppliedRelativeTime,
    getApplicationStatusLabel,
    getApplicationStatusTone,
} from '../../../services/recruiterApplicationService.js';

const ApplicationCard = ({
    application,
    actionLoading,
    onAccept,
    onReject,
    onViewProfile,
}) => {
    const isPending = application.status === 'PENDING';
    const tone = getApplicationStatusTone(application.status);

    return (
        <article className="application-card">
            <div className="application-card__header">
                {application.candidateAvatar ? (
                    <img
                        src={application.candidateAvatar}
                        alt=""
                        className="application-card__avatar"
                    />
                ) : (
                    <div className="application-card__avatar application-card__avatar--placeholder" aria-hidden="true">
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
                </div>
            </div>

            <div className="application-card__actions">
                {isPending ? (
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
                        <button
                            type="button"
                            className="btn application-card__btn application-card__btn--view"
                            onClick={() => onViewProfile?.(application)}
                        >
                            Xem hồ sơ
                        </button>
                    </>
                ) : (
                    <button
                        type="button"
                        className="btn application-card__btn application-card__btn--view"
                        onClick={() => onViewProfile?.(application)}
                    >
                        Xem hồ sơ
                    </button>
                )}
            </div>
        </article>
    );
};

export default ApplicationCard;
