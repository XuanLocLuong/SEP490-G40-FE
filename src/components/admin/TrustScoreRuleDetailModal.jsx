import {
    formatDateTime,
    formatScoreValue,
    getAppliesToLabel,
    getAuditActionLabel,
    getRuleTypeLabel,
    parseConditions,
    parseJsonSafe,
} from '../../utils/trustScoreRuleDisplay.js';

const TrustScoreRuleDetailModal = ({
    open,
    detail = null,
    loading = false,
    onClose,
    onEdit,
    onToggleStatus,
}) => {
    if (!open) return null;

    const rule = detail?.rule;
    const history = Array.isArray(detail?.changeHistory) ? detail.changeHistory : [];
    const conditions = rule ? parseConditions(rule.conditions) : null;
    const isSystem = rule?.ruleType === 'SYSTEM_ADJUSTMENT';

    return (
        <div
            className="admin-skills-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="trust-rule-detail-title"
        >
            <button
                type="button"
                className="admin-skills-modal__backdrop"
                aria-label="Đóng"
                onClick={onClose}
                disabled={loading}
            />
            <div className="admin-skills-modal__panel admin-trust-detail-panel">
                <div className="admin-skills-modal__header">
                    <h2 id="trust-rule-detail-title">Chi tiết quy tắc điểm uy tín</h2>
                    <button
                        type="button"
                        className="admin-skills-modal__close"
                        onClick={onClose}
                        disabled={loading}
                        aria-label="Đóng"
                    >
                        ×
                    </button>
                </div>

                <div className="admin-skills-modal__body">
                    {loading && !rule ? <p>Đang tải chi tiết...</p> : null}
                    {!loading && !rule ? <p>Không tìm thấy quy tắc.</p> : null}

                    {rule ? (
                        <>
                            <dl className="admin-trust-detail-grid">
                                <div>
                                    <dt>Mã quy tắc</dt>
                                    <dd>
                                        <code>{rule.ruleCode}</code>
                                    </dd>
                                </div>
                                <div>
                                    <dt>Tên</dt>
                                    <dd>{rule.displayName || '—'}</dd>
                                </div>
                                <div>
                                    <dt>Loại</dt>
                                    <dd>{getRuleTypeLabel(rule.ruleType)}</dd>
                                </div>
                                <div>
                                    <dt>Sự kiện</dt>
                                    <dd>
                                        <code>{rule.eventType}</code>
                                    </dd>
                                </div>
                                <div>
                                    <dt>Đối tượng</dt>
                                    <dd>{getAppliesToLabel(rule.appliesTo)}</dd>
                                </div>
                                <div>
                                    <dt>Giá trị</dt>
                                    <dd>{formatScoreValue(rule.scoreValue, rule.ruleType)}</dd>
                                </div>
                                <div>
                                    <dt>Trạng thái</dt>
                                    <dd>
                                        <span
                                            className={`admin-skills-badge ${
                                                rule.active
                                                    ? 'admin-skills-badge--active'
                                                    : 'admin-skills-badge--inactive'
                                            }`}
                                        >
                                            {rule.active ? 'Đang hoạt động' : 'Đã vô hiệu'}
                                        </span>
                                    </dd>
                                </div>
                                <div>
                                    <dt>Phiên bản</dt>
                                    <dd>{rule.version ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt>Cập nhật</dt>
                                    <dd>{formatDateTime(rule.updatedAt)}</dd>
                                </div>
                                <div className="admin-trust-detail-grid__full">
                                    <dt>Mô tả</dt>
                                    <dd>{rule.description || '—'}</dd>
                                </div>
                                {rule.ruleType === 'REHABILITATION' ? (
                                    <div className="admin-trust-detail-grid__full">
                                        <dt>Điều kiện phục hồi</dt>
                                        <dd>
                                            {conditions.requiredDays} ngày
                                            {conditions.requiresHiredActivity
                                                ? ' · yêu cầu hoạt động HIRED'
                                                : ''}
                                        </dd>
                                    </div>
                                ) : null}
                                {rule.ruleType === 'RESOLVED_REPORT_ADJUSTMENT' && (rule.reasonName || rule.reasonDescription) ? (
                                    <>
                                        {rule.reasonName ? (
                                            <div className="admin-trust-detail-grid__full">
                                                <dt>Lý do hiển thị cho User</dt>
                                                <dd>{rule.reasonName}</dd>
                                            </div>
                                        ) : null}
                                        {rule.reasonDescription ? (
                                            <div className="admin-trust-detail-grid__full">
                                                <dt>Mô tả lý do cho User</dt>
                                                <dd>{rule.reasonDescription}</dd>
                                            </div>
                                        ) : null}
                                    </>
                                ) : null}
                            </dl>

                            {isSystem ? (
                                <p className="admin-skills-modal__hint">
                                    Quy tắc hệ thống chỉ xem. Không chỉnh sửa / bật / tắt từ màn này.
                                </p>
                            ) : null}

                            <h3 className="admin-trust-history-title">Lịch sử thay đổi</h3>
                            {history.length === 0 ? (
                                <p className="admin-trust-hint">Chưa có lịch sử audit.</p>
                            ) : (
                                <ul className="admin-trust-history-list">
                                    {history.map((item) => {
                                        const oldValue = parseJsonSafe(item.oldValue);
                                        const newValue = parseJsonSafe(item.newValue);
                                        return (
                                            <li key={item.id} className="admin-trust-history-item">
                                                <div className="admin-trust-history-item__head">
                                                    <strong>{getAuditActionLabel(item.action)}</strong>
                                                    <span>{formatDateTime(item.createdAt)}</span>
                                                </div>
                                                <p className="admin-trust-hint">
                                                    {item.actorName || 'Admin'}
                                                    {item.actorEmail ? ` · ${item.actorEmail}` : ''}
                                                </p>
                                                <p>
                                                    Lý do: <em>{item.reason || '—'}</em>
                                                </p>
                                                {(oldValue || newValue) && (
                                                    <pre className="admin-trust-history-diff">
                                                        {JSON.stringify(
                                                            { oldValue, newValue },
                                                            null,
                                                            2
                                                        )}
                                                    </pre>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </>
                    ) : null}
                </div>

                <div className="admin-skills-modal__footer">
                    <button
                        type="button"
                        className="admin-skills-btn admin-skills-btn--ghost"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Đóng
                    </button>
                    {rule && !isSystem ? (
                        <>
                            <button
                                type="button"
                                className="admin-skills-btn admin-skills-btn--ghost"
                                onClick={() => onEdit?.(rule)}
                                disabled={loading}
                            >
                                Sửa
                            </button>
                            <button
                                type="button"
                                className={`admin-skills-btn ${
                                    rule.active
                                        ? 'admin-skills-btn--danger'
                                        : 'admin-skills-btn--primary'
                                }`}
                                onClick={() => onToggleStatus?.(rule)}
                                disabled={loading}
                            >
                                {rule.active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                            </button>
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default TrustScoreRuleDetailModal;
