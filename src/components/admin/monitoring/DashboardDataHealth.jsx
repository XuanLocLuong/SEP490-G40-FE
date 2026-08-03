import {
    formatInstantVi,
    isSectionAvailable,
    SECTION_LABELS,
} from '../../../utils/platformMonitoringDisplay.js';

const statusClass = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'UP' || s === 'AVAILABLE') return 'admin-monitor-pill--ok';
    if (s === 'DOWN' || s === 'TEMPORARILY_UNAVAILABLE') return 'admin-monitor-pill--warn';
    return '';
};

const DashboardDataHealth = ({ data }) => {
    if (!data) {
        return (
            <section className="admin-monitor-card admin-monitor-health-card">
                <header className="admin-monitor-card__header">
                    <div>
                        <h2>Tình trạng dữ liệu</h2>
                    </div>
                </header>
                <p className="admin-monitor-card__empty">Chưa có phản hồi giám sát.</p>
            </section>
        );
    }

    const unavailable = Array.isArray(data.unavailableSections) ? data.unavailableSections : [];
    const partial = data.availability === 'PARTIALLY_AVAILABLE';
    const health = isSectionAvailable(data.operationalHealth) ? data.operationalHealth.data : null;

    return (
        <section className="admin-monitor-card admin-monitor-health-card">
            <header className="admin-monitor-card__header">
                <div>
                    <h2>Tình trạng dữ liệu & hệ thống</h2>
                    <p className="admin-monitor-hint">Độ đầy đủ dashboard và health check API/DB.</p>
                </div>
                <span
                    className={`admin-monitor-pill ${
                        partial ? 'admin-monitor-pill--warn' : 'admin-monitor-pill--ok'
                    }`}
                >
                    {partial ? 'Thiếu một phần' : 'Đầy đủ'}
                </span>
            </header>
            <div className="admin-monitor-card__body admin-monitor-compact-metrics">
                <div>
                    <span>Cập nhật lúc</span>
                    <strong className="admin-monitor-compact-metrics__text">
                        {formatInstantVi(data.lastUpdatedAt)}
                    </strong>
                </div>
                <div>
                    <span>Nhóm tạm lỗi</span>
                    <strong>{unavailable.length}</strong>
                </div>
                {health ? (
                    <>
                        <div>
                            <span>API</span>
                            <strong>
                                <span className={`admin-monitor-pill ${statusClass(health.apiStatus)}`}>
                                    {health.apiStatus || '—'}
                                </span>
                            </strong>
                        </div>
                        <div>
                            <span>Database</span>
                            <strong>
                                <span
                                    className={`admin-monitor-pill ${statusClass(health.databaseStatus)}`}
                                >
                                    {health.databaseStatus || '—'}
                                </span>
                            </strong>
                        </div>
                        <div>
                            <span>Health check</span>
                            <strong className="admin-monitor-compact-metrics__text">
                                {formatInstantVi(health.checkedAt)}
                            </strong>
                        </div>
                    </>
                ) : null}
            </div>
            {unavailable.length > 0 ? (
                <ul className="admin-monitor-unavailable-list">
                    {unavailable.map((item) => (
                        <li key={item.section}>
                            {SECTION_LABELS[item.section] || item.section}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="admin-monitor-hint admin-monitor-health-card__ok">
                    Tất cả nhóm số liệu nghiệp vụ truy xuất được.
                </p>
            )}
        </section>
    );
};

export default DashboardDataHealth;
