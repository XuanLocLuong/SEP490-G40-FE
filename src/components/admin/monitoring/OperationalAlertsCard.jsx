import {
    formatCount,
    NAV_ACTION_LABELS,
    SEVERITY_LABELS,
    WARNING_META,
} from '../../../utils/platformMonitoringDisplay.js';

const OperationalAlertItem = ({ warning }) => {
    const severity = String(warning.severity || 'INFO').toLowerCase();
    const meta = WARNING_META[warning.code] || {};
    const title = meta.title || warning.message || warning.code;
    const detail = meta.detail || '';
    const actionLabel = warning.navigationAction
        ? NAV_ACTION_LABELS[warning.navigationAction] || warning.navigationAction
        : null;

    return (
        <article className={`admin-monitor-alert admin-monitor-alert--${severity}`}>
            <div className="admin-monitor-alert__count" aria-hidden="true">
                {formatCount(warning.value)}
            </div>
            <div className="admin-monitor-alert__body">
                <div className="admin-monitor-alert__top">
                    <h3>{title}</h3>
                    <span className="admin-monitor-alert__severity">
                        {SEVERITY_LABELS[warning.severity] || warning.severity}
                    </span>
                </div>
                {detail ? <p>{detail}</p> : null}
                {actionLabel ? (
                    <span className="admin-monitor-alert__action" title="Màn hình liên quan — chưa gắn điều hướng Admin">
                        Gợi ý quy trình: {actionLabel}
                    </span>
                ) : null}
            </div>
        </article>
    );
};

const OperationalAlertsCard = ({ warnings }) => {
    const list = Array.isArray(warnings) ? warnings : [];
    return (
        <section className="admin-monitor-alerts-panel" aria-labelledby="monitor-alerts-title">
            <header className="admin-monitor-alerts-panel__header">
                <h2 id="monitor-alerts-title">Vấn đề cần chú ý</h2>
                <p>
                    Theo dõi thôi — không tự xử lý. Pending chưa quá SLA không đồng nghĩa sự cố nghiêm trọng.
                    {list.length > 0 ? ` · ${list.length} mục` : ''}
                </p>
            </header>
            {list.length > 0 ? (
                <div className="admin-monitor-alerts-panel__list">
                    {list.map((w) => (
                        <OperationalAlertItem key={`${w.code}-${w.metric}`} warning={w} />
                    ))}
                </div>
            ) : (
                <p className="admin-monitor-alerts-panel__empty">Không có cảnh báo trong kỳ này.</p>
            )}
        </section>
    );
};

export default OperationalAlertsCard;
