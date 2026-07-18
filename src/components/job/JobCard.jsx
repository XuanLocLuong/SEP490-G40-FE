import { useState } from 'react';
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
import '../../assets/styles/JobCardStyle.css';

const CardBusinessLogo = ({ name, logoUrl }) => {
    const [imgFailed, setImgFailed] = useState(false);
    const showImage = Boolean(logoUrl) && !imgFailed;

    if (showImage) {
        return (
            <img
                src={logoUrl}
                alt=""
                className="job-card__logo job-card__logo--image"
                onError={() => setImgFailed(true)}
            />
        );
    }

    return (
        <span className="job-card__logo" aria-hidden="true">
            {getBusinessInitial(name)}
        </span>
    );
};

const JobCard = ({ job, nearMe = false, compact = false, showDistance = false }) => {
    const businessName = job.business?.name || 'Công ty';
    const businessLogoUrl = job.business?.logoUrl || null;
    const tagLabel = formatJobType(job.jobType);
    const distance = getJobDistanceDisplay(job.distanceKm, nearMe || showDistance);
    const applied = hasAppliedToJob(job);
    const matchLabel = job.matchPercentLabel;
    const scheduleMatchLabel = job.scheduleMatchLabel;
    const interactionLabel = job.interactionLabel;
    const shiftsLabel = formatJobShiftsLabel(job.shifts);

    return (
        <article className={`job-card${compact ? ' job-card--compact' : ''}`}>
            <div className="job-card__top">
                <div className="job-card__brand">
                    <CardBusinessLogo
                        key={`${job.id}-${businessLogoUrl || ''}`}
                        name={businessName}
                        logoUrl={businessLogoUrl}
                    />
                    <div className="job-card__headings">
                        <h3 className="job-card__title">{job.title}</h3>
                        <p className="job-card__company">{businessName}</p>
                    </div>
                </div>
                <JobBookmarkButton
                    jobId={job.id}
                    className="job-card__bookmark"
                    initialSaved={job.interactionType === 'SAVE'}
                />
            </div>
            <div className="job-card__meta">
                {(matchLabel || scheduleMatchLabel || interactionLabel || job.urgent || applied || distance) && (
                    <>
                        {matchLabel && (
                            <span className="job-card__meta-item job-card__meta-item--match">
                                {matchLabel}
                            </span>
                        )}
                        {scheduleMatchLabel && (
                            <span className="job-card__meta-item job-card__meta-item--schedule-match">
                                {scheduleMatchLabel}
                            </span>
                        )}
                        {interactionLabel && (
                            <span
                                className={`job-card__meta-item job-card__meta-item--interaction job-card__meta-item--interaction-${String(job.interactionType || '').toLowerCase()}`}
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
                            <span className="job-card__meta-item job-card__meta-item--urgent">
                                Tuyển gấp
                            </span>
                        )}
                        {applied && !interactionLabel && (
                            <span className="job-card__meta-item job-card__meta-item--applied">
                                Đã ứng tuyển
                            </span>
                        )}
                        {distance && (
                            <span
                                className={`job-card__meta-item job-card__meta-item--distance${
                                    distance.variant === 'outside'
                                        ? ' job-card__meta-item--distance-outside'
                                        : ''
                                }`}
                            >
                                {distance.label}
                            </span>
                        )}
                    </>
                )}
                <span className="job-card__meta-item">
                    <MapPinIcon width={16} height={16} />
                    {formatLocation(job.location)}
                </span>
                {shiftsLabel && (
                    <span className="job-card__meta-item job-card__meta-item--shifts" title={shiftsLabel}>
                        <ClockIcon width={16} height={16} />
                        {shiftsLabel}
                    </span>
                )}
            </div>

            <p className="job-card__salary">{formatSalary(job.salaryMin, job.salaryMax)}</p>

            <div className="job-card__footer">
                <div className="job-card__footer-meta">
                    {tagLabel && <span className="job-card__tag">{tagLabel}</span>}
                    {job.createdAt && (
                        <span className="job-card__posted">
                            <ClockIcon width={14} height={14} />
                            {formatRelativeTime(job.createdAt)}
                        </span>
                    )}
                </div>
            </div>

            <div className="job-card__actions">
                <JobDetailLink jobId={job.id} className="job-card__detail-link" />
                {applied ? (
                    <button type="button" className="btn btn--primary job-card__apply" disabled>
                        Đã ứng tuyển
                    </button>
                ) : (
                    <JobApplyButton jobId={job.id} className="btn btn--primary job-card__apply" />
                )}
            </div>
        </article>
    );
};

export default JobCard;
