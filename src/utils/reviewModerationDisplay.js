import { formatQueueTime } from './jobReviewDisplay.js';

export { formatQueueTime };

/** Nhãn quyết định AI (aiResult). */
export const formatAiResultLabel = (aiResult) => {
    const key = String(aiResult || '').toUpperCase();
    if (key === 'CHAP_NHAN') return 'Chấp nhận';
    if (key === 'TU_CHOI') return 'Từ chối';
    if (key === 'LOI_AI') return 'Lỗi AI';
    return aiResult || '—';
};

export const getAiResultTone = (aiResult) => {
    const key = String(aiResult || '').toUpperCase();
    if (key === 'CHAP_NHAN') return 'low';
    if (key === 'TU_CHOI') return 'high';
    if (key === 'LOI_AI') return 'medium';
    return 'unknown';
};

/** Đổi lỗi kỹ thuật AI thành câu dễ đọc cho người duyệt. */
export const formatAiErrorForDisplay = (errorText, aiResult) => {
    const raw = String(errorText || '').trim();
    const isLoiAi = String(aiResult || '').toUpperCase() === 'LOI_AI';
    const looksTechnical =
        /gemini|generativelanguage|bad request|failed_precondition|api error|exception|timeout/i.test(
            raw
        );

    if (isLoiAi || looksTechnical) {
        if (/location is not supported|FAILED_PRECONDITION/i.test(raw)) {
            return 'Hệ thống AI tạm thời không phân tích được nội dung (dịch vụ AI chưa khả dụng tại khu vực). Vui lòng kiểm duyệt thủ công.';
        }
        return 'Hệ thống AI tạm thời không phân tích được nội dung này. Vui lòng kiểm duyệt thủ công.';
    }

    return raw || 'Không có thông tin lỗi.';
};

export const formatAiScore = (score) => {
    if (score == null || Number.isNaN(Number(score))) return '—';
    return Number(score).toFixed(2);
};

export const formatReviewTypeLabel = (reviewType) => {
    const key = String(reviewType || '').toUpperCase();
    if (key === 'CANDIDATE_TO_BUSINESS') return 'Ứng viên → Doanh nghiệp';
    if (key === 'RECRUITER_TO_CANDIDATE') return 'Nhà tuyển dụng → Ứng viên';
    return reviewType || '—';
};

export const formatReviewerRoleLabel = (role) => {
    const key = String(role || '').toUpperCase();
    if (key === 'CANDIDATE') return 'Ứng viên';
    if (key === 'RECRUITER') return 'Nhà tuyển dụng';
    return role || '—';
};

export const formatRiskLevelLabel = (mucDoRuiRo) => {
    const key = String(mucDoRuiRo || '')
        .toUpperCase()
        .replace(/\s+/g, '_');
    if (key === 'THAP' || key === 'LOW') return 'Thấp';
    if (key === 'TRUNG_BINH' || key === 'TRUNGBINH' || key === 'MEDIUM') return 'Trung bình';
    if (key === 'CAO' || key === 'HIGH') return 'Cao';
    return mucDoRuiRo || '';
};

export const formatStars = (rating) => {
    const value = Math.max(0, Math.min(5, Number(rating) || 0));
    const filled = '★'.repeat(Math.round(value));
    const empty = '☆'.repeat(5 - Math.round(value));
    return `${filled}${empty}`;
};

/**
 * Parse aiReason:
 * - JSON moderation → { kind: 'analysis', ...fields }
 * - plain text / lỗi → { kind: 'error', errorText }
 */
export const parseAiReason = (aiReason) => {
    if (aiReason == null || aiReason === '') return null;

    if (typeof aiReason === 'object' && !Array.isArray(aiReason)) {
        return { kind: 'analysis', ...aiReason };
    }

    const raw = String(aiReason).trim();
    if (!raw) return null;

    try {
        const data = JSON.parse(raw);
        if (data && typeof data === 'object' && !Array.isArray(data)) {
            return { kind: 'analysis', ...data };
        }
    } catch {
        // plain text
    }

    return { kind: 'error', errorText: raw };
};

export const matchesReviewSearch = (item, keyword) => {
    const q = String(keyword || '')
        .trim()
        .toLowerCase();
    if (!q) return true;
    const haystack = [
        item?.reviewerName,
        item?.revieweeName,
        item?.commentPreview,
        item?.reviewType,
        item?.aiResult,
        formatAiResultLabel(item?.aiResult),
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
    return haystack.includes(q);
};

export const DECISION_LABELS = {
    APPROVED: 'Duyệt',
    REJECTED: 'Từ chối',
    HIDDEN: 'Ẩn nội dung',
};

export const DECISION_MESSAGES = {
    APPROVED: 'Đã duyệt đánh giá — nội dung sẽ hiển thị công khai.',
    REJECTED: 'Đã từ chối đánh giá.',
    HIDDEN: 'Đã ẩn nội dung đánh giá.',
};
