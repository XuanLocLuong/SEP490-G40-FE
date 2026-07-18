import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    formatJobType,
    formatSalary,
    formatLocation,
    getBusinessInitial,
    hasAppliedToJob,
} from '../../utils/formatters.js';
import { getJobDistanceDisplay } from '../../utils/jobQuery.js';
import { MapPinIcon, BriefcaseIcon } from '../common/icons.jsx';
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
    const businessName = job.business?.name || 'Công ty';
    const businessLogoUrl = job.business?.logoUrl || null;
    const distance = getJobDistanceDisplay(job.distanceKm, nearMe);
    const applied = hasAppliedToJob(job);

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
                        {formatLocation(job.location)}
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
                    {applied && (
                        <span className="job-compact-card__meta-item job-compact-card__applied">
                            Đã ứng tuyển
                        </span>
                    )}
                    <span className="job-compact-card__meta-item job-compact-card__salary">
                        {formatSalary(job.salaryMin, job.salaryMax)}
                    </span>
                    {formatJobType(job.jobType) && (
                        <span className="job-compact-card__meta-item">
                            <BriefcaseIcon width={14} height={14} />
                            {formatJobType(job.jobType)}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
};

export default JobCompactCard;
