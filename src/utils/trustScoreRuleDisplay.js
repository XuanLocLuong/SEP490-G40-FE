export const TRUST_SCORE_RULE_TYPES = {
    REVIEW_ADJUSTMENT: 'REVIEW_ADJUSTMENT',
    RESOLVED_REPORT_ADJUSTMENT: 'RESOLVED_REPORT_ADJUSTMENT',
    REHABILITATION: 'REHABILITATION',
    WARNING_THRESHOLD: 'WARNING_THRESHOLD',
    SYSTEM_ADJUSTMENT: 'SYSTEM_ADJUSTMENT',
};

/** Loại Admin được tạo/sửa theo UC-51. */
export const CONFIGURABLE_RULE_TYPES = [
    TRUST_SCORE_RULE_TYPES.REVIEW_ADJUSTMENT,
    TRUST_SCORE_RULE_TYPES.RESOLVED_REPORT_ADJUSTMENT,
    TRUST_SCORE_RULE_TYPES.REHABILITATION,
    TRUST_SCORE_RULE_TYPES.WARNING_THRESHOLD,
];

export const TRUST_TARGET_TYPES = {
    CANDIDATE: 'CANDIDATE',
    RECRUITER: 'RECRUITER',
    BOTH: 'BOTH',
};

export const RULE_TYPE_OPTIONS = [
    { value: TRUST_SCORE_RULE_TYPES.REVIEW_ADJUSTMENT, label: 'Điều chỉnh theo đánh giá' },
    {
        value: TRUST_SCORE_RULE_TYPES.RESOLVED_REPORT_ADJUSTMENT,
        label: 'Điều chỉnh theo báo cáo đã xử lý',
    },
    { value: TRUST_SCORE_RULE_TYPES.REHABILITATION, label: 'Phục hồi uy tín' },
    { value: TRUST_SCORE_RULE_TYPES.WARNING_THRESHOLD, label: 'Ngưỡng cảnh báo' },
    { value: TRUST_SCORE_RULE_TYPES.SYSTEM_ADJUSTMENT, label: 'Hệ thống (chỉ xem)' },
];

/** Giá trị appliesTo của 1 rule (thuộc tính quy tắc). */
export const APPLIES_TO_OPTIONS = [
    { value: TRUST_TARGET_TYPES.CANDIDATE, label: 'Chỉ ứng viên' },
    { value: TRUST_TARGET_TYPES.RECRUITER, label: 'Chỉ nhà tuyển dụng' },
    {
        value: TRUST_TARGET_TYPES.BOTH,
        label: 'Áp dụng cho cả ứng viên và nhà tuyển dụng',
    },
];

/** Option lọc danh sách: '' = không lọc theo đối tượng. */
export const APPLIES_TO_FILTER_OPTIONS = [
    { value: '', label: 'Tất cả đối tượng (không lọc)' },
    ...APPLIES_TO_OPTIONS,
];

export const RULE_TYPE_FILTER_OPTIONS = [
    { value: '', label: 'Tất cả loại (không lọc)' },
    ...RULE_TYPE_OPTIONS,
];

export const REVIEW_EVENT_OPTIONS = [
    { value: 'REVIEW_1_STAR', label: 'Đánh giá 1 sao' },
    { value: 'REVIEW_2_STAR', label: 'Đánh giá 2 sao' },
    { value: 'REVIEW_3_STAR', label: 'Đánh giá 3 sao' },
    { value: 'REVIEW_4_STAR', label: 'Đánh giá 4 sao' },
    { value: 'REVIEW_5_STAR', label: 'Đánh giá 5 sao' },
];

export const WARNING_EVENT_OPTIONS = [
    { value: 'WARNING_HIGH_RISK', label: 'Cảnh báo rủi ro cao' },
    { value: 'WARNING_PUBLIC', label: 'Cảnh báo công khai' },
    { value: 'WARNING_LIGHT', label: 'Cảnh báo nhẹ' },
];

export const REPORT_EVENT_SUGGESTIONS = [
    'REPORT_SCAM',
    'REPORT_MISLEADING_INFORMATION',
    'REPORT_FAKE_DOCUMENT',
    'REPORT_SPAM',
    'REPORT_HARASSMENT',
    'REPORT_FAKE_JOB',
    'REPORT_OTHER',
];

