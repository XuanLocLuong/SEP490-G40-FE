import { Link, useLocation } from 'react-router-dom';
import { getJobDetailPath } from '../../routes/path.js';
import { useAuth } from '../../contexts/authContext.js';
import { resolveJobDetailBack } from '../../utils/jobNavReturn.js';
import { HOME_SCROLL_STATE_KEY } from '../../utils/homeSections.js';

/** Normalize to `?foo=bar` or empty string. */
const normalizeSearch = (value) => {
    if (value == null || value === '') return '';
    const raw = String(value);
    return raw.startsWith('?') ? raw : `?${raw}`;
};

/**
 * @param {string} [search] - Optional query override (e.g. `?section=urgent`).
 *   When omitted, keeps current `location.search` (list filters / section).
 * @param {string} [homeSectionId] - Homepage section id for scroll-on-return.
 */
const JobDetailLink = ({
    jobId,
    className,
    children = 'Xem chi tiết',
    search: searchProp,
    homeSectionId,
}) => {
    const location = useLocation();
    const { auth } = useAuth();

    const search =
        searchProp != null ? normalizeSearch(searchProp) : location.search || '';
    const fromPath = `${location.pathname}${location.search || ''}`;

    const handleClick = (e) => {
        e.stopPropagation();
        resolveJobDetailBack({
            fromPath,
            scrollToSection: homeSectionId,
            role: auth?.role,
        });
    };

    const linkState = { from: fromPath };
    if (homeSectionId) {
        linkState[HOME_SCROLL_STATE_KEY] = homeSectionId;
    }

    return (
        <Link
            to={`${getJobDetailPath(jobId)}${search}`}
            state={linkState}
            className={className}
            onClick={handleClick}
        >
            {children}
        </Link>
    );
};

export default JobDetailLink;
