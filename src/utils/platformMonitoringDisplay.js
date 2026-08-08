/** Helpers for UC-47 Platform Monitoring dashboard (FE-only). */

export const USER_ROLE_OPTIONS = [
    { value: '', label: 'Tất cả vai trò' },
    { value: 'CANDIDATE', label: 'Ứng viên' },
    { value: 'RECRUITER', label: 'Nhà tuyển dụng' },
    { value: 'ADMIN', label: 'Quản trị viên' },
    { value: 'POST_MANAGER', label: 'Quản lý tin đăng' },
    { value: 'MANUAL_CHECK_TEAM', label: 'Đội xác minh thủ công' },
];

export const ACCOUNT_STATUS_OPTIONS = [
    { value: '', label: 'Tất cả trạng thái tài khoản' },
    { value: 'ACTIVE', label: 'Đang hoạt động' },
    { value: 'INACTIVE', label: 'Không hoạt động' },
    { value: 'SUSPENDED', label: 'Tạm khóa' },
    { value: 'BANNED', label: 'Cấm' },
];

export const JOB_STATUS_OPTIONS = [
    { value: '', label: 'Tất cả trạng thái tin' },
    { value: 'DRAFT', label: 'Nháp' },
    { value: 'PENDING_REVIEW', label: 'Chờ duyệt' },
    { value: 'OPEN', label: 'Đang mở' },
    { value: 'CLOSED', label: 'Đã đóng' },
    { value: 'REJECTED', label: 'Từ chối' },
    { value: 'BLOCKED', label: 'Bị chặn' },
    { value: 'REVISION_REQUESTED', label: 'Yêu cầu chỉnh sửa' },
];

/** Nhãn tiếng Việt cho key enum trong chart / breakdown. */
export const LABEL_MAPS = {
    role: {
        CANDIDATE: 'Ứng viên',
        RECRUITER: 'Nhà tuyển dụng',
        ADMIN: 'Quản trị viên',
        POST_MANAGER: 'Quản lý tin đăng',
        MANUAL_CHECK_TEAM: 'Đội xác minh',
    },
    accountStatus: {
        ACTIVE: 'Hoạt động',
        INACTIVE: 'Không hoạt động',
        SUSPENDED: 'Tạm khóa',
        BANNED: 'Cấm',
    },
    jobStatus: {
        DRAFT: 'Nháp',
        PENDING_REVIEW: 'Chờ duyệt',
        OPEN: 'Đang mở',
        CLOSED: 'Đã đóng',
        REJECTED: 'Từ chối',
        BLOCKED: 'Bị chặn',
        REVISION_REQUESTED: 'Yêu cầu sửa',
    },
    applicationStatus: {
        PENDING: 'Đang chờ',
        ACCEPTED: 'Được nhận',
        REJECTED: 'Từ chối',
        HIRED: 'Đã tuyển',
        CANCELLED: 'Đã hủy',
        COMPLETED: 'Hoàn thành',
    },
    reportStatus: {
        PENDING: 'Chờ xử lý',
        RESOLVED: 'Đã xử lý',
        REJECTED: 'Từ chối',
    },
    verificationStatus: {
        CCCD_PASSED: 'CCCD đạt',
        CCCD_REJECTED: 'CCCD từ chối',
        CCCD_MANUALLY: 'CCCD chờ duyệt tay',
        BUSINESS_PASSED: 'Doanh nghiệp đạt',
        BUSINESS_REJECTED: 'Doanh nghiệp từ chối',
        BUSINESS_MANUALLY: 'DN chờ duyệt tay',
        CANCELLED_BY_RETRY: 'Hủy do gửi lại',
    },
    emailStatus: {
        PENDING: 'Chờ gửi',
        QUEUED: 'Trong hàng đợi',
        SENT: 'Đã gửi',
        DELIVERED: 'Đã nhận',
        FAILED: 'Thất bại',
        ERROR: 'Lỗi',
        SKIPPED: 'Bỏ qua',
    },
};

export const NAV_ACTION_LABELS = {
    MANAGE_ACCOUNTS: 'Quản lý tài khoản',
    MONITOR_JOB_POST_METRICS: 'Chỉ số tin đăng',
    REVIEW_JOB_MODERATION: 'Duyệt tin tuyển',
    REVIEW_CONTENT_MODERATION: 'Duyệt đánh giá',
    REVIEW_REPORTED_JOB_POSTS: 'Báo cáo tin đăng',
    REVIEW_MODERATION_QUEUE: 'Hàng chờ duyệt tin & đánh giá',
    PROCESS_VERIFICATIONS: 'Xử lý xác minh',
    REVIEW_AUDIT_LOGS: 'Nhật ký hệ thống',
    MANAGE_SYSTEM_CONFIGURATIONS: 'Cấu hình hệ thống',
};

