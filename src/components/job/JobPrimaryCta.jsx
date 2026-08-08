import { Link, useLocation } from 'react-router-dom';
import { hasAppliedToJob, hasInvitedToJob } from '../../utils/formatters.js';
import { buildInvitationsFromCurrentLocation } from '../../utils/invitationNavReturn.js';
import { ROUTES } from '../../routes/path.js';
import JobApplyButton from './JobApplyButton.jsx';

/**
 * CTA discovery: isApply → Đã ứng tuyển; isInvited → Xem lời mời; else Ứng tuyển.
 * applied ưu tiên hơn invited.
 */
const JobPrimaryCta = ({
    job,
    className,
    guestLabel,
    scheduleSummary,
    shiftGroups,
    disabled = false,
    disabledTitle,
    onApplied,
}) => {
    const location = useLocation();

    if (hasAppliedToJob(job)) {
        return (
            <button type="button" className={className} disabled title="Bạn đã ứng tuyển công việc này rồi.">
                Đã ứng tuyển
            </button>
        );
    }

    if (hasInvitedToJob(job)) {
        return (
            <Link
                to={ROUTES.CANDIDATE_INVITATIONS}
                state={buildInvitationsFromCurrentLocation(location)}
                className={`${className} job-primary-cta--invite`.trim()}
                title="Bạn đã được mời ứng tuyển công việc này."
                onClick={(e) => e.stopPropagation()}
            >
                Xem lời mời
            </Link>
        );
    }

    return (
        <JobApplyButton
            jobId={job.id}
            className={className}
            guestLabel={guestLabel}
            scheduleSummary={scheduleSummary}
            shiftGroups={shiftGroups}
            disabled={disabled}
            disabledTitle={disabledTitle}
            onApplied={onApplied}
            initialApplied={hasAppliedToJob(job)}
        />
    );
};

export default JobPrimaryCta;
