import { Link, useLocation } from 'react-router-dom';
import { getJobDetailPath } from '../../routes/path.js';

const JobDetailLink = ({ jobId, className, children = 'Xem chi tiết' }) => {
    const location = useLocation();

    const search = location.search || '';

    return (
        <Link
            to={`${getJobDetailPath(jobId)}${search}`}
            state={{ from: `${location.pathname}${search}` }}
            className={className}
            onClick={(e) => e.stopPropagation()}
        >
            {children}
        </Link>
    );
};

export default JobDetailLink;
