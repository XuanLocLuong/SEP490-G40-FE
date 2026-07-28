import { Link, useLocation } from 'react-router-dom';
import { getBusinessProfilePath } from '../../routes/path.js';
import { useAuth } from '../../contexts/authContext.js';
import { resolveBusinessProfileBack } from '../../utils/businessNavReturn.js';

/**
 * Link to public business profile with return navigation state.
 */
const BusinessProfileLink = ({
    businessId,
    className,
    children,
    label = 'Quay lại',
    title,
    onClick,
}) => {
    const location = useLocation();
    const { auth } = useAuth();
    const fromPath = `${location.pathname}${location.search || ''}`;

    if (businessId == null) return null;

    const handleClick = (e) => {
        onClick?.(e);
        resolveBusinessProfileBack({ fromPath, label, role: auth?.role });
    };

    return (
        <Link
            to={getBusinessProfilePath(businessId)}
            state={{ from: fromPath, label }}
            className={className}
            title={title}
            onClick={handleClick}
        >
            {children}
        </Link>
    );
};

export default BusinessProfileLink;
