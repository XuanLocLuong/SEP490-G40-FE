import { useEffect, useMemo, useRef, useState } from 'react';
import { getReportEventTypes } from '../../apis/AdminTrustScoreRuleApi.jsx';
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
    reasonName: '',
    reasonDescription: '',
};

const buildInitialForm = (mode, initialRule) => {
    if (mode === 'edit' && initialRule) {
        const conditions = parseConditions(initialRule.conditions);
        return {
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
            reasonName: initialRule.reasonName || '',
            reasonDescription: initialRule.reasonDescription || '',
        };
    }
    return EMPTY;
};

const TrustScoreRuleFormModal = ({
    open,
    mode = 'create',
    initialRule = null,
    loading = false,
    onSubmit,
    onCancel,
}) => {
    const bodyRef = useRef(null);
    const [prevKey, setPrevKey] = useState({
        open,
        mode,
        id: initialRule?.id,
        version: initialRule?.version,
    });
    const [form, setForm] = useState(() => buildInitialForm(mode, initialRule));
    const [reportEventTypes, setReportEventTypes] = useState([]);
    const [error, setError] = useState('');

    const currentKey = {
        open,
        mode,
        id: initialRule?.id,
        version: initialRule?.version,
    };
    if (
        prevKey.open !== currentKey.open ||
        prevKey.mode !== currentKey.mode ||
        prevKey.id !== currentKey.id ||
        prevKey.version !== currentKey.version
    ) {
        setPrevKey(currentKey);
        setForm(buildInitialForm(mode, initialRule));
        setError('');
    }

    useEffect(() => {
        if (!open) return;
        let isMounted = true;
        getReportEventTypes()
            .then((data) => {
                if (isMounted && Array.isArray(data)) {
                    setReportEventTypes(data);
                }
            })
            .catch(() => {
                /* fallback to defaults */
            });
        return () => {
            isMounted = false;
        };
    }, [open]);

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
                    next.eventType = 'REPORT_';
                    next.scoreValue = '-10';
                    next.reasonName = '';
                    next.reasonDescription = '';
                }
            }
            return next;
        });
        setError('');
    };

    const handleReportEventTypeChange = (raw) => {
        let val = raw.toUpperCase();
        if (!val.startsWith('REPORT_')) {
            if (val.startsWith('REPORT')) {
                val = 'REPORT_' + val.slice(6).replace(/^_*/, '');
            } else if (val) {
                val = 'REPORT_' + val.replace(/^_+/, '');
            } else {
                val = 'REPORT_';
            }
        }
        if (val.startsWith('REPORT__')) {
            val = 'REPORT_' + val.slice(7).replace(/^_*/, '');
        }

        setForm((prev) => {
            const next = { ...prev, eventType: val };
            if (!prev.reasonName) {
                const found = reportEventTypes.find((r) => r.eventType === val);
                if (found?.reasonName) {
                    next.reasonName = found.reasonName;
                }
            }
            return next;
        });
        setError('');
    };

    const raiseError = (msg) => {
        setError(msg);
        bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const displayName = form.displayName.trim();
        const reason = form.reason.trim();
        const ruleCode = form.ruleCode.trim().toUpperCase();
        const eventType = form.eventType.trim().toUpperCase();
        const scoreNum = Number(form.scoreValue);

        if (mode === 'create' && !ruleCode) {
            raiseError('Mã quy tắc là bắt buộc.');
            return;
        }
        if (!eventType) {
            raiseError('Loại sự kiện là bắt buộc.');
            return;
        }
        if (isReport) {
            if (eventType === 'REPORT_' || eventType.trim() === 'REPORT_') {
                raiseError('Vui lòng nhập tên loại sự kiện báo cáo sau tiền tố "REPORT_" (VD: REPORT_FAKE_JOB).');
                return;
            }
            if (!eventType.startsWith('REPORT_')) {
                raiseError('Loại sự kiện báo cáo bắt buộc phải bắt đầu bằng "REPORT_".');
                return;
            }
        }
        if (!displayName) {
            raiseError('Tên hiển thị là bắt buộc.');
            return;
        }
        if (!Number.isFinite(scoreNum)) {
            raiseError(isWarning ? 'Ngưỡng cảnh báo không hợp lệ.' : 'Giá trị điểm không hợp lệ.');
            return;
        }
        if (!isWarning && scoreNum === 0) {
            raiseError('Giá điểm điều chỉnh không được bằng 0.');
            return;
        }
        if (isWarning && (scoreNum < 0 || scoreNum > 100)) {
            raiseError('Ngưỡng cảnh báo phải từ 0 đến 100.');
            return;
        }
        if (!isWarning && (scoreNum < -100 || scoreNum > 100)) {
            raiseError('Điểm điều chỉnh phải trong khoảng -100 đến 100 (khác 0).');
            return;
        }
        if (isRehab && scoreNum <= 0) {
            raiseError('Quy tắc phục hồi chỉ chấp nhận điểm dương.');
            return;
        }
        if (isRehab) {
            const days = Number(form.requiredDays);
            if (!Number.isInteger(days) || days < 1 || days > 3650) {
                raiseError('Số ngày yêu cầu phải từ 1 đến 3650.');
                return;
            }
        }
        if (!reason) {
            raiseError('Lý do thay đổi là bắt buộc.');
            return;
        }

        const finalEventType =
            isReport && !eventType.startsWith('REPORT_')
                ? `REPORT_${eventType}`
                : eventType;

        const payload = {
            eventType: finalEventType,
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

        if (isReport) {
            payload.reasonName = form.reasonName?.trim() || null;
            payload.reasonDescription = form.reasonDescription?.trim() || null;
        }

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

                {error ? (
                    <div className="admin-skills-modal__error-banner" role="alert">
                        <span style={{ fontSize: '15px' }}>⚠️</span>
                        <span>{error}</span>
                    </div>
                ) : null}

                <div className="admin-skills-modal__body" ref={bodyRef}>
                    <div className="admin-skills-form-grid-2">
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
                    </div>

                    <div className="admin-skills-form-grid-2">
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
                                        onChange={(e) => handleReportEventTypeChange(e.target.value)}
                                        placeholder="VD: REPORT_FAKE_JOB"
                                        disabled={loading || mode === 'edit'}
                                    />
                                    {mode === 'edit' ? (
                                        <small className="admin-trust-hint">
                                            Loại sự kiện báo cáo vi phạm là bất biến, không thể thay đổi sau khi tạo.
                                        </small>
                                    ) : (
                                        <>
                                            <small className="admin-trust-hint">
                                                Bắt buộc bắt đầu bằng tiền tố <strong>REPORT_</strong>. Bạn có thể chọn từ gợi ý hoặc tự nhập mới.
                                            </small>
                                            <datalist id="trust-report-events">
                                                {reportEventTypes.length > 0
                                                    ? reportEventTypes.map((item) => (
                                                          <option
                                                              key={item.eventType}
                                                              value={item.eventType}
                                                              label={
                                                                  item.reasonName
                                                                      ? `${item.reasonName} (${item.reasonCode})`
                                                                      : item.eventType
                                                              }
                                                          >
                                                              {item.reasonName || item.eventType}
                                                          </option>
                                                      ))
                                                    : REPORT_EVENT_SUGGESTIONS.map((code) => (
                                                          <option key={code} value={code} />
                                                      ))}
                                            </datalist>
                                        </>
                                    )}
                                </>
                            ) : null}
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
                    </div>

                    <div className="admin-skills-form-grid-2">
                        <label className="admin-skills-field">
                            <span>
                                Tên quy tắc (Admin) <span className="required-mark">*</span>
                            </span>
                            <input
                                value={form.displayName}
                                onChange={(e) => patch('displayName', e.target.value)}
                                placeholder="VD: Thưởng đánh giá 5 sao / Phạt lừa đảo"
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
                                    ? 'Không cộng/trừ điểm; chỉ làm ngưỡng.'
                                    : isRehab
                                      ? 'Điểm cộng khi phục hồi (số dương).'
                                      : 'Dương = cộng, âm = trừ.'}
                            </small>
                        </label>
                    </div>

                    <label className="admin-skills-field">
                        <span>Mô tả quy tắc (Admin)</span>
                        <textarea
                            value={form.description}
                            onChange={(e) => patch('description', e.target.value)}
                            rows={2}
                            disabled={loading}
                        />
                    </label>

                    {isReport ? (
                        <>
                            <label className="admin-skills-field">
                                <span>
                                    Tên lý do hiển thị cho Người dùng (reasonName)
                                </span>
                                <input
                                    value={form.reasonName}
                                    onChange={(e) => patch('reasonName', e.target.value)}
                                    placeholder="VD: Lừa đảo, yêu cầu đặt cọc (để trống sẽ tự suy từ mã)"
                                    maxLength={255}
                                    disabled={loading}
                                />
                                <small className="admin-trust-hint">
                                    Tên hiển thị trong danh sách chọn lý do khi ứng viên/NTD gửi báo cáo (khác với Tên quy tắc nội bộ).
                                </small>
                            </label>

                            <label className="admin-skills-field">
                                <span>
                                    Mô tả lý do hiển thị cho Người dùng (reasonDescription)
                                </span>
                                <textarea
                                    value={form.reasonDescription}
                                    onChange={(e) => patch('reasonDescription', e.target.value)}
                                    placeholder="VD: Nghi ngờ lừa đảo, gian lận hoặc yêu cầu chuyển khoản/đặt cọc..."
                                    maxLength={1000}
                                    rows={2}
                                    disabled={loading}
                                />
                            </label>
                        </>
                    ) : null}

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
