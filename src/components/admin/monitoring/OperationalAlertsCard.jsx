import { Link } from 'react-router-dom';
import { ROUTES } from '../../../routes/path.js';
import {
    formatCount,
    NAV_ACTION_LABELS,
    SEVERITY_LABELS,
    WARNING_META,
} from '../../../utils/platformMonitoringDisplay.js';

/** FE routes Admin có thể mở ngay từ cảnh báo. Role khác chỉ hiện gợi ý chữ. */
const WARNING_ROUTE_BY_ACTION = {
    MANAGE_ACCOUNTS: ROUTES.ADMIN_ACCOUNTS,
    REVIEW_AUDIT_LOGS: ROUTES.ADMIN_AUDIT_LOG,
    MANAGE_SYSTEM_CONFIGURATIONS: ROUTES.ADMIN_SYSTEM_CONFIG,
};

const OperationalAlertItem = ({ warning }) => {
    const severity = String(warning.severity || 'INFO').toLowerCase();
    const meta = WARNING_META[warning.code] || {};
    const title = meta.title || warning.message || warning.code;
    const detail = meta.detail || '';
    const actionKey = warning.navigationAction;
    const actionLabel = actionKey
        ? NAV_ACTION_LABELS[actionKey] || actionKey
        : null;
    const to = actionKey ? WARNING_ROUTE_BY_ACTION[actionKey] : null;

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
                {to && actionLabel ? (
                    <Link className="admin-monitor-alert__action admin-monitor-alert__action--link" to={to}>
                        Mở: {actionLabel}
                    </Link>
                ) : actionLabel ? (
                    <span className="admin-monitor-alert__action">
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
                    Theo dõi thôi — không tự xử lý. Pending chưa quá SLA không đồng nghĩa sự cố nghiêm
                    trọng.
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
