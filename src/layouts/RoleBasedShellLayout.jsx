import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/authContext.js';
import { USER_ROLES } from '../utils/Constants.jsx';
import { ROUTES } from '../routes/path.js';
import CandidateLayout from './CandidateLayout.jsx';
import RecruiterLayout from './RecruiterLayout.jsx';
import InternalLayout from './InternalLayout.jsx';

/**
 * Chọn layout theo role đang login — dùng cho route dùng chung nhiều role
 * (ví dụ hồ sơ public candidate) mà vẫn giữ sidebar đúng vai trò.
 */
const RoleBasedShellLayout = () => {
    const { auth } = useAuth();

    switch (auth?.role) {
        case USER_ROLES.CANDIDATE:
            return <CandidateLayout />;
        case USER_ROLES.RECRUITER:
            return <RecruiterLayout />;
        case USER_ROLES.POST_MANAGER:
        case USER_ROLES.MANUAL_CHECK_TEAM:
        case USER_ROLES.ADMIN:
            return <InternalLayout />;
        default:
            return <Navigate to={ROUTES.LOGIN} replace />;
    }
};

export default RoleBasedShellLayout;