export const SEVERITY_LABELS = {
    INFO: 'Thông tin',
    WARNING: 'Cảnh báo',
    CRITICAL: 'Nghiêm trọng',
};

export const SECTION_LABELS = {
    users: 'Người dùng',
    jobs: 'Tin tuyển',
    applications: 'Đơn ứng tuyển',
    reports: 'Báo cáo',
    verification: 'Xác minh',
    moderation: 'Duyệt tin & đánh giá',
    aiModeration: 'Duyệt AI',
    communications: 'Email hệ thống',
    trends: 'Xu hướng',
    operationalHealth: 'Sức khỏe hệ thống',
};

export const HIRE_RATE_TOOLTIP =
    'Tỷ lệ tuyển = số lượt chuyển HIRED trong kỳ ÷ số đơn nộp trong kỳ × 100. Không tự tính lại trên dashboard nếu Backend đã trả.';

export const RECOMMENDATION_HIRE_RATE_TOOLTIP =
    'Tỷ lệ tuyển từ gợi ý = số lượt tuyển thành công có nguồn gợi ý trong kỳ ÷ số đơn từ gợi ý trong kỳ.';

export const AI_AUTO_APPROVE_TOOLTIP =
    'Tỷ lệ duyệt tự động = số quyết định duyệt tự động trong kỳ ÷ tổng yêu cầu kiểm duyệt tin trong kỳ (hệ thống tính).';

export const AI_HUMAN_AGREEMENT_TOOLTIP =
    'Mức khớp AI–người: tỷ lệ quyết định tay thống nhất với gợi ý/rủi ro AI trong kỳ (hệ thống tính).';

export const LABEL_MAPS_AI = {
    queueType: {
        AUTO_APPROVE: 'Duyệt tự động',
        GREEN: 'Hàng xanh',
        RED: 'Hàng đỏ',
        YELLOW: 'Hàng vàng',
    },
    aiRisk: {
        LOW: 'Rủi ro thấp',
        MEDIUM: 'Rủi ro trung bình',
        HIGH: 'Rủi ro cao',
        FAILED: 'AI chưa chấm được',
    },
    manualDecision: {
        APPROVE: 'Duyệt',
        APPROVED: 'Duyệt',
        REJECT: 'Từ chối',
        REJECTED: 'Từ chối',
        REVISION_REQUESTED: 'Yêu cầu sửa',
    },
    applicationSource: {
        UNKNOWN: 'Chưa rõ',
        ORGANIC: 'Tự nhiên',
        SEARCH: 'Tìm kiếm',
        RECOMMENDATION: 'Gợi ý',
        INVITATION: 'Lời mời',
    },
};

/** Stable colors for AI risk donut + caption. */
export const AI_RISK_COLORS = {
    LOW: '#16a34a',
    MEDIUM: '#d97706',
    HIGH: '#dc2626',
    FAILED: '#64748b',
};

export const AI_RISK_LEGEND = [
    { key: 'LOW', label: 'Rủi ro thấp — tin ổn hơn', color: AI_RISK_COLORS.LOW },
    { key: 'MEDIUM', label: 'Rủi ro trung bình', color: AI_RISK_COLORS.MEDIUM },
    { key: 'HIGH', label: 'Rủi ro cao — cần người xem kỹ', color: AI_RISK_COLORS.HIGH },
    {
        key: 'FAILED',
        label: 'AI chưa chấm được — lỗi / không có kết quả',
        color: AI_RISK_COLORS.FAILED,
    },
];

