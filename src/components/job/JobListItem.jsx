import {
    formatJobType,
    formatSalary,
    formatLocation,
    formatRelativeTime,
    formatJobShiftsLabel,
    getBusinessInitial,
    hasAppliedToJob,
} from '../../utils/formatters.js';
import { getJobDistanceDisplay } from '../../utils/jobQuery.js';
import {
    MapPinIcon,
    ClockIcon,
    BookmarkIcon,
    EyeIcon,
    CheckCircleIcon,
} from '../common/icons.jsx';
import JobBookmarkButton from './JobBookmarkButton.jsx';
import JobApplyButton from './JobApplyButton.jsx';
import JobDetailLink from './JobDetailLink.jsx';
import '../../assets/styles/JobListItemStyle.css';

const JobListItem = ({ job, nearMe = false }) => {
    const businessName = job.business?.name || 'Công ty';
    const tagLabel = formatJobType(job.jobType);
    const distance = getJobDistanceDisplay(job.distanceKm, nearMe);
    const applied = hasAppliedToJob(job);
    const matchLabel = job.matchPercentLabel;
    const scheduleMatchLabel = job.scheduleMatchLabel;
    const interactionLabel = job.interactionLabel;
    const shiftsLabel = formatJobShiftsLabel(job.shifts);
    const hasTags =
        tagLabel ||
        matchLabel ||
        scheduleMatchLabel ||
        interactionLabel ||
        job.urgent ||
        distance ||
        applied;

    return (
        <article className="job-list-item">
            <div className="job-list-item__header">
                <div className="job-list-item__brand">
                    <span className="job-list-item__logo" aria-hidden="true">
                        {getBusinessInitial(businessName)}
                    </span>
                    <div className="job-list-item__headings">
                        <h3 className="job-list-item__title">{job.title}</h3>
                        <p className="job-list-item__company">{businessName}</p>
                    </div>
                </div>
                <JobBookmarkButton
                    jobId={job.id}
                    className="job-list-item__bookmark"
                    initialSaved={job.interactionType === 'SAVE'}
                />
            </div>

            {hasTags && (
                <div className="job-list-item__tags">
                    {tagLabel && <span className="job-list-item__tag">{tagLabel}</span>}
                    {matchLabel && (
                        <span className="job-list-item__tag job-list-item__tag--match">
                            {matchLabel}
                        </span>
                    )}
                    {scheduleMatchLabel && (
                        <span className="job-list-item__tag job-list-item__tag--schedule-match">
                            {scheduleMatchLabel}
                        </span>
                    )}
                    {interactionLabel && (
                        <span
                            className={`job-list-item__tag job-list-item__tag--interaction job-list-item__tag--interaction-${String(job.interactionType || '').toLowerCase()}`}
                        >
                            {job.interactionType === 'SAVE' ? (
                                <BookmarkIcon width={12} height={12} />
                            ) : job.interactionType === 'APPLY' ? (
                                <CheckCircleIcon width={12} height={12} />
                            ) : (
                                <EyeIcon width={12} height={12} />
                            )}
                            {interactionLabel}
                        </span>
                    )}
                    {job.urgent && (
                        <span className="job-list-item__tag job-list-item__tag--urgent">
                            Tuyển gấp
                        </span>
                    )}
                    {applied && !interactionLabel && (
                        <span className="job-list-item__tag job-list-item__tag--applied">
                            Đã ứng tuyển
                        </span>
                    )}
                    {distance && (
                        <span
                            className={`job-list-item__tag job-list-item__tag--distance${
                                distance.variant === 'outside'
                                    ? ' job-list-item__tag--distance-outside'
                                    : ''
                            }`}
                        >
                            {distance.label}
                        </span>
                    )}
                </div>
            )}

            <div className="job-list-item__info">
                <span className="job-list-item__info-item job-list-item__salary">
                    {formatSalary(job.salaryMin, job.salaryMax)}
                </span>
                <span className="job-list-item__info-item">
                    <MapPinIcon width={16} height={16} />
                    {formatLocation(job.location)}
                </span>
                {shiftsLabel && (
                    <span className="job-list-item__info-item job-list-item__info-item--shifts" title={shiftsLabel}>
                        <ClockIcon width={16} height={16} />
                        {shiftsLabel}
                    </span>
                )}
                {job.createdAt && (
                    <span className="job-list-item__info-item">
                        <ClockIcon width={16} height={16} />
                        {formatRelativeTime(job.createdAt)}
                    </span>
                )}
            </div>

            <div className="job-list-item__actions">
                <JobDetailLink jobId={job.id} className="job-list-item__link-btn" />
                {applied ? (
                    <button type="button" className="btn btn--primary job-list-item__apply" disabled>
                        Đã ứng tuyển
                    </button>
                ) : (
                    <JobApplyButton
                        jobId={job.id}
                        className="btn btn--primary job-list-item__apply"
                    />
                )}
            </div>
        </article>
    );
};

export default JobListItem;
