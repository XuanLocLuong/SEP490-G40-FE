import { useState } from 'react';
import {
    formatJobType,
    formatSalary,
    formatLocation,
    formatRelativeTime,
    formatJobShiftsLabel,
    formatVacancyLabel,
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
    UsersIcon,
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

const JobCard = ({
    job,
    nearMe = false,
    compact = false,
    showDistance = false,
    variant = 'default',
}) => {
    const isPreview = variant === 'preview';
    const isClosed = job?.status === 'CLOSED';
    const businessName = job.business?.name || 'Công ty';
    const businessLogoUrl = job.business?.logoUrl || null;
    const tagLabel = formatJobType(job.jobType);
    const distance = getJobDistanceDisplay(job.distanceKm, nearMe || showDistance);
    const applied = hasAppliedToJob(job);
    const matchLabel = job.matchPercentLabel;
    const scheduleMatchLabel = job.scheduleMatchLabel;
    const interactionLabel = job.interactionLabel;
    const shiftsLabel = formatJobShiftsLabel(job.shifts);
    const vacancyLabel = formatVacancyLabel(job);
    const isVacancyFull = vacancyLabel === 'Đã hết vị trí';

    return (
        <article
            className={`job-card${compact ? ' job-card--compact' : ''}${
                isClosed ? ' job-card--closed' : ''
            }`}
        >
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
                {isPreview || isClosed ? (
                    <span className="job-card__bookmark" aria-hidden="true">
                        <BookmarkIcon width={20} height={20} />
                    </span>
                ) : (
                    <JobBookmarkButton
                        jobId={job.id}
                        className="job-card__bookmark"
                        initialSaved={job.interactionType === 'SAVE'}
                    />
                )}
            </div>
            <div className="job-card__meta">
                {(matchLabel ||
                    scheduleMatchLabel ||
                    interactionLabel ||
                    job.urgent ||
                    applied ||
                    distance ||
                    isClosed) && (
                    <div className="job-card__meta-tags">
                        {isClosed && (
                            <span className="job-card__meta-item job-card__meta-item--closed">
                                Ngưng nhận hồ sơ
                            </span>
                        )}
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
                        {job.urgent && !isClosed && (
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
                    </div>
                )}
                <div className="job-card__meta-rows">
                    <span className="job-card__meta-item job-card__meta-item--location">
                        <MapPinIcon width={16} height={16} />
                        <span className="job-card__meta-text">{formatLocation(job.location)}</span>
                    </span>
                    {shiftsLabel && (
                        <span
                            className="job-card__meta-item job-card__meta-item--shifts"
                            title={shiftsLabel}
                        >
                            <ClockIcon width={16} height={16} />
                            <span className="job-card__meta-text">{shiftsLabel}</span>
                        </span>
                    )}
                    {vacancyLabel && (
                        <span
                            className={`job-card__meta-item job-card__meta-item--vacancy${
                                isVacancyFull ? ' job-card__meta-item--vacancy-full' : ''
                            }`}
                        >
                            <UsersIcon width={16} height={16} />
                            <span className="job-card__meta-text">{vacancyLabel}</span>
                        </span>
                    )}
                </div>
            </div>

            <p className="job-card__salary">{formatSalary(job.salaryMin, job.salaryMax)}</p>

            <div className="job-card__footer">
                <div className="job-card__footer-meta">
                    {tagLabel && <span className="job-card__tag">{tagLabel}</span>}
                    {(isPreview || job.createdAt) && (
                        <span className="job-card__posted">
                            <ClockIcon width={14} height={14} />
                            {isPreview ? 'Vừa đăng' : formatRelativeTime(job.createdAt)}
                        </span>
                    )}
                </div>
            </div>

            {isPreview ? (
                <div className="job-card__actions">
                    <span className="job-card__detail-link">Xem chi tiết</span>
                    <button type="button" className="btn btn--primary job-card__apply" tabIndex={-1}>
                        Ứng tuyển ngay
                    </button>
                </div>
            ) : isClosed ? (
                <div className="job-card__actions">
                    <JobDetailLink jobId={job.id} className="job-card__detail-link" />
                </div>
            ) : (
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
            )}
        </article>
    );
};

export default JobCard;