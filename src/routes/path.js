import { USER_ROLES } from '../utils/Constants.jsx';

// Tập trung toàn bộ path ở đây — mọi nơi khác import từ đây, không hardcode string route nữa.
export const ROUTES = {
    LANDING: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    JOB_LIST: '/jobs',
    JOB_DETAIL: '/jobs/:jobId',

    CANDIDATE_HOME: '/candidate',
    RECRUITER_HOME: '/recruiter',
    POST_MANAGER_HOME: '/post-manager',
    MANUAL_CHECK_HOME: '/manual-check',
    ADMIN_HOME: '/admin',

    // ⚠️ Các path dưới đây CHƯA có Page/Route đăng ký trong AppRouter —
    // chỉ dùng làm target cho Sidebar nav theo đúng thiết kế. Bấm vào sẽ bị
    // catch-all route đá về lại trang chủ cho tới khi task tương ứng được code.
    CANDIDATE_AI_SUGGESTIONS: '/candidate/ai-suggestions',
    CANDIDATE_PROFILE: '/candidate/profile',
    CANDIDATE_AVAILABILITY: '/candidate/availability',
    CANDIDATE_INVITATIONS: '/candidate/invitations',
    CANDIDATE_MESSAGES: '/candidate/messages',
    CANDIDATE_NOTIFICATIONS: '/candidate/notifications',
    CANDIDATE_SETTINGS: '/candidate/settings',
    CANDIDATE_APPLICATION_HISTORY: '/candidate/applications',

    RECRUITER_CREATE_JOB: '/recruiter/jobs/new',
    RECRUITER_MY_JOBS: '/recruiter/jobs',
    RECRUITER_APPLICANTS: '/recruiter/applicants',
    RECRUITER_AI_SUGGESTIONS: '/recruiter/ai-suggestions',
    RECRUITER_ANALYTICS: '/recruiter/analytics',
    RECRUITER_MESSAGES: '/recruiter/messages',
    RECRUITER_TRUST_SCORE: '/recruiter/trust-score',
    RECRUITER_ALL_JOBS: '/recruiter/all-jobs',
    RECRUITER_PROFILE: '/recruiter/profile',
    RECRUITER_SETTINGS: '/recruiter/settings',

    POST_MANAGER_QUEUE: '/post-manager/queue',
    POST_MANAGER_URGENT_JOBS: '/post-manager/urgent-jobs',
    POST_MANAGER_ANALYTICS: '/post-manager/analytics',
    POST_MANAGER_REPORTS: '/post-manager/reports',
    POST_MANAGER_SETTINGS: '/post-manager/settings',

    MANUAL_CHECK_ACCOUNTS: '/manual-check/accounts',
    MANUAL_CHECK_VERIFICATION: '/manual-check/verification',
    MANUAL_CHECK_REPORTS: '/manual-check/reports',

    ADMIN_SYSTEM_CONFIG: '/admin/system-config',
    ADMIN_AUDIT_LOG: '/admin/audit-log',
    ADMIN_ESCALATIONS: '/admin/escalations',
    ADMIN_ANALYTICS: '/admin/analytics',
};

export const getJobDetailPath = (jobId) => `/jobs/${jobId}`;

export const getCandidateJobChatPath = (jobId) =>
    `${ROUTES.CANDIDATE_MESSAGES}?jobId=${jobId}`;

/** Placeholder — trang công ty công khai; cập nhật khi có route thật. */
export const getBusinessProfilePath = (businessId) => `/business/${businessId}`;

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
