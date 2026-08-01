import { useEffect, useState } from 'react';
import { formatScoreValue, getRuleTypeLabel } from '../../utils/trustScoreRuleDisplay.js';

const TrustScoreRuleStatusModal = ({
    open,
    rule = null,
    loading = false,
    onConfirm,
    onCancel,
}) => {
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;
        setReason('');
        setError('');
    }, [open, rule?.id]);

    if (!open || !rule) return null;

    const activating = !rule.active;
    const title = activating ? 'Kích hoạt quy tắc điểm uy tín' : 'Vô hiệu hóa quy tắc điểm uy tín';

    const handleConfirm = () => {
        const trimmed = reason.trim();
        if (!trimmed) {
            setError('Lý do là bắt buộc.');
            return;
        }
        onConfirm?.({ reason: trimmed, version: rule.version });
    };

    return (
        <div
            className="admin-skills-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="trust-rule-status-title"
        >
            <button
                type="button"
                className="admin-skills-modal__backdrop"
                aria-label="Đóng"
                onClick={onCancel}
                disabled={loading}
            />
            <div className="admin-skills-modal__panel admin-skills-modal__panel--sm">
                <div className="admin-skills-modal__header">
                    <h2 id="trust-rule-status-title">{title}</h2>
                    <button
                        type="button"
                        className="admin-skills-modal__close"
                        onClick={onCancel}
                        disabled={loading}
                        aria-label="Đóng"
                    >
                        ×
                    </button>
                </div>

                <div className="admin-skills-modal__body">
                    <p className="admin-skills-modal__message">
                        Bạn đang {activating ? 'kích hoạt' : 'vô hiệu hóa'} quy tắc{' '}
                        <strong>{rule.displayName || rule.ruleCode}</strong> (
                        {getRuleTypeLabel(rule.ruleType)} ·{' '}
                        {formatScoreValue(rule.scoreValue, rule.ruleType)}).
                    </p>
                    <p className="admin-skills-modal__hint admin-skills-modal__hint--warn">
                        Thay đổi chỉ áp dụng cho sự kiện điểm uy tín mới. Điểm và sự kiện cũ không bị
                        tính lại.
                    </p>
                    <p className="admin-trust-hint">Phiên bản hiện tại: {rule.version ?? '—'}</p>

                    <label className="admin-skills-field">
                        <span>
                            Lý do <span className="required-mark">*</span>
                        </span>
                        <textarea
                            value={reason}
                            onChange={(e) => {
                                setReason(e.target.value);
                                setError('');
                            }}
                            placeholder="Lý do thay đổi trạng thái"
                            rows={3}
                            disabled={loading}
                            autoFocus
                        />
                    </label>

                    {error ? <p className="admin-skills-modal__error">{error}</p> : null}
                </div>

                <div className="admin-skills-modal__footer">
                    <button
                        type="button"
                        className="admin-skills-btn admin-skills-btn--ghost"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        className={`admin-skills-btn ${
                            activating ? 'admin-skills-btn--primary' : 'admin-skills-btn--danger'
                        }`}
                        onClick={handleConfirm}
                        disabled={loading}
                    >
                        {loading
                            ? 'Đang xử lý...'
                            : activating
                              ? 'Kích hoạt'
                              : 'Vô hiệu hóa'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TrustScoreRuleStatusModal;
