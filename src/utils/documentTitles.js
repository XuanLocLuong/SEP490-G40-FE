import { ROUTES } from '../routes/path.js';

export const APP_NAME = 'JobLink';

/** Format: "Trang | JobLink" — landing chỉ "JobLink". */
export const formatDocumentTitle = (pageTitle) => {
    const title = String(pageTitle || '').trim();
    return title ? `${title} | ${APP_NAME}` : APP_NAME;
};

const EXACT_TITLES = {
    [ROUTES.LANDING]: '',
    [ROUTES.LOGIN]: 'Đăng nhập',
    [ROUTES.REGISTER]: 'Đăng ký',
    [ROUTES.VERIFY_EMAIL]: 'Xác thực email',
    [ROUTES.FORGOT_PASSWORD]: 'Quên mật khẩu',
    [ROUTES.RESET_PASSWORD]: 'Đặt lại mật khẩu',
    [ROUTES.JOB_LIST]: 'Việc làm',
    [ROUTES.TOP_RECRUITERS]: 'Nhà tuyển dụng hàng đầu',

    [ROUTES.CANDIDATE_HOME]: 'Trang chủ ứng viên',
    [ROUTES.CANDIDATE_PROFILE]: 'Hồ sơ ứng viên',
    [ROUTES.CANDIDATE_AVAILABILITY]: 'Lịch rảnh',
    [ROUTES.CANDIDATE_INVITATIONS]: 'Lời mời ứng tuyển',
    [ROUTES.CANDIDATE_APPLICATION_HISTORY]: 'Lịch sử ứng tuyển',
    [ROUTES.CANDIDATE_TRUST_SCORE]: 'Điểm uy tín',
    [ROUTES.CANDIDATE_REVIEWS]: 'Đánh giá nhận được',
    [ROUTES.CANDIDATE_NOTIFICATIONS]: 'Thông báo',
    [ROUTES.CANDIDATE_SETTINGS]: 'Cài đặt tài khoản',
    [ROUTES.CANDIDATE_MESSAGES]: 'Tin nhắn',

    [ROUTES.RECRUITER_HOME]: 'Trang chủ nhà tuyển dụng',
    [ROUTES.RECRUITER_PROFILE]: 'Hồ sơ nhà tuyển dụng',
    [ROUTES.RECRUITER_VERIFICATION]: 'Xác minh doanh nghiệp',
    [ROUTES.RECRUITER_CREATE_JOB]: 'Đăng tin tuyển dụng',
    [ROUTES.RECRUITER_MY_JOBS]: 'Việc của tôi',
    [ROUTES.RECRUITER_APPLICANTS]: 'Danh sách ứng viên',
    [ROUTES.RECRUITER_INVITATIONS]: 'Lời mời',
    [ROUTES.RECRUITER_JOBLINK_SUGGESTIONS]: 'Gợi ý ứng viên',
    [ROUTES.RECRUITER_ANALYTICS]: 'Phân tích tuyển dụng',
    [ROUTES.RECRUITER_TRUST_SCORE]: 'Điểm uy tín',
    [ROUTES.RECRUITER_NOTIFICATIONS]: 'Thông báo',
    [ROUTES.RECRUITER_SETTINGS]: 'Cài đặt tài khoản',
    [ROUTES.RECRUITER_ALL_JOBS]: 'Tất cả việc làm',
    [ROUTES.RECRUITER_MESSAGES]: 'Tin nhắn',

    [ROUTES.POST_MANAGER_HOME]: 'Giám sát bài đăng',
    [ROUTES.POST_MANAGER_QUEUE]: 'Hàng chờ kiểm duyệt',
    [ROUTES.POST_MANAGER_REPORTS]: 'Báo cáo và khiếu nại',
    [ROUTES.POST_MANAGER_ANALYTICS]: 'Giám sát bài đăng',
    [ROUTES.POST_MANAGER_SETTINGS]: 'Cài đặt tài khoản',
    [ROUTES.POST_MANAGER_URGENT_JOBS]: 'Tin tuyển gấp',

    [ROUTES.MANUAL_CHECK_HOME]: 'Bảng điều khiển',
    [ROUTES.MANUAL_CHECK_ACCOUNTS]: 'Quản lý tài khoản',
    [ROUTES.MANUAL_CHECK_VERIFICATION]: 'Duyệt xác minh',
    [ROUTES.MANUAL_CHECK_REVIEWS]: 'Kiểm duyệt đánh giá',
    [ROUTES.MANUAL_CHECK_SETTINGS]: 'Cài đặt tài khoản',

    [ROUTES.ADMIN_HOME]: 'Thống kê toàn hệ thống',
    [ROUTES.ADMIN_ANALYTICS]: 'Thống kê toàn hệ thống',
    [ROUTES.ADMIN_SKILLS]: 'Quản lý kỹ năng',
    [ROUTES.ADMIN_JOB_TYPES]: 'Quản lý lĩnh vực',
    [ROUTES.ADMIN_BUSINESS_TYPES]: 'Loại hình doanh nghiệp',
    [ROUTES.ADMIN_TRUST_SCORE_RULES]: 'Quy tắc điểm uy tín',
    [ROUTES.ADMIN_BLACKLIST_KEYWORDS]: 'Cấu hình từ cấm',
    [ROUTES.ADMIN_SYSTEM_CONFIG]: 'Cấu hình trọng số',
    [ROUTES.ADMIN_ACCOUNTS]: 'Quản lý tài khoản',
    [ROUTES.ADMIN_AUDIT_LOG]: 'Nhật ký hoạt động',
    [ROUTES.ADMIN_SETTINGS]: 'Cài đặt tài khoản',
};

const JOB_LIST_SECTION_TITLES = {
    urgent: 'Việc làm tuyển gấp',
    ai: 'Gợi ý việc làm',
    interactions: 'Lịch sử tương tác',
};

/**
 * Resolve Vietnamese page title (without brand suffix) from location.
 */
export const resolvePageTitle = (pathname, search = '') => {
    const path = pathname || '/';

    if (path === ROUTES.JOB_LIST || path === '/jobs') {
        const section = new URLSearchParams(search).get('section');
        if (section && JOB_LIST_SECTION_TITLES[section]) {
            return JOB_LIST_SECTION_TITLES[section];
        }
        return EXACT_TITLES[ROUTES.JOB_LIST];
    }

    if (Object.prototype.hasOwnProperty.call(EXACT_TITLES, path)) {
        return EXACT_TITLES[path];
    }

    if (/^\/jobs\/[^/]+$/.test(path)) return 'Chi tiết việc làm';
    if (/^\/business\/[^/]+$/.test(path)) return 'Hồ sơ doanh nghiệp';
    if (/^\/candidates\/[^/]+$/.test(path)) return 'Hồ sơ ứng viên';
    if (/^\/recruiter\/jobs\/[^/]+\/edit$/.test(path)) return 'Chỉnh sửa tin tuyển dụng';
    if (/^\/recruiter\/analytics\/jobs\/[^/]+$/.test(path)) return 'Phân tích tin tuyển dụng';

    return 'Trang';
};

export const getDocumentTitleForLocation = (pathname, search = '') =>
    formatDocumentTitle(resolvePageTitle(pathname, search));
