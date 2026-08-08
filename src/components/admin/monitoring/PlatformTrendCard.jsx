import { MonitorTrendChart } from './MonitorCharts.jsx';
import { isSectionAvailable } from '../../../utils/platformMonitoringDisplay.js';

const PlatformTrendCard = ({ trends, trendRows }) => {
    const available = isSectionAvailable(trends);
    return (
        <section className="admin-monitor-card admin-monitor-trends">
            <header className="admin-monitor-card__header">
                <div>
                    <h2>Xu hướng hoạt động nền tảng</h2>
                    <p className="admin-monitor-hint">
                        Người dùng mới · Tin tuyển · Đơn ứng tuyển · Tuyển thành công
                    </p>
                </div>
                <span
                    className={`admin-monitor-pill ${
                        available ? 'admin-monitor-pill--ok' : 'admin-monitor-pill--warn'
                    }`}
                >
                    {available ? 'Sẵn sàng' : 'Tạm lỗi'}
                </span>
            </header>
            <div className="admin-monitor-trends__body">
                {available ? (
                    <MonitorTrendChart rows={trendRows} height={260} includeReports={false} />
                ) : (
                    <p className="admin-monitor-card__empty">Tạm không có dữ liệu xu hướng.</p>
                )}
            </div>
        </section>
    );
};

export default PlatformTrendCard;