export const WARNING_META = {
    USER_INACTIVITY_SIGNAL: {
        title: 'Tài khoản ít hoạt động',
        detail: 'Chỉ mang tính phân tích — hệ thống chưa đổi trạng thái tài khoản.',
    },
    PENDING_REPORTS: {
        title: 'Báo cáo chờ xử lý',
        detail: 'Có tin đăng bị báo cáo. Thường do Đội Post Manager xử lý — Admin chỉ theo dõi.',
    },
    PENDING_VERIFICATIONS: {
        title: 'Xác minh chờ duyệt',
        detail: 'Có yêu cầu xác minh cần duyệt thủ công (Manual Check).',
    },
    PENDING_MODERATION: {
        title: 'Duyệt tin & đánh giá đang chờ',
        detail: 'Có tin tuyển hoặc đánh giá trong hàng chờ. Thường do Post Manager xử lý — Admin chỉ theo dõi.',
    },
    FAILED_EMAILS: {
        title: 'Email gửi thất bại',
        detail: 'Có thư hệ thống gửi không thành công.',
    },
    MONITORING_DATA_PARTIALLY_UNAVAILABLE: {
        title: 'Một số số liệu tạm thiếu',
        detail: 'Một nhóm dữ liệu trên dashboard tạm không truy xuất được.',
    },
    DATABASE_HEALTH_DOWN: {
        title: 'Sự cố lưu trữ dữ liệu',
        detail: 'Kiểm tra kết nối dữ liệu không đạt — cần kỹ thuật hỗ trợ.',
    },
};

/** Cảnh báo hạ tầng / meta dashboard — dành engineering, ẩn trên UI Admin. */
export const ADMIN_HIDDEN_WARNING_CODES = new Set([
    'MONITORING_DATA_PARTIALLY_UNAVAILABLE',
    'DATABASE_HEALTH_DOWN',
]);

export const filterAdminFacingWarnings = (warnings) =>
    (Array.isArray(warnings) ? warnings : []).filter(
        (w) => w?.code && !ADMIN_HIDDEN_WARNING_CODES.has(w.code)
    );

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MAX_REPORTING_DAYS = 366;

/** yyyy-MM-dd → Instant start of day (UTC). */
export const dateInputToFromInstant = (yyyyMmDd) => {
    if (!yyyyMmDd) return undefined;
    return `${yyyyMmDd}T00:00:00.000Z`;
};

/**
 * yyyy-MM-dd end date → exclusive Instant (start of next UTC day).
 * Matches BE half-open period: periodStart <= t < periodEnd.
 */
export const dateInputToExclusiveToInstant = (yyyyMmDd) => {
    if (!yyyyMmDd) return undefined;
    const next = new Date(`${yyyyMmDd}T00:00:00.000Z`);
    if (Number.isNaN(next.getTime())) return undefined;
    next.setUTCDate(next.getUTCDate() + 1);
    return next.toISOString();
};

export const instantToDateInput = (instant) => {
    if (!instant) return '';
    const d = new Date(instant);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
};

/** Exclusive periodEnd → last inclusive calendar day for date input. */
export const exclusiveToInclusiveDateInput = (periodEnd) => {
    if (!periodEnd) return '';
    const d = new Date(periodEnd);
    if (Number.isNaN(d.getTime())) return '';
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
};

export const validateMonitoringPeriod = (fromYmd, toYmd) => {
    if (!fromYmd && !toYmd) return null;
    const from = fromYmd ? new Date(`${fromYmd}T00:00:00.000Z`) : null;
    const toInclusive = toYmd ? new Date(`${toYmd}T00:00:00.000Z`) : null;
    if ((fromYmd && Number.isNaN(from.getTime())) || (toYmd && Number.isNaN(toInclusive.getTime()))) {
        return 'INVALID_MONITORING_PERIOD';
    }
    if (from && toInclusive && from.getTime() > toInclusive.getTime()) {
        return 'INVALID_MONITORING_PERIOD';
    }
    if (from && toInclusive) {
        const days = Math.floor((toInclusive - from) / MS_PER_DAY) + 1;
        if (days > MAX_REPORTING_DAYS) return 'MONITORING_PERIOD_TOO_LARGE';
    }
    return null;
};

export const formatInstantVi = (instant) => {
    if (!instant) return '—';
    const d = new Date(instant);
    if (Number.isNaN(d.getTime())) return String(instant);
    return d.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const formatCount = (value) => {
    const n = Number(value);
    if (Number.isNaN(n)) return '0';
    return n.toLocaleString('vi-VN');
};

/** Rate percent: null → Không có (per UC-47 docs). */
export const formatRatePercent = (value) => {
    if (value == null || value === '') return 'Không có';
    const n = Number(value);
    if (Number.isNaN(n)) return 'Không có';
    return `${n.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}%`;
};

export const isSectionAvailable = (section) =>
    section?.status === 'AVAILABLE' && section?.data != null;

export const entriesFromMap = (map) => {
    if (!map || typeof map !== 'object') return [];
    return Object.entries(map);
};

export const localizeKey = (key, labelMap) => {
    if (!key) return '';
    return labelMap?.[key] || labelMap?.[String(key).toUpperCase()] || String(key);
};
