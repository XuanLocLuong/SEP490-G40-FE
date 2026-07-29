import { formatCount, isSectionAvailable } from '../../../utils/platformMonitoringDisplay.js';

const NotificationEmailHealth = ({ communications }) => {
    const available = isSectionAvailable(communications);
    const d = available ? communications.data : null;

    return (
        <section className="admin-monitor-card admin-monitor-health-card">
            <header className="admin-monitor-card__header">
                <div>
                    <h2>Thông báo & email</h2>
                    <p className="admin-monitor-hint">Sức khỏe kênh thông báo trong kỳ.</p>
                </div>
                <span
                    className={`admin-monitor-pill ${
                        available ? 'admin-monitor-pill--ok' : 'admin-monitor-pill--warn'
                    }`}
                >
                    {available ? 'Sẵn sàng' : 'Tạm lỗi'}
                </span>
            </header>
            {available ? (
                <div className="admin-monitor-card__body admin-monitor-compact-metrics">
                    <div>
                        <span>Thông báo tạo</span>
                        <strong>{formatCount(d.notificationsCreated)}</strong>
                    </div>
                    <div>
                        <span>Chưa đọc</span>
                        <strong>{formatCount(d.unreadNotifications)}</strong>
                    </div>
                    <div>
                        <span>Email chờ gửi</span>
                        <strong>{formatCount(d.pendingEmails)}</strong>
                    </div>
                    <div>
                        <span>Email lỗi</span>
                        <strong className={d.failedEmails > 0 ? 'is-warn' : ''}>
                            {formatCount(d.failedEmails)}
                        </strong>
                    </div>
                </div>
            ) : (
                <p className="admin-monitor-card__empty">Tạm không có dữ liệu thông báo & email.</p>
            )}
        </section>
    );
};

export default NotificationEmailHealth;