export const isSystemRuleType = (ruleType) =>
    ruleType === TRUST_SCORE_RULE_TYPES.SYSTEM_ADJUSTMENT;

export const isConfigurableRuleType = (ruleType) =>
    CONFIGURABLE_RULE_TYPES.includes(ruleType);

export const getRuleTypeLabel = (ruleType) =>
    RULE_TYPE_OPTIONS.find((opt) => opt.value === ruleType)?.label || ruleType || '—';

/** Thứ tự hiển thị list admin: 4 loại cấu hình được, SYSTEM cuối. */
export const RULE_TYPE_LIST_ORDER = [
    ...CONFIGURABLE_RULE_TYPES,
    TRUST_SCORE_RULE_TYPES.SYSTEM_ADJUSTMENT,
];

const ruleTypeRank = (ruleType) => {
    const idx = RULE_TYPE_LIST_ORDER.indexOf(ruleType);
    return idx >= 0 ? idx : RULE_TYPE_LIST_ORDER.length;
};

/** Configurable trước, SYSTEM cuối; trong mỗi loại: updatedAt mới hơn trước, rồi ruleCode. */
export const sortRulesForAdminList = (rules = []) =>
    [...rules].sort((a, b) => {
        const typeDiff = ruleTypeRank(a?.ruleType) - ruleTypeRank(b?.ruleType);
        if (typeDiff !== 0) return typeDiff;
        const aTime = a?.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bTime = b?.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        if (bTime !== aTime) return bTime - aTime;
        return String(a?.ruleCode || '').localeCompare(String(b?.ruleCode || ''), 'vi');
    });

/**
 * Gom theo loại (đã sort sẵn). Trả về [{ ruleType, label, rules }].
 */
export const groupRulesByType = (rules = []) => {
    const groups = [];
    for (const rule of rules) {
        const type = rule?.ruleType || '';
        const last = groups[groups.length - 1];
        if (last && last.ruleType === type) {
            last.rules.push(rule);
        } else {
            groups.push({
                ruleType: type,
                label: getRuleTypeLabel(type),
                rules: [rule],
            });
        }
    }
    return groups;
};

export const getAppliesToLabel = (appliesTo) =>
    APPLIES_TO_OPTIONS.find((opt) => opt.value === appliesTo)?.label || appliesTo || '—';

export const formatScoreValue = (scoreValue, ruleType) => {
    const num = Number(scoreValue);
    if (!Number.isFinite(num)) return '—';
    if (ruleType === TRUST_SCORE_RULE_TYPES.WARNING_THRESHOLD) {
        return `Ngưỡng: ${num}`;
    }
    if (num > 0) return `+${num}`;
    return String(num);
};

export const formatDateTime = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString('vi-VN');
};

export const parseConditions = (raw) => {
    if (!raw) return { requiredDays: 90, requiresHiredActivity: true };
    if (typeof raw === 'object') {
        return {
            requiredDays: Number(raw.requiredDays) || 90,
            requiresHiredActivity: Boolean(raw.requiresHiredActivity),
        };
    }
    try {
        const parsed = JSON.parse(raw);
        return {
            requiredDays: Number(parsed?.requiredDays) || 90,
            requiresHiredActivity: Boolean(parsed?.requiresHiredActivity),
        };
    } catch {
        return { requiredDays: 90, requiresHiredActivity: true };
    }
};

export const stringifyConditions = ({ requiredDays, requiresHiredActivity }) =>
    JSON.stringify({
        requiredDays: Number(requiredDays),
        requiresHiredActivity: Boolean(requiresHiredActivity),
    });

export const parseJsonSafe = (raw) => {
    if (raw == null || raw === '') return null;
    if (typeof raw === 'object') return raw;
    try {
        return JSON.parse(raw);
    } catch {
        return raw;
    }
};

export const getAuditActionLabel = (action) => {
    const map = {
        CREATE_TRUST_SCORE_RULE: 'Tạo quy tắc',
        UPDATE_TRUST_SCORE_RULE: 'Cập nhật quy tắc',
        ACTIVATE_TRUST_SCORE_RULE: 'Kích hoạt',
        DEACTIVATE_TRUST_SCORE_RULE: 'Vô hiệu hóa',
    };
    return map[action] || action || '—';
};
