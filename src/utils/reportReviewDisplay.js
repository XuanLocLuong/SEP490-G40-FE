import { getReportReasonDisplay } from '../services/jobReportService.js';
import { formatQueueTime, getRiskDisplay } from './jobReviewDisplay.js';

export { formatQueueTime, getRiskDisplay, getReportReasonDisplay };

export const REPORT_DECISION = {
    REJECT: 'REJECT',
    BLOCK: 'BLOCK',
};

export const REPORT_DECISION_LABELS = {
    REJECT: 'Báo cáo không hợp lệ',
    BLOCK: 'Khóa tin vi phạm',
};

export const REPORT_DECISION_MESSAGES = {
    REJECT: 'Đã đánh dấu báo cáo không hợp lệ và giữ tin đăng.',
    BLOCK: 'Đã khóa tin vì vi phạm.',
};

export const getCategoryLabel = (code) => getReportReasonDisplay({ code }).name;

export const matchesReportSearch = (item, keyword) => {
    const q = String(keyword || '')
        .trim()
        .toLowerCase();
    if (!q) return true;
    const categories = Array.isArray(item?.categories)
        ? item.categories.map((code) => getCategoryLabel(code)).join(' ')
        : '';
    const haystack = [item?.jobTitle, item?.businessName, categories]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
    return haystack.includes(q);
};

export const getHistoryDecisionLabel = (decision) => {
    const key = String(decision || '').toUpperCase();
    if (key === 'BLOCK' || key === 'RESOLVED') return REPORT_DECISION_LABELS.BLOCK;
    if (key === 'REJECT' || key === 'REJECTED') return REPORT_DECISION_LABELS.REJECT;
    return decision || '—';
};
