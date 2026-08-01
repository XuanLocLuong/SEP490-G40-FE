/**
 * Helper hiển thị Trust Score (dùng chung Candidate / Recruiter).
 * Data: /trust-scores/me + /trust-scores/history
 */

/** Điểm hiện tại → số 0–100 hoặc null nếu không hợp lệ. */
export const toTrustScoreNumber = (score) => {
    if (score == null || score === '') return null;
    const n = Number(score);
    return Number.isFinite(n) ? n : null;
};

/** Nhãn điểm dạng "92/100". */
export const formatTrustScoreLabel = (score) => {
    const n = toTrustScoreNumber(score);
    if (n == null) return '—/100';
    return `${Math.round(n)}/100`;
};

/**
 * Thay đổi điểm → "+15 điểm" / "-10 điểm" / "0 điểm".
 * @returns {{ text: string, tone: 'up' | 'down' | 'neutral' }}
 */
export const formatScoreChange = (scoreChange) => {
    const n = Number(scoreChange);
    if (!Number.isFinite(n) || n === 0) {
        return { text: '0 điểm', tone: 'neutral' };
    }
    if (n > 0) {
        return { text: `+${Math.round(n)} điểm`, tone: 'up' };
    }
    return { text: `${Math.round(n)} điểm`, tone: 'down' };
};

/** Instant / ISO → dd/MM/yyyy (vi-VN). */
export const formatTrustEventDate = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

/** Tiêu đề event: ưu tiên displayName, fallback eventType. */
export const formatTrustEventTitle = (event) =>
    event?.displayName || event?.eventType || 'Cập nhật điểm uy tín';
