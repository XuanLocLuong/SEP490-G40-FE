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
    hasInvitedToJob,
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
import JobPrimaryCta from './JobPrimaryCta.jsx';
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

const buildJobMetaRows = (job, shiftsLabel, vacancyLabel, isVacancyFull) => {
    const locationText = formatLocation(job.location);
    const locationLine = locationText && locationText !== '—' ? locationText : null;
    const shiftsLine = shiftsLabel || null;
    const vacancyLine = vacancyLabel || null;

    return [
        {
            key: 'location',
            text: locationLine || 'Chưa có địa điểm',
            placeholder: !locationLine,
            Icon: MapPinIcon,
            className: 'job-card__meta-item--location',
        },
        {
            key: 'shifts',
            text: shiftsLine || 'Chưa có thông tin ca làm',
            placeholder: !shiftsLine,
            Icon: ClockIcon,
            className: 'job-card__meta-item--shifts',
            title: shiftsLine || undefined,
        },
        {
            key: 'vacancy',
            text: vacancyLine || 'Chưa công bố chỗ trống',
            placeholder: !vacancyLine,
            Icon: UsersIcon,
            className: `job-card__meta-item--vacancy${
                isVacancyFull ? ' job-card__meta-item--vacancy-full' : ''
            }`,
        },
    ];
};

const JobCard = ({
    job,
    nearMe = false,
    compact = false,
    showDistance = false,
    variant = 'default',
    /** e.g. `?section=urgent` — preserves list context on job detail sidebar */
    detailSearch,
    /** Homepage section id — scroll back to this section after leaving detail */
    homeSectionId,
}) => {
    const isPreview = variant === 'preview';
    const isClosed = job?.status === 'CLOSED';
    const businessName = job.business?.name || 'Công ty';
    const businessLogoUrl = job.business?.logoUrl || null;
    const tagLabel = formatJobType(job.jobType);
    const distance = getJobDistanceDisplay(job.distanceKm, nearMe || showDistance);
    const applied = hasAppliedToJob(job);
    const invited = hasInvitedToJob(job);
    const matchLabel = job.matchPercentLabel;
    const scheduleMatchLabel = job.scheduleMatchLabel;
    const interactionLabel = job.interactionLabel;
    const shiftsLabel = formatJobShiftsLabel(job.shifts);
    const vacancyLabel = formatVacancyLabel(job);
    const isVacancyFull = vacancyLabel === 'Đã hết vị trí';
    const metaRows = buildJobMetaRows(job, shiftsLabel, vacancyLabel, isVacancyFull);
    const hasMetaTags =
        isClosed ||
        matchLabel ||
        scheduleMatchLabel ||
        interactionLabel ||
        job.urgent ||
        applied ||
        invited ||
        distance;

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
                <div
                    className="job-card__meta-tags"
                    aria-hidden={!hasMetaTags}
                >
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
                    {invited && !applied && (
                        <span className="job-card__meta-item job-card__meta-item--invited">
                            Đã được mời
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
                <div className="job-card__meta-rows">
                    {metaRows.map((row) => {
                        const { Icon } = row;
                        return (
                            <span
                                key={row.key}
                                className={`job-card__meta-item ${row.className}${
                                    row.placeholder ? ' job-card__meta-item--placeholder' : ''
                                }`}
                                title={row.title}
                            >
                                <Icon width={16} height={16} />
                                <span className="job-card__meta-text">{row.text}</span>
                            </span>
                        );
                    })}
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
                </div>
            ) : isClosed ? (
                <div className="job-card__actions">
                    <JobDetailLink
                        jobId={job.id}
                        className="job-card__detail-link"
                        search={detailSearch}
                        homeSectionId={homeSectionId}
                    />
                </div>
            ) : (
                <div className="job-card__actions">
                    <JobDetailLink
                        jobId={job.id}
                        className="job-card__detail-link"
                        search={detailSearch}
                        homeSectionId={homeSectionId}
                    />
                    <JobPrimaryCta
                        job={job}
                        className="btn btn--primary job-card__apply"
                        disabled={isVacancyFull}
                        disabledTitle="Tin tuyển dụng đã hết vị trí."
                    />
                </div>
            )}
        </article>
    );
};

export default JobCard;