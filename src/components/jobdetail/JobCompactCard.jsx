import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    formatSalary,
    formatLocation,
    formatVacancyLabel,
    formatJobShiftsLabel,
    getBusinessInitial,
    hasAppliedToJob,
    hasHiredJob,
    hasInvitedToJob,
} from '../../utils/formatters.js';
import { getJobDistanceDisplay } from '../../utils/jobQuery.js';
import { formatJobTypeLabels } from '../../utils/jobTypeDisplay.js';
import { useJobTypeOptions } from '../../hooks/useJobTypeOptions.js';
import { MapPinIcon, BriefcaseIcon, UsersIcon, ClockIcon } from '../common/icons.jsx';
import { getJobDetailPath } from '../../routes/path.js';

const CompactBusinessLogo = ({ name, logoUrl }) => {
    const [imgFailed, setImgFailed] = useState(false);
    const showImage = Boolean(logoUrl) && !imgFailed;

    if (showImage) {
        return (
            <img
                src={logoUrl}
                alt=""
                className="job-compact-card__logo job-compact-card__logo--image"
                onError={() => setImgFailed(true)}
            />
        );
    }

    return (
        <span className="job-compact-card__logo" aria-hidden="true">
            {getBusinessInitial(name)}
        </span>
    );
};

const JobCompactCard = ({ job, active = false, searchSuffix = '', nearMe = false }) => {
    const jobTypeOptions = useJobTypeOptions();
    const businessName = job.business?.name || 'Công ty';
    const businessLogoUrl = job.business?.logoUrl || null;
    const distance = getJobDistanceDisplay(job.distanceKm, nearMe);
    const hired = hasHiredJob(job);
    const applied = hasAppliedToJob(job);
    const invited = hasInvitedToJob(job);
    const vacancyLabel = formatVacancyLabel(job);
    const isVacancyFull = vacancyLabel === 'Đã hết vị trí';
    const shiftsLabel = formatJobShiftsLabel(job.shifts);
    const jobTypeLabel = formatJobTypeLabels(job.jobType, jobTypeOptions);

    return (
        <Link
            to={`${getJobDetailPath(job.id)}${searchSuffix}`}
            className={`job-compact-card${active ? ' job-compact-card--active' : ''}`}
            aria-current={active ? 'true' : undefined}
        >
            <CompactBusinessLogo
                key={`${job.id}-${businessLogoUrl || ''}`}
                name={businessName}
                logoUrl={businessLogoUrl}
            />

            <div className="job-compact-card__body">
                <h3 className="job-compact-card__title">{job.title}</h3>
                <p className="job-compact-card__company">{businessName}</p>

                <div className="job-compact-card__meta">
                    <span className="job-compact-card__meta-item">
                        <MapPinIcon width={14} height={14} />
                        <span className="job-compact-card__meta-text">
                            {formatLocation(job.location)}
                        </span>
                    </span>
                    {distance && (
                        <span
                            className={`job-compact-card__meta-item job-compact-card__distance${
                                distance.variant === 'outside'
                                    ? ' job-compact-card__distance--outside'
                                    : ''
                            }`}
                        >
                            {distance.label}
                        </span>
                    )}
                    {job.urgent && (
                        <span className="job-compact-card__meta-item job-compact-card__urgent">
                            Tuyển gấp
                        </span>
                    )}
                    {hired && (
                        <span className="job-compact-card__meta-item job-compact-card__hired">
                            Đã nhận việc
                        </span>
                    )}
                    {applied && !hired && (
                        <span className="job-compact-card__meta-item job-compact-card__applied">
                            Đã ứng tuyển
                        </span>
                    )}
                    {invited && !hired && !applied && (
                        <span className="job-compact-card__meta-item job-compact-card__invited">
                            Đã được mời
                        </span>
                    )}
                    <span className="job-compact-card__meta-item job-compact-card__salary">
                        {formatSalary(job.salaryMin, job.salaryMax)}
                    </span>
                    {shiftsLabel && (
                        <span
                            className="job-compact-card__meta-item job-compact-card__shifts"
                            title={shiftsLabel}
                        >
                            <ClockIcon width={14} height={14} />
                            <span className="job-compact-card__meta-text">{shiftsLabel}</span>
                        </span>
                    )}
                    {jobTypeLabel && (
                        <span className="job-compact-card__meta-item">
                            <BriefcaseIcon width={14} height={14} />
                            {jobTypeLabel}
                        </span>
                    )}
                    {vacancyLabel && (
                        <span
                            className={`job-compact-card__meta-item job-compact-card__vacancy${
                                isVacancyFull ? ' job-compact-card__vacancy--full' : ''
                            }`}
                        >
                            <UsersIcon width={14} height={14} />
                            <span className="job-compact-card__meta-text">{vacancyLabel}</span>
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
};

export default JobCompactCard;
