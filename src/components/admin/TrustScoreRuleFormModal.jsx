import { useEffect, useMemo, useState } from 'react';
import {
    APPLIES_TO_OPTIONS,
    CONFIGURABLE_RULE_TYPES,
    REPORT_EVENT_SUGGESTIONS,
    REVIEW_EVENT_OPTIONS,
    TRUST_SCORE_RULE_TYPES,
    TRUST_TARGET_TYPES,
    WARNING_EVENT_OPTIONS,
    getRuleTypeLabel,
    parseConditions,
    stringifyConditions,
} from '../../utils/trustScoreRuleDisplay.js';

const EMPTY = {
    ruleCode: '',
    eventType: 'REVIEW_5_STAR',
    ruleType: TRUST_SCORE_RULE_TYPES.REVIEW_ADJUSTMENT,
    displayName: '',
    description: '',
    scoreValue: '5',
    appliesTo: TRUST_TARGET_TYPES.BOTH,
    active: true,
    requiredDays: '90',
    requiresHiredActivity: true,
    reason: '',
};

const TrustScoreRuleFormModal = ({
    open,
    mode = 'create',
    initialRule = null,
    loading = false,
    onSubmit,
    onCancel,
}) => {
    const [form, setForm] = useState(EMPTY);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;
        setError('');
        if (mode === 'edit' && initialRule) {
            const conditions = parseConditions(initialRule.conditions);
            setForm({
                ruleCode: initialRule.ruleCode || '',
                eventType: initialRule.eventType || '',
                ruleType: initialRule.ruleType || TRUST_SCORE_RULE_TYPES.REVIEW_ADJUSTMENT,
                displayName: initialRule.displayName || '',
                description: initialRule.description || '',
                scoreValue:
                    initialRule.scoreValue != null ? String(initialRule.scoreValue) : '',
                appliesTo: initialRule.appliesTo || TRUST_TARGET_TYPES.BOTH,
                active: initialRule.active !== false,
                requiredDays: String(conditions.requiredDays || 90),
                requiresHiredActivity: Boolean(conditions.requiresHiredActivity),
                reason: '',
            });
        } else {
            setForm(EMPTY);
        }
    }, [open, mode, initialRule]);

    const configurableTypeOptions = useMemo(
        () =>
            CONFIGURABLE_RULE_TYPES.map((value) => ({
                value,
                label: getRuleTypeLabel(value),
            })),
        []
    );

    if (!open) return null;

    const title = mode === 'edit' ? 'Sửa quy tắc điểm uy tín' : 'Tạo quy tắc điểm uy tín';
    const isRehab = form.ruleType === TRUST_SCORE_RULE_TYPES.REHABILITATION;
    const isWarning = form.ruleType === TRUST_SCORE_RULE_TYPES.WARNING_THRESHOLD;
    const isReview = form.ruleType === TRUST_SCORE_RULE_TYPES.REVIEW_ADJUSTMENT;
    const isReport = form.ruleType === TRUST_SCORE_RULE_TYPES.RESOLVED_REPORT_ADJUSTMENT;

    const patch = (field, value) => {
        setForm((prev) => {
            const next = { ...prev, [field]: value };
            if (field === 'ruleType') {
                if (value === TRUST_SCORE_RULE_TYPES.REHABILITATION) {
                    next.eventType = 'REHABILITATION';
                    next.scoreValue = next.scoreValue && Number(next.scoreValue) > 0 ? next.scoreValue : '1';
                } else if (value === TRUST_SCORE_RULE_TYPES.WARNING_THRESHOLD) {
                    next.eventType = 'WARNING_HIGH_RISK';
                    next.appliesTo = TRUST_TARGET_TYPES.BOTH;
                    next.scoreValue = '30';
                } else if (value === TRUST_SCORE_RULE_TYPES.REVIEW_ADJUSTMENT) {
                    next.eventType = 'REVIEW_5_STAR';
                    next.scoreValue = '5';
                } else if (value === TRUST_SCORE_RULE_TYPES.RESOLVED_REPORT_ADJUSTMENT) {
                    next.eventType = 'REPORT_SCAM';
                    next.scoreValue = '-10';
                }
            }
            return next;
        });
        setError('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const displayName = form.displayName.trim();
        const reason = form.reason.trim();
        const ruleCode = form.ruleCode.trim().toUpperCase();
        const eventType = form.eventType.trim().toUpperCase();
        const scoreNum = Number(form.scoreValue);

        if (mode === 'create' && !ruleCode) {
            setError('Mã quy tắc là bắt buộc.');
            return;
        }
        if (!eventType) {
            setError('Loại sự kiện là bắt buộc.');
            return;
        }
        if (!displayName) {
            setError('Tên hiển thị là bắt buộc.');
            return;
        }
        if (!Number.isFinite(scoreNum)) {
            setError(isWarning ? 'Ngưỡng cảnh báo không hợp lệ.' : 'Giá trị điểm không hợp lệ.');
            return;
        }
        if (!isWarning && scoreNum === 0) {
            setError('Giá điểm điều chỉnh không được bằng 0.');
            return;
        }
        if (isWarning && (scoreNum < 0 || scoreNum > 100)) {
            setError('Ngưỡng cảnh báo phải từ 0 đến 100.');
            return;
        }
        if (!isWarning && (scoreNum < -100 || scoreNum > 100)) {
            setError('Điểm điều chỉnh phải trong khoảng -100 đến 100 (khác 0).');
            return;
        }
        if (isRehab && scoreNum <= 0) {
            setError('Quy tắc phục hồi chỉ chấp nhận điểm dương.');
            return;
        }
        if (isRehab) {
            const days = Number(form.requiredDays);
            if (!Number.isInteger(days) || days < 1 || days > 3650) {
                setError('Số ngày yêu cầu phải từ 1 đến 3650.');
                return;
            }
        }
        if (!reason) {
            setError('Lý do thay đổi là bắt buộc.');
            return;
        }

        const payload = {
            eventType,
            ruleType: form.ruleType,
            displayName,
            description: form.description.trim() || null,
            scoreValue: scoreNum,
            appliesTo: isWarning ? TRUST_TARGET_TYPES.BOTH : form.appliesTo,
            conditions: isRehab
                ? stringifyConditions({
                      requiredDays: Number(form.requiredDays),
                      requiresHiredActivity: form.requiresHiredActivity,
                  })
                : null,
            reason,
        };

        if (mode === 'create') {
            payload.ruleCode = ruleCode;
            payload.active = Boolean(form.active);
        } else {
            payload.version = initialRule?.version;
        }

        onSubmit?.(payload);
    };

    return (
        <div
            className="admin-skills-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="trust-rule-form-title"
        >
            <button
                type="button"
                className="admin-skills-modal__backdrop"
                aria-label="Đóng"
                onClick={onCancel}
                disabled={loading}
            />
            <form className="admin-skills-modal__panel" onSubmit={handleSubmit}>
                <div className="admin-skills-modal__header">
                    <h2 id="trust-rule-form-title">{title}</h2>
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
                    <label className="admin-skills-field">
                        <span>
                            Mã quy tắc <span className="required-mark">*</span>
                        </span>
                        <input
                            value={form.ruleCode}
                            onChange={(e) => patch('ruleCode', e.target.value.toUpperCase())}
                            placeholder="VD: REVIEW_5_STAR_BONUS"
                            disabled={loading || mode === 'edit'}
                            autoFocus={mode === 'create'}
                        />
                        {mode === 'edit' ? (
                            <small className="admin-trust-hint">
                                Mã quy tắc không thể sửa sau khi tạo.
                            </small>
                        ) : null}
                    </label>

                    <label className="admin-skills-field">
                        <span>
                            Loại quy tắc <span className="required-mark">*</span>
                        </span>
                        <select
                            value={form.ruleType}
                            onChange={(e) => patch('ruleType', e.target.value)}
                            disabled={loading}
                        >
                            {configurableTypeOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="admin-skills-field">
                        <span>
                            Loại sự kiện <span className="required-mark">*</span>
                        </span>
                        {isReview ? (
                            <select
                                value={form.eventType}
                                onChange={(e) => patch('eventType', e.target.value)}
                                disabled={loading}
                            >
                                {REVIEW_EVENT_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        ) : null}
                        {isWarning ? (
                            <select
                                value={form.eventType}
                                onChange={(e) => patch('eventType', e.target.value)}
                                disabled={loading}
                            >
                                {WARNING_EVENT_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        ) : null}
                        {isRehab ? (
                            <input value="REHABILITATION" disabled />
                        ) : null}
                        {isReport ? (
                            <>
                                <input
                                    list="trust-report-events"
                                    value={form.eventType}
                                    onChange={(e) => patch('eventType', e.target.value.toUpperCase())}
                                    placeholder="VD: REPORT_SCAM"
                                    disabled={loading}
                                />
                                <datalist id="trust-report-events">
                                    {REPORT_EVENT_SUGGESTIONS.map((code) => (
                                        <option key={code} value={code} />
                                    ))}
                                </datalist>
                            </>
                        ) : null}
                    </label>

                    <label className="admin-skills-field">
                        <span>
                            Tên hiển thị <span className="required-mark">*</span>
                        </span>
                        <input
                            value={form.displayName}
                            onChange={(e) => patch('displayName', e.target.value)}
                            placeholder="VD: Thưởng đánh giá 5 sao"
                            disabled={loading}
                        />
                    </label>

                    <label className="admin-skills-field">
                        <span>Mô tả</span>
                        <textarea
                            value={form.description}
                            onChange={(e) => patch('description', e.target.value)}
                            rows={2}
                            disabled={loading}
                        />
                    </label>

                    <label className="admin-skills-field">
                        <span>
                            {isWarning ? 'Ngưỡng điểm (0–100)' : 'Giá trị điểm'}{' '}
                            <span className="required-mark">*</span>
                        </span>
                        <input
                            type="number"
                            value={form.scoreValue}
                            onChange={(e) => patch('scoreValue', e.target.value)}
                            disabled={loading}
                        />
                        <small className="admin-trust-hint">
                            {isWarning
                                ? 'Không cộng/trừ điểm; chỉ dùng làm ngưỡng cảnh báo.'
                                : isRehab
                                  ? 'Chỉ chấp nhận số dương (điểm cộng khi phục hồi).'
                                  : 'Số dương = cộng điểm, số âm = trừ điểm (không được = 0).'}
                        </small>
                    </label>

                    <label className="admin-skills-field">
                        <span>
                            Đối tượng áp dụng <span className="required-mark">*</span>
                        </span>
                        <select
                            value={isWarning ? TRUST_TARGET_TYPES.BOTH : form.appliesTo}
                            onChange={(e) => patch('appliesTo', e.target.value)}
                            disabled={loading || isWarning}
                        >
                            {APPLIES_TO_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        {isWarning ? (
                            <small className="admin-trust-hint">
                                Ngưỡng cảnh báo luôn áp dụng cho cả hai đối tượng.
                            </small>
                        ) : null}
                    </label>

                    {isRehab ? (
                        <>
                            <label className="admin-skills-field">
                                <span>
                                    Số ngày yêu cầu <span className="required-mark">*</span>
                                </span>
                                <input
                                    type="number"
                                    min={1}
                                    max={3650}
                                    value={form.requiredDays}
                                    onChange={(e) => patch('requiredDays', e.target.value)}
                                    disabled={loading}
                                />
                            </label>
                            <label className="admin-skills-field admin-skills-field--row">
                                <input
                                    type="checkbox"
                                    checked={form.requiresHiredActivity}
                                    onChange={(e) =>
                                        patch('requiresHiredActivity', e.target.checked)
                                    }
                                    disabled={loading}
                                />
                                <span>Yêu cầu có hoạt động tuyển dụng (HIRED)</span>
                            </label>
                        </>
                    ) : null}

                    {mode === 'create' ? (
                        <label className="admin-skills-field admin-skills-field--row">
                            <input
                                type="checkbox"
                                checked={form.active}
                                onChange={(e) => patch('active', e.target.checked)}
                                disabled={loading}
                            />
                            <span>Kích hoạt ngay sau khi tạo</span>
                        </label>
                    ) : (
                        <p className="admin-trust-hint">
                            Trạng thái đang hoạt động/đã vô hiệu chỉ đổi bằng nút Kích hoạt /
                            Vô hiệu hóa. Phiên bản hiện tại:{' '}
                            <strong>{initialRule?.version ?? '—'}</strong>
                        </p>
                    )}

                    <label className="admin-skills-field">
                        <span>
                            Lý do <span className="required-mark">*</span>
                        </span>
                        <textarea
                            value={form.reason}
                            onChange={(e) => patch('reason', e.target.value)}
                            placeholder="Lý do tạo/sửa (ghi nhật ký kiểm toán)"
                            rows={2}
                            disabled={loading}
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
                        type="submit"
                        className="admin-skills-btn admin-skills-btn--primary"
                        disabled={loading}
                    >
                        {loading ? 'Đang lưu...' : mode === 'edit' ? 'Lưu thay đổi' : 'Tạo quy tắc'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TrustScoreRuleFormModal;
