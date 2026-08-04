import { ROUTES } from '../routes/path.js';

export const JOB_STATUS_OPTIONS = [
    { value: '', label: 'Tất cả' },
    { value: 'DRAFT', label: 'Nháp' },
    { value: 'PENDING_REVIEW', label: 'Chờ duyệt' },
    { value: 'OPEN', label: 'Đang mở' },
    { value: 'CLOSED', label: 'Đã đóng' },
    { value: 'REJECTED', label: 'Từ chối' },
    { value: 'BLOCKED', label: 'Bị chặn' },
    { value: 'REVISION_REQUESTED', label: 'Yêu cầu chỉnh sửa' },
];

export const MODERATION_STATUS_OPTIONS = [
    { value: '', label: 'Tất cả' },
    { value: 'PENDING', label: 'Đang chờ' },
    { value: 'DECIDED', label: 'Đã xử lý' },
    { value: 'OVERDUE', label: 'Quá hạn' },
    { value: 'NOT_REQUIRED', label: 'Không yêu cầu' },
];

export const AI_OUTCOME_OPTIONS = [
    { value: '', label: 'Tất cả' },
    { value: 'LOW', label: 'Rủi ro thấp' },
    { value: 'MEDIUM', label: 'Rủi ro trung bình' },
    { value: 'HIGH', label: 'Rủi ro cao' },
    { value: 'FAILED', label: 'AI lỗi' },
];

export const REPORT_STATUS_OPTIONS = [
    { value: '', label: 'Tất cả' },
    { value: 'PENDING', label: 'Đang chờ' },
    { value: 'RESOLVED', label: 'Đã xử lý' },
    { value: 'REJECTED', label: 'Từ chối' },
];

/** Chip cảnh báo: label VI; giữ code EN ở title/tooltip. */
export const SUSPICIOUS_INDICATOR_LABELS = {
    REPORT_FLAGGED: 'Bị gắn cờ báo cáo',
    PENDING_REPORTS: 'Báo cáo đang chờ',
    BUSINESS_SCAM_FLAGGED: 'Doanh nghiệp nghi vấn lừa đảo',
    AI_HIGH_RISK: 'AI rủi ro cao',
    AI_MEDIUM_RISK: 'AI rủi ro trung bình',
    RED_QUEUE: 'Hàng đợi đỏ',
    RULE_ENGINE_FAILED: 'Rule engine không đạt',
    OVERDUE_MODERATION: 'Kiểm duyệt quá hạn',
};

export const JOB_STATUS_LABELS = {
    DRAFT: 'Nháp',
    PENDING_REVIEW: 'Chờ duyệt',
    OPEN: 'Đang mở',
    CLOSED: 'Đã đóng',
    REJECTED: 'Từ chối',
    BLOCKED: 'Bị chặn',
    REVISION_REQUESTED: 'Yêu cầu chỉnh sửa',
};

export const MODERATION_STATUS_LABELS = {
    PENDING: 'Đang chờ',
    DECIDED: 'Đã xử lý',
    OVERDUE: 'Quá hạn',
    NOT_REQUIRED: 'Không yêu cầu',
};

export const REPORT_STATUS_LABELS = {
    NONE: 'Không có',
    PENDING: 'Đang chờ',
    RESOLVED: 'Đã xử lý',
    REJECTED: 'Từ chối',
    MIXED: 'Hỗn hợp',
};

export const REVIEW_DECISION_LABELS = {
    APPROVED: 'Đã duyệt',
    REJECTED: 'Từ chối',
    REVISION_REQUESTED: 'Yêu cầu chỉnh sửa',
};

export const AI_STATUS_LABELS = {
    COMPLETED: 'Hoàn tất',
    PENDING: 'Đang chờ',
    FAILED: 'Thất bại',
};

export const QUEUE_TYPE_LABELS = {
    GREEN_QUEUE: 'Hàng đợi xanh',
    RED_QUEUE: 'Hàng đợi đỏ',
    YELLOW_QUEUE: 'Hàng đợi vàng',
};

export const PERIOD_PRESET_OPTIONS = [
    { value: 7, label: '7 ngày qua' },
    { value: 30, label: '30 ngày qua' },
    { value: 90, label: '90 ngày qua' },
];

export const MODERATION_ACTION_HINTS = {
    JOB_REVIEW_QUEUE: {
        label: 'Mở hàng chờ duyệt tin',
        to: ROUTES.POST_MANAGER_QUEUE,
    },
    REPORT_REVIEW_QUEUE: {
        label: 'Mở hàng chờ báo cáo',
        to: ROUTES.POST_MANAGER_REPORTS,
    },
};

export const formatMetricsNumber = (value) => {
    if (value == null || value === '' || Number.isNaN(Number(value))) return '—';
    return Number(value).toLocaleString('vi-VN');
};

/** Compact KPI (vd 125.4K) giống design. */
export const formatMetricsCompact = (value) => {
    if (value == null || value === '' || Number.isNaN(Number(value))) return '—';
    const num = Number(value);
    if (Math.abs(num) >= 1_000_000) {
        return `${(num / 1_000_000).toFixed(num % 1_000_000 === 0 ? 0 : 1)}M`;
    }
    if (Math.abs(num) >= 1_000) {
        return `${(num / 1_000).toFixed(num % 1_000 === 0 ? 0 : 1)}K`;
    }
    return num.toLocaleString('vi-VN');
};

