import {
    formatJobType,
    formatSalary,
    formatLocation,
    formatRelativeTime,
    getBusinessInitial,
} from '../../utils/formatters.js';
import { MapPinIcon, ClockIcon } from '../common/icons.jsx';
import JobBookmarkButton from './JobBookmarkButton.jsx';
import JobApplyButton from './JobApplyButton.jsx';
import JobDetailLink from './JobDetailLink.jsx';
import '../../assets/styles/JobListItemStyle.css';

const JobListItem = ({ job }) => {
    const businessName = job.business?.name || 'Công ty';
    const tagLabel = formatJobType(job.jobType);

    return (
        <article className="job-list-item">
            <div className="job-list-item__header">
                <div className="job-list-item__brand">
                    <span className="job-list-item__logo" aria-hidden="true">
                        {getBusinessInitial(businessName)}
                    </span>
                    <div>
                        <h3 className="job-list-item__title">{job.title}</h3>
                        <p className="job-list-item__company">{businessName}</p>
                    </div>
                </div>
                <JobBookmarkButton jobId={job.id} className="job-list-item__bookmark" />
            </div>

            {(tagLabel || job.urgent || job.distanceKm != null) && (
                <div className="job-list-item__tags">
                    {tagLabel && <span className="job-list-item__tag">{tagLabel}</span>}
                    {job.urgent && (
                        <span className="job-list-item__tag job-list-item__tag--urgent">
                            Tuyển gấp
                        </span>
                    )}
                    {job.distanceKm != null && (
                        <span className="job-list-item__tag">
                            Cách {job.distanceKm.toFixed(1)}km
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
                <span className="job-list-item__info-item">
                    <ClockIcon width={16} height={16} />
                    {formatRelativeTime(job.createdAt)}
                </span>
            </div>

            <div className="job-list-item__actions">
                <JobDetailLink jobId={job.id} className="job-list-item__link-btn" />
                <JobApplyButton
                    jobId={job.id}
                    className="btn btn--primary job-list-item__apply"
                />
            </div>
        </article>
    );
};

export default JobListItem;
