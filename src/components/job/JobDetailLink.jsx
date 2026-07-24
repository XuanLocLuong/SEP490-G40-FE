import { Link, useLocation } from 'react-router-dom';
import { getJobDetailPath } from '../../routes/path.js';
import { useAuth } from '../../contexts/authContext.js';
import { resolveJobDetailBack } from '../../utils/jobNavReturn.js';

const JobDetailLink = ({ jobId, className, children = 'Xem chi tiết' }) => {
    const location = useLocation();
    const { auth } = useAuth();

    const search = location.search || '';
    const fromPath = `${location.pathname}${search}`;

    const handleClick = (e) => {
        e.stopPropagation();
        resolveJobDetailBack({ fromPath, role: auth?.role });
    };

    return (
        <Link
            to={`${getJobDetailPath(jobId)}${search}`}
            state={{ from: fromPath }}
            className={className}
            onClick={handleClick}
        >
            {children}
        </Link>
    );
};

export default JobDetailLink;
