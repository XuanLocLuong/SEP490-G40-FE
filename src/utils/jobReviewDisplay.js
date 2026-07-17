export const RISK_TABS = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'CAO', label: 'Rủi ro cao' },
    { id: 'TRUNG_BINH', label: 'Rủi ro trung bình' },
    { id: 'THAP', label: 'Rủi ro thấp' },
];

export const getRiskDisplay = (aiRiskLevel) => {
    switch (aiRiskLevel) {
        case 'CAO':
            return { label: 'Rủi ro cao', shortLabel: 'High risk', tone: 'high' };
        case 'TRUNG_BINH':
            return { label: 'Rủi ro trung bình', shortLabel: 'Medium', tone: 'medium' };
        case 'THAP':
            return { label: 'Rủi ro thấp', shortLabel: 'Low risk', tone: 'low' };
        default:
            return { label: 'Chưa phân tích', shortLabel: 'N/A', tone: 'unknown' };
    }
};

export const getQueueTypeLabel = (queueType) => {
    if (queueType === 'RED_QUEUE') return 'Hàng đỏ';
    if (queueType === 'GREEN_QUEUE') return 'Hàng xanh';
    return '';
};

export const parseRuleEngineResult = (raw) => {
    if (!raw) return null;
    if (typeof raw === 'object') return raw;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

export const formatQueueTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} ngày trước`;
    return date.toLocaleDateString('vi-VN');
};

export const matchesRiskTab = (item, tabId) => {
    if (tabId === 'ALL') return true;
    return item?.aiRiskLevel === tabId;
};

export const matchesSearch = (item, keyword) => {
    const q = keyword.trim().toLowerCase();
    if (!q) return true;
    const haystack = [
        item?.jobTitle,
        item?.businessName,
        item?.recruiterName,
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
    return haystack.includes(q);
};

export const countByRisk = (items = []) => {
    const counts = { ALL: items.length, CAO: 0, TRUNG_BINH: 0, THAP: 0 };
    items.forEach((item) => {
        if (item?.aiRiskLevel && counts[item.aiRiskLevel] != null) {
            counts[item.aiRiskLevel] += 1;
        }
    });
    return counts;
};

export const RULE_NAME_LABELS = {
    ALL_HARD_RULES: 'Quy tắc cứng',
    SALARY_VALIDATION: 'Kiểm tra mức lương',
    BLACKLIST_KEYWORD: 'Từ khóa cấm',
    BLACKLIST_URL: 'URL đáng ngờ',
    SPAM_FREQUENCY: 'Tần suất spam',
    RECRUITER_TRUST: 'Độ tin cậy nhà tuyển dụng',
    TRUST_HISTORY_HEALTH: 'Lịch sử sức khỏe Trust',
    APPROVAL_RATE: 'Tỷ lệ duyệt bài thành công',
    REPORT_HISTORY: 'Lịch sử bị báo cáo',
    PROFILE_COMPLETENESS: 'Độ hoàn thiện hồ sơ DN',
    POSTING_FREQUENCY: 'Tần suất đăng bài',
    CONTENT_QUALITY: 'Chất lượng nội dung',
};

export const getRuleNameLabel = (ruleName) => RULE_NAME_LABELS[ruleName] || ruleName;

export const getRuleScoreTone = (rule) => {
    if (!rule?.passed) return 'fail';

    const max = rule.maxScore ?? 0;
    const score = rule.scoreContribution ?? 0;

    if (max <= 0) return 'pass';

    const ratio = score / max;
    if (ratio >= 0.85) return 'pass';
    if (ratio >= 0.5) return 'warn';
    return 'low';
};

export const getAutoScoreTone = (score) => {
    if (score == null || Number.isNaN(score)) return 'unknown';
    if (score >= 80) return 'pass';
    if (score >= 40) return 'warn';
    return 'low';
};
