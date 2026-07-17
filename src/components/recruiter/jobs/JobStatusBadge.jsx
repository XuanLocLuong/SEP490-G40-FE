import { JOB_STATUS_LABELS } from '../../../constants/jobPost.js';

const STATUS_CLASS = {
    DRAFT: 'job-status-badge--draft',
    PENDING_REVIEW: 'job-status-badge--pending',
    OPEN: 'job-status-badge--open',
    CLOSED: 'job-status-badge--closed',
    REJECTED: 'job-status-badge--rejected',
    BLOCKED: 'job-status-badge--blocked',
    REVISION_REQUESTED: 'job-status-badge--revision',
};

const JobStatusBadge = ({ status }) => {
    const label = JOB_STATUS_LABELS[status] || status || '—';
    const className = STATUS_CLASS[status] || 'job-status-badge--default';

    return <span className={`job-status-badge ${className}`}>{label}</span>;
};

export default JobStatusBadge;
