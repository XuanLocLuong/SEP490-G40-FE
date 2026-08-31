import {
    formatLocation,
    formatRelativeTime,
    formatJobShiftsLabel,
    formatVacancyLabel,
    getBusinessInitial,
    hasAppliedToJob,
    hasHiredJob,
    hasInvitedToJob,
} from '../../utils/formatters.js';
import { formatJobSalary } from '../../utils/jobSalaryDisplay.js';
import { getJobDistanceDisplay } from '../../utils/jobQuery.js';
import { getJobTypeLabels } from '../../utils/jobTypeDisplay.js';
import { useJobTypeOptions } from '../../hooks/useJobTypeOptions.js';
import {
    MapPinIcon,
    ClockIcon,
    BookmarkIcon,
    EyeIcon,
    CheckCircleIcon,
    UsersIcon,
} from '../common/icons.jsx';
import JobBookmarkButton from './JobBookmarkButton.jsx';
import JobPrimaryCta from './JobPrimaryCta.jsx';
import JobDetailLink from './JobDetailLink.jsx';
import '../../assets/styles/JobListItemStyle.css';

const JobListItem = ({ job, nearMe = false, onSavedChange }) => {
    const jobTypeOptions = useJobTypeOptions();
    const businessName = job.business?.name || 'Công ty';
    const jobTypeLabels = getJobTypeLabels(job.jobType, jobTypeOptions);
    const distance = getJobDistanceDisplay(job.distanceKm, nearMe);
    const hired = hasHiredJob(job);
    const applied = hasAppliedToJob(job);
    const invited = hasInvitedToJob(job);
    const matchLabel = job.matchPercentLabel;
    const scheduleMatchLabel = job.scheduleMatchLabel;
    const interactionLabel = job.interactionLabel;
    const shiftsLabel = formatJobShiftsLabel(job.shifts);
    const vacancyLabel = formatVacancyLabel(job);
    const isVacancyFull = vacancyLabel === 'Đã hết vị trí';
    const hasTags =
        jobTypeLabels.length > 0 ||
        matchLabel ||
        scheduleMatchLabel ||
        interactionLabel ||
        job.urgent ||
        distance ||
        hired ||
        applied ||
        invited;

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
                    initialSaved={Boolean(job.saved)}
                    onSavedChange={onSavedChange}
                />
            </div>

            {hasTags && (
                <div className="job-list-item__tags">
                    {jobTypeLabels.map((label, index) => (
                        <span
                            key={`${label}-${index}`}
                            className="job-list-item__tag"
                        >
                            {label}
                        </span>
                    ))}
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
                    {hired && !interactionLabel && (
                        <span className="job-list-item__tag job-list-item__tag--hired">
                            Đã nhận việc
                        </span>
                    )}
                    {applied && !hired && !interactionLabel && (
                        <span className="job-list-item__tag job-list-item__tag--applied">
                            Đã ứng tuyển
                        </span>
                    )}
                    {invited && !hired && !applied && (
                        <span className="job-list-item__tag job-list-item__tag--invited">
                            Đã được mời
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
                    {formatJobSalary(job.salaryMin, job.salaryMax)}
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
                {vacancyLabel && (
                    <span
                        className={`job-list-item__info-item job-list-item__info-item--vacancy${
                            isVacancyFull ? ' job-list-item__info-item--vacancy-full' : ''
                        }`}
                    >
                        <UsersIcon width={16} height={16} />
                        {vacancyLabel}
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
                <JobPrimaryCta
                    job={job}
                    className="btn btn--primary job-list-item__apply"
                    disabled={isVacancyFull}
                    disabledTitle="Tin tuyển dụng đã hết vị trí."
                />
            </div>
        </article>
    );
};

export default JobListItem;
