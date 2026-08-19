export const RISK_TABS = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'CAO', label: 'Rủi ro cao' },
    { id: 'TRUNG_BINH', label: 'Rủi ro trung bình' },
    { id: 'THAP', label: 'Rủi ro thấp' },
];

/** Chuẩn hóa AI risk: BE có thể trả CAO/TRUNG_BINH/THAP hoặc HIGH/MEDIUM/THẤP. */
export const normalizeAiRiskLevel = (aiRiskLevel) => {
    const raw = String(aiRiskLevel || '')
        .trim()
        .toUpperCase()
        .normalize('NFC');
    if (raw === 'CAO' || raw === 'HIGH') return 'CAO';
    if (raw === 'TRUNG_BINH' || raw === 'MEDIUM' || raw === 'TRUNG BINH') return 'TRUNG_BINH';
    if (raw === 'THAP' || raw === 'THẤP' || raw === 'LOW') return 'THAP';
    return aiRiskLevel || null;
};

export const getRiskDisplay = (aiRiskLevel) => {
    switch (normalizeAiRiskLevel(aiRiskLevel)) {
        case 'CAO':
            return { label: 'Rủi ro cao', shortLabel: 'Rủi ro cao', tone: 'high' };
        case 'TRUNG_BINH':
            return { label: 'Rủi ro trung bình', shortLabel: 'Rủi ro TB', tone: 'medium' };
        case 'THAP':
            return { label: 'Rủi ro thấp', shortLabel: 'Rủi ro thấp', tone: 'low' };
        default:
            return { label: 'Chưa phân tích', shortLabel: 'Chưa có', tone: 'unknown' };
    }
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

export const getRuleList = (ruleResult) => {
    if (!ruleResult) return [];
    if (Array.isArray(ruleResult.rules)) return ruleResult.rules;
    if (Array.isArray(ruleResult)) return ruleResult;
    return [];
};

export const isHardRule = (rule) =>
    rule?.isHardRule === true || rule?.hardRule === true || rule?.hard === true;

/** Hard rules bị fail — dùng cho detail highlight. */
export const getHardRuleFailures = (ruleResult) =>
    getRuleList(ruleResult).filter((rule) => isHardRule(rule) && rule?.passed === false);

/**
 * Queue item / detail có hard-rule fail không.
 * Ưu tiên field BE `hasHardRuleFailure`; fallback parse ruleEngineResult nếu có.
 */
export const hasHardRuleFailure = (itemOrDetail) => {
    if (!itemOrDetail) return false;
    if (itemOrDetail.hasHardRuleFailure === true) return true;
    if (itemOrDetail.hasHardRuleFailure === false) return false;
    const ruleResult = parseRuleEngineResult(itemOrDetail.ruleEngineResult);
    return getHardRuleFailures(ruleResult).length > 0;
};

/**
 * Badge hàng chờ:
 * - Hard Rule fail → "Vi phạm quy tắc cứng" (đỏ)
 * - RED không hard → "Ưu tiên cao" (không gọi là vi phạm cứng)
 * - GREEN → "Ưu tiên thấp" (thường ẩn khỏi list chính)
 */
export const getQueueBadge = (itemOrDetail) => {
    const queueType = itemOrDetail?.queueType;
    if (hasHardRuleFailure(itemOrDetail)) {
        return { label: 'Vi phạm quy tắc cứng', tone: 'hard', shortLabel: 'Vi phạm cứng' };
    }
    if (queueType === 'RED_QUEUE') {
        return { label: 'Ưu tiên cao', tone: 'red', shortLabel: 'Ưu tiên cao' };
    }
    if (queueType === 'GREEN_QUEUE') {
        return { label: 'Ưu tiên thấp', tone: 'green', shortLabel: 'Ưu tiên thấp' };
    }
    return { label: '', tone: '', shortLabel: '' };
};

/** @deprecated dùng getQueueBadge — giữ alias tránh break import cũ. */
export const getQueueTypeLabel = (queueType) => {
    if (queueType === 'RED_QUEUE') return 'Ưu tiên cao';
    if (queueType === 'GREEN_QUEUE') return 'Ưu tiên thấp';
    return '';
};

export const getQueueTypeTone = (queueType) => {
    if (queueType === 'RED_QUEUE') return 'red';
    if (queueType === 'GREEN_QUEUE') return 'green';
    return '';
};

export const isGreenQueueItem = (item) => item?.queueType === 'GREEN_QUEUE';

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
    return normalizeAiRiskLevel(item?.aiRiskLevel) === tabId;
};

export const matchesSearch = (item, keyword) => {
    const q = keyword.trim().toLowerCase();
    if (!q) return true;
    const haystack = [item?.jobTitle, item?.businessName, item?.recruiterName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
    return haystack.includes(q);
};

export const countByRisk = (items = []) => {
    const counts = { ALL: items.length, CAO: 0, TRUNG_BINH: 0, THAP: 0 };
    items.forEach((item) => {
        const level = normalizeAiRiskLevel(item?.aiRiskLevel);
        if (level && counts[level] != null) counts[level] += 1;
    });
    return counts;
};

export const RULE_NAME_LABELS = {
    ALL_HARD_RULES: 'Quy tắc cứng (ALL_HARD_RULES)',
    SALARY_VALIDATION: 'Kiểm tra mức lương (SALARY_VALIDATION)',
    BLACKLIST_KEYWORD: 'Từ khóa cấm (BLACKLIST_KEYWORD)',
    BLACKLIST_URL: 'URL đáng ngờ (BLACKLIST_URL)',
    SPAM_FREQUENCY: 'Tần suất spam (SPAM_FREQUENCY)',
    RECRUITER_TRUST: 'Độ tin cậy nhà tuyển dụng (RECRUITER_TRUST)',
    TRUST_HISTORY_HEALTH: 'Lịch sử sức khỏe Trust (TRUST_HISTORY_HEALTH)',
    APPROVAL_RATE: 'Tỷ lệ duyệt bài thành công (APPROVAL_RATE)',
    REPORT_HISTORY: 'Lịch sử bị báo cáo (REPORT_HISTORY)',
    PROFILE_COMPLETENESS: 'Độ hoàn thiện hồ sơ doanh nghiệp (PROFILE_COMPLETENESS)',
    POSTING_FREQUENCY: 'Tần suất đăng bài (POSTING_FREQUENCY)',
    CONTENT_QUALITY: 'Chất lượng nội dung (CONTENT_QUALITY)',
    AUTO_APPROVE_CONDITIONS: 'Điều kiện để tự động duyệt bài (AUTO_APPROVE_CONDITIONS)'
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
