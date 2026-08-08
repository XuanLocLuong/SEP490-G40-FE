import { MonitorDonut, mapToChartData } from './MonitorCharts.jsx';
import {
    formatCount,
    isSectionAvailable,
    LABEL_MAPS,
} from '../../../utils/platformMonitoringDisplay.js';

/**
 * Admin-facing ops: email delivery only.
 * API / DB / section-availability meta is for engineers, not business Admin.
 */
const PlatformOpsHealthCard = ({ communications }) => {
    const emailOk = isSectionAvailable(communications);
    const email = emailOk ? communications.data : null;
    const failed = email ? Number(email.failedEmails) || 0 : 0;
    const pending = email ? Number(email.pendingEmails) || 0 : 0;
    const created = email ? Number(email.emailsCreated) || 0 : 0;
    const byStatus = email
        ? mapToChartData(email.emailsByStatus, {
              labelMap: LABEL_MAPS.emailStatus,
              hideZero: true,
          })
        : [];
    const showChart = failed > 0 || pending > 0 || byStatus.length > 0;

    return (
        <section className="admin-monitor-card admin-monitor-health-card">
            <header className="admin-monitor-card__header">
                <div>
                    <h2>Email hệ thống</h2>
                    <p className="admin-monitor-hint">
                        Theo dõi việc gửi email tới người dùng trong kỳ.
                    </p>
                </div>
                <span
                    className={`admin-monitor-pill ${
                        !emailOk || failed > 0
                            ? 'admin-monitor-pill--warn'
                            : 'admin-monitor-pill--ok'
                    }`}
                >
                    {!emailOk ? 'Tạm lỗi' : failed > 0 ? 'Có lỗi gửi' : 'Ổn'}
                </span>
            </header>

            {emailOk ? (
                <div className="admin-monitor-card__body">
                    <div
                        className={`admin-monitor-queue-hero${failed > 0 ? ' is-warn' : ''}`}
                        title="FAILED hoặc ERROR trong kỳ."
                    >
                        <span>Gửi thất bại</span>
                        <strong>{formatCount(failed)}</strong>
                    </div>
                    <div className="admin-monitor-compact-metrics">
                        <div>
                            <span>Đã tạo trong kỳ</span>
                            <strong>{formatCount(created)}</strong>
                        </div>
                        <div title="PENDING + QUEUED">
                            <span>Đang chờ gửi</span>
                            <strong className={pending > 0 ? 'is-warn' : undefined}>
                                {formatCount(pending)}
                            </strong>
                        </div>
                    </div>
                    {showChart && byStatus.length > 0 ? (
                        <>
                            <p className="admin-monitor-chart-caption">Theo trạng thái gửi</p>
                            <MonitorDonut data={byStatus} height={160} />
                        </>
                    ) : null}
                </div>
            ) : (
                <p className="admin-monitor-card__empty">Tạm không có dữ liệu email.</p>
            )}
        </section>
    );
};

export default PlatformOpsHealthCard;
