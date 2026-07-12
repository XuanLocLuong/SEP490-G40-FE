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
import '../../assets/styles/JobCardStyle.css';

const JobCard = ({ job }) => {
    const businessName = job.business?.name || 'Công ty';
    const tagLabel = formatJobType(job.jobType);

    return (
        <article className="job-card">
            <div className="job-card__top">
                <div className="job-card__brand">
                    <span className="job-card__logo" aria-hidden="true">
                        {getBusinessInitial(businessName)}
                    </span>
                    <div className="job-card__headings">
                        <h3 className="job-card__title">{job.title}</h3>
                        <p className="job-card__company">{businessName}</p>
                    </div>
                </div>
                <JobBookmarkButton jobId={job.id} className="job-card__bookmark" />
            </div>

            <div className="job-card__meta">
                <span className="job-card__meta-item">
                    <MapPinIcon width={16} height={16} />
                    {formatLocation(job.location)}
                </span>
                {job.urgent && (
                    <span className="job-card__meta-item job-card__meta-item--urgent">
                        Tuyển gấp
                    </span>
                )}
            </div>

            <p className="job-card__salary">{formatSalary(job.salaryMin, job.salaryMax)}</p>

            <div className="job-card__footer">
                <div className="job-card__footer-meta">
                    {tagLabel && <span className="job-card__tag">{tagLabel}</span>}
                    <span className="job-card__posted">
                        <ClockIcon width={14} height={14} />
                        {formatRelativeTime(job.createdAt)}
                    </span>
                </div>
            </div>

            <div className="job-card__actions">
                <JobDetailLink jobId={job.id} className="job-card__detail-link" />
                <JobApplyButton jobId={job.id} className="btn btn--primary job-card__apply" />
            </div>
        </article>
    );
};

export default JobCard;
