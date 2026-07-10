import { USER_ROLES } from '../utils/Constants.jsx';

// Tập trung toàn bộ path ở đây — mọi nơi khác import từ đây, không hardcode string route nữa.
export const ROUTES = {
    LANDING: '/',
    LOGIN: '/login',
    REGISTER: '/register',

    CANDIDATE_HOME: '/candidate',
    RECRUITER_HOME: '/recruiter',
    POST_MANAGER_HOME: '/post-manager',
    MANUAL_CHECK_HOME: '/manual-check',
    ADMIN_HOME: '/admin',
};

// Dùng sau khi login / khi vào route không tồn tại để biết đá user về đâu.
export const getHomePathByRole = (role) => {
    switch (role) {
        case USER_ROLES.CANDIDATE:
            return ROUTES.CANDIDATE_HOME;
        case USER_ROLES.RECRUITER:
            return ROUTES.RECRUITER_HOME;
        case USER_ROLES.POST_MANAGER:
            return ROUTES.POST_MANAGER_HOME;
        case USER_ROLES.MANUAL_CHECK_TEAM:
            return ROUTES.MANUAL_CHECK_HOME;
        case USER_ROLES.ADMIN:
            return ROUTES.ADMIN_HOME;
        default:
            return ROUTES.LANDING;
    }
};
