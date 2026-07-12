import { Link, useLocation } from 'react-router-dom';
import { getJobDetailPath } from '../../routes/path.js';

const JobDetailLink = ({ jobId, className, children = 'Xem chi tiết' }) => {
    const location = useLocation();

    return (
        <Link
            to={getJobDetailPath(jobId)}
            state={{ from: `${location.pathname}${location.search}` }}
            className={className}
            onClick={(e) => e.stopPropagation()}
        >
            {children}
        </Link>
    );
};

export default JobDetailLink;