export const formatMetricsRate = (value) => {
    if (value == null || value === '' || Number.isNaN(Number(value))) return 'Không có dữ liệu';
    const num = Number(value);
    const text = Number.isInteger(num) ? String(num) : num.toFixed(1);
    return `${text}%`;
};

export const formatJobStatusLabel = (status) => {
    const value = String(status || '').toUpperCase();
    return JOB_STATUS_LABELS[value] || status || '—';
};

export const formatModerationStatusLabel = (status) => {
    const value = String(status || '').toUpperCase();
    return MODERATION_STATUS_LABELS[value] || status || '—';
};

export const formatReportStatusLabel = (status) => {
    const value = String(status || '').toUpperCase();
    return REPORT_STATUS_LABELS[value] || status || '—';
};

export const formatAiRiskLabel = (level) => {
    const value = String(level || '').toUpperCase();
    if (value === 'HIGH') return 'Rủi ro cao';
    if (value === 'MEDIUM') return 'Rủi ro trung bình';
    if (value === 'LOW') return 'Rủi ro thấp';
    if (value === 'FAILED') return 'AI lỗi';
    return level || '—';
};

export const formatAiStatusLabel = (status) => {
    const value = String(status || '').toUpperCase();
    return AI_STATUS_LABELS[value] || status || '—';
};

export const formatReviewDecisionLabel = (decision) => {
    const value = String(decision || '').toUpperCase();
    if (!value) return null;
    return REVIEW_DECISION_LABELS[value] || decision;
};

export const formatQueueTypeLabel = (queueType) => {
    const value = String(queueType || '').toUpperCase();
    return QUEUE_TYPE_LABELS[value] || queueType || '—';
};

export const formatMetricsHours = (value) => {
    if (value == null || value === '' || Number.isNaN(Number(value))) return 'Không có dữ liệu';
    const num = Number(value);
    const text = Number.isInteger(num) ? String(num) : num.toFixed(1);
    return `${text} giờ`;
};

export const formatMetricsDateTime = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString('vi-VN');
};

export const formatMetricsDateInputValue = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

/** Local date YYYY-MM-DD → ISO Instant start/end of day (UTC via toISOString). */
export const toMetricsInstantFromDate = (dateValue, endOfDay = false) => {
    if (!dateValue) return undefined;
    const suffix = endOfDay ? 'T23:59:59.999' : 'T00:00:00.000';
    const date = new Date(`${dateValue}${suffix}`);
    if (Number.isNaN(date.getTime())) return undefined;
    return date.toISOString();
};

export const buildDefaultMetricsPeriod = (days = 30) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - (Math.max(1, days) - 1));
    return {
        fromDate: formatMetricsDateInputValue(from),
        toDate: formatMetricsDateInputValue(to),
    };
};

export const getSuspiciousIndicatorLabel = (code) =>
    SUSPICIOUS_INDICATOR_LABELS[code] || code || 'Cảnh báo';

export const getJobStatusTone = (status) => {
    const value = String(status || '').toUpperCase();
    if (value === 'OPEN') return 'success';
    if (value === 'PENDING_REVIEW' || value === 'REVISION_REQUESTED') return 'warning';
    if (value === 'REJECTED' || value === 'BLOCKED') return 'danger';
    if (value === 'CLOSED' || value === 'DRAFT') return 'muted';
    return 'muted';
};

export const getModerationStatusTone = (status) => {
    const value = String(status || '').toUpperCase();
    if (value === 'OVERDUE') return 'danger';
    if (value === 'PENDING') return 'warning';
    if (value === 'DECIDED') return 'success';
    return 'muted';
};

export const getAiRiskTone = (level) => {
    const value = String(level || '').toUpperCase();
    if (value === 'HIGH' || value === 'FAILED') return 'danger';
    if (value === 'MEDIUM') return 'warning';
    if (value === 'LOW') return 'success';
    return 'muted';
};

export const resolveModerationActionHint = (action) => {
    const key = String(action || '').toUpperCase();
    return MODERATION_ACTION_HINTS[key] || null;
};

/** Chỉ gửi param có giá trị, map date input → Instant. */
export const buildJobPostMetricsQuery = (filters = {}, { page, size } = {}) => {
    const params = {};
    const fromInstant = toMetricsInstantFromDate(filters.fromDate, false);
    const toInstant = toMetricsInstantFromDate(filters.toDate, true);
    if (fromInstant) params.fromDate = fromInstant;
    if (toInstant) params.toDate = toInstant;
    if (filters.jobStatus) params.jobStatus = filters.jobStatus;
    if (filters.moderationStatus) params.moderationStatus = filters.moderationStatus;
    if (filters.aiOutcome) params.aiOutcome = filters.aiOutcome;
    if (filters.reportStatus) params.reportStatus = filters.reportStatus;
    if (filters.recruiterId) params.recruiterId = filters.recruiterId;
    if (filters.suspiciousOnly) params.suspiciousOnly = true;
    if (page != null) params.page = page;
    if (size != null) params.size = size;
    return params;
};
