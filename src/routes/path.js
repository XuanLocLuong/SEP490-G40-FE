import { USER_ROLES } from '../utils/Constants.jsx';

// Tập trung toàn bộ path ở đây — mọi nơi khác import từ đây, không hardcode string route nữa.
export const ROUTES = {
    LANDING: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    VERIFY_EMAIL: '/verify-email',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    JOB_LIST: '/jobs',
    JOB_DETAIL: '/jobs/:jobId',
    BUSINESS_PROFILE: '/business/:businessId',
    CANDIDATE_PUBLIC_PROFILE: '/candidates/:candidateId',
    TOP_RECRUITERS: '/top-recruiters',

    CANDIDATE_HOME: '/candidate',
    RECRUITER_HOME: '/recruiter',
    POST_MANAGER_HOME: '/post-manager',
    MANUAL_CHECK_HOME: '/manual-check',
    ADMIN_HOME: '/admin',
    ADMIN_ACCOUNTS: '/admin/accounts',
    /** List JobLink gợi ý — tái dùng JobListPage với ?section=ai */
    CANDIDATE_AI_SUGGESTIONS: '/jobs?section=ai',
    /** List lịch sử tương tác VIEW/SAVE/APPLY */
    CANDIDATE_INTERACTIONS: '/jobs?section=interactions',
    /** List việc tuyển gấp */
    JOB_LIST_URGENT: '/jobs?section=urgent',
    CANDIDATE_PROFILE: '/candidate/profile',
    CANDIDATE_AVAILABILITY: '/candidate/availability',
    CANDIDATE_INVITATIONS: '/candidate/invitations',
    CANDIDATE_MESSAGES: '/candidate/messages',
    CANDIDATE_NOTIFICATIONS: '/candidate/notifications',
    CANDIDATE_SETTINGS: '/candidate/settings',
    CANDIDATE_APPLICATION_HISTORY: '/candidate/applications',

    RECRUITER_CREATE_JOB: '/recruiter/jobs/new',
    RECRUITER_EDIT_JOB: '/recruiter/jobs/:jobId/edit',
    RECRUITER_MY_JOBS: '/recruiter/jobs',
    RECRUITER_APPLICANTS: '/recruiter/applicants',
    RECRUITER_INVITATIONS: '/recruiter/invitations',
    RECRUITER_JOBLINK_SUGGESTIONS: '/recruiter/joblink-suggestions',
    RECRUITER_ANALYTICS: '/recruiter/analytics',
    RECRUITER_JOB_ANALYTICS: '/recruiter/analytics/jobs/:jobId',
    RECRUITER_MESSAGES: '/recruiter/messages',
    RECRUITER_TRUST_SCORE: '/recruiter/trust-score',
    RECRUITER_ALL_JOBS: '/recruiter/all-jobs',
    RECRUITER_PROFILE: '/recruiter/profile',
    RECRUITER_VERIFICATION: '/recruiter/verification',
    RECRUITER_SETTINGS: '/recruiter/settings',
    RECRUITER_NOTIFICATIONS: '/recruiter/notifications',

    POST_MANAGER_QUEUE: '/post-manager/queue',
    POST_MANAGER_URGENT_JOBS: '/post-manager/urgent-jobs',
    POST_MANAGER_ANALYTICS: '/post-manager/analytics',
    POST_MANAGER_REPORTS: '/post-manager/reports',
    POST_MANAGER_SETTINGS: '/post-manager/settings',

    MANUAL_CHECK_ACCOUNTS: '/manual-check/accounts',
    MANUAL_CHECK_VERIFICATION: '/manual-check/verification',
    MANUAL_CHECK_REPORTS: '/manual-check/reports',
    MANUAL_CHECK_SETTINGS: '/manual-check/settings',

    ADMIN_SYSTEM_CONFIG: '/admin/system-config',
    ADMIN_SKILLS: '/admin/skills',
    ADMIN_TRUST_SCORE_RULES: '/admin/trust-score-rules',
    ADMIN_AUDIT_LOG: '/admin/audit-log',
    ADMIN_ESCALATIONS: '/admin/escalations',
    ADMIN_ANALYTICS: '/admin/analytics',
    ADMIN_SETTINGS: '/admin/settings',
};

export const getJobDetailPath = (jobId) => `/jobs/${jobId}`;

export const getRecruiterEditJobPath = (jobId) => `/recruiter/jobs/${jobId}/edit`;

/**
 * @param {string|number} jobId
 * @param {{ from?: 'my-jobs' | 'analytics' }} [options]
 */
export const getRecruiterApplicantsPath = (jobId, { from } = {}) => {
    const params = new URLSearchParams({ jobId: String(jobId) });
    if (from) params.set('from', String(from));
    return `${ROUTES.RECRUITER_APPLICANTS}?${params.toString()}`;
};

export const getRecruiterJobAnalyticsPath = (jobId) =>
    `/recruiter/analytics/jobs/${jobId}`;

/** My Jobs list — optional tab, jobId (highlight card), from (vd. overview → hiện nút quay lại). */
export const getRecruiterMyJobsPath = ({ tab, jobId, from } = {}) => {
    const params = new URLSearchParams();
    if (tab) params.set('tab', String(tab));
    if (jobId != null && jobId !== '') params.set('jobId', String(jobId));
    if (from) params.set('from', String(from));
    const qs = params.toString();
    return qs ? `${ROUTES.RECRUITER_MY_JOBS}?${qs}` : ROUTES.RECRUITER_MY_JOBS;
};

/**
 * @param {string|number} jobId
 * @param {{ from?: 'my-jobs' | 'analytics', fromMyJobs?: boolean }} [options]
 * fromMyJobs giữ tương thích gọi cũ → from=my-jobs
 */
export const getRecruiterInvitationsPath = (
    jobId,
    { from, fromMyJobs = false } = {}
) => {
    const params = new URLSearchParams({ jobId: String(jobId) });
    const fromValue = from || (fromMyJobs ? 'my-jobs' : null);
    if (fromValue) params.set('from', String(fromValue));
    return `${ROUTES.RECRUITER_INVITATIONS}?${params.toString()}`;
};

export const getCandidateJobChatPath = (jobId) =>
    `${ROUTES.CANDIDATE_MESSAGES}?jobId=${jobId}`;

export const getCandidatePublicProfilePath = (candidateId) => `/candidates/${candidateId}`;

/** Trang công ty công khai cho guest/candidate. */
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

/** Tài khoản & bảo mật (UC-07 / đổi mật khẩu) theo role. */
export const getSettingsPathByRole = (role) => {
    switch (role) {
        case USER_ROLES.CANDIDATE:
            return ROUTES.CANDIDATE_SETTINGS;
        case USER_ROLES.RECRUITER:
            return ROUTES.RECRUITER_SETTINGS;
        case USER_ROLES.POST_MANAGER:
            return ROUTES.POST_MANAGER_SETTINGS;
        case USER_ROLES.MANUAL_CHECK_TEAM:
            return ROUTES.MANUAL_CHECK_SETTINGS;
        case USER_ROLES.ADMIN:
            return ROUTES.ADMIN_SETTINGS;
        default:
            return ROUTES.LANDING;
    }
};
