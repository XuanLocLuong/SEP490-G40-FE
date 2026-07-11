import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/authContext.js';
import { ROUTES } from '../../routes/path.js';
import { USER_ROLES } from '../../utils/Constants.jsx';
import { setBookmarkReturnPath } from '../../utils/bookmarkStorage.js';

const JobApplyButton = ({ jobId, className, label = 'Ứng tuyển ngay' }) => {
    const { auth } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    if (auth && auth.role !== USER_ROLES.CANDIDATE) {
        return null;
    }

    const handleClick = (e) => {
        e.stopPropagation();

        if (!auth) {
            setBookmarkReturnPath(`${location.pathname}${location.search}`);
            navigate(ROUTES.LOGIN);
            return;
        }

        // TODO: wire apply API / job detail flow when ready.
        void jobId;
    };

    return (
        <button
            type="button"
            className={className}
            onClick={handleClick}
            title={auth ? label : 'Đăng nhập để ứng tuyển'}
        >
            {label}
        </button>
    );
};

export default JobApplyButton;
