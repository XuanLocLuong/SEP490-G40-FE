import { Link, useLocation } from 'react-router-dom';
import { getBusinessProfilePath } from '../../routes/path.js';
import { useAuth } from '../../contexts/authContext.js';
import { resolveBusinessProfileBack } from '../../utils/businessNavReturn.js';
import { HOME_SCROLL_STATE_KEY } from '../../utils/homeSections.js';

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
    homeSectionId,
}) => {
    const location = useLocation();
    const { auth } = useAuth();
    const fromPath = `${location.pathname}${location.search || ''}`;

    if (businessId == null) return null;

    const handleClick = (e) => {
        onClick?.(e);
        resolveBusinessProfileBack({
            fromPath,
            label,
            scrollToSection: homeSectionId,
            role: auth?.role,
        });
    };

    const linkState = { from: fromPath, label };
    if (homeSectionId) {
        linkState[HOME_SCROLL_STATE_KEY] = homeSectionId;
    }

    return (
        <Link
            to={getBusinessProfilePath(businessId)}
            state={linkState}
            className={className}
            title={title}
            onClick={handleClick}
        >
            {children}
        </Link>
    );
};

export default BusinessProfileLink;
