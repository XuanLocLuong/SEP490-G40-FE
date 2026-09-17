import { Link } from 'react-router-dom';
import { ROUTES } from '../../../routes/path.js';
import {
    formatCount,
    filterAdminFacingWarnings,
    NAV_ACTION_LABELS,
    SEVERITY_LABELS,
    WARNING_META,
    isSectionAvailable,
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
    const detail = warning.detail || meta.detail || '';
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
                    {warning.showSeverity !== false && (
                        <span className="admin-monitor-alert__severity">
                            {SEVERITY_LABELS[warning.severity] || warning.severity}
                        </span>
                    )}
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

const OperationalAlertsCard = ({ warnings, moderation }) => {
    const list = filterAdminFacingWarnings(warnings)
        .filter((w) => w.code === 'PENDING_REPORTS' || w.code === 'PENDING_VERIFICATIONS')
        .map((w) => ({
            ...w,
            showSeverity: false,
            navigationAction: null,
            detail: w.code === 'PENDING_REPORTS'
                ? `Có ${formatCount(w.value)} báo cáo chờ Post Manager xử lý.`
                : `Có ${formatCount(w.value)} yêu cầu chờ đội Manual Check xét duyệt.`,
        }));
    if (isSectionAvailable(moderation)) {
        const queues = [
            { code: 'PENDING_JOB_MODERATION', metric: 'moderation.pendingJobReviews', value: moderation.data.pendingJobReviews,
                detail: `Có ${formatCount(moderation.data.pendingJobReviews)} tin tuyển chờ Post Manager kiểm duyệt.` },
            { code: 'PENDING_REVIEW_MODERATION', metric: 'moderation.pendingContentReviews', value: moderation.data.pendingContentReviews,
                detail: `Có ${formatCount(moderation.data.pendingContentReviews)} đánh giá chờ đội Manual Check kiểm duyệt.` },
        ];
        list.push(...queues.filter((w) => Number(w.value) > 0)
            .map((w) => ({ ...w, severity: 'INFO', showSeverity: false })));
    }
    return (
        <section className="admin-monitor-alerts-panel" aria-labelledby="monitor-alerts-title">
            <header className="admin-monitor-alerts-panel__header">
                <h2 id="monitor-alerts-title">Các mục đang chờ xử lý</h2>
                {list.length > 0 ? (
                    <span className="admin-monitor-alerts-panel__count">{list.length}</span>
                ) : null}
            </header>
            {list.length > 0 ? (
                <div className="admin-monitor-alerts-panel__list">
                    {list.map((w) => (
                        <OperationalAlertItem key={`${w.code}-${w.metric}`} warning={w} />
                    ))}
                </div>
            ) : (
                <p className="admin-monitor-alerts-panel__empty">Không có mục đang chờ xử lý trong kỳ này.</p>
            )}
        </section>
    );
};

export default OperationalAlertsCard;
