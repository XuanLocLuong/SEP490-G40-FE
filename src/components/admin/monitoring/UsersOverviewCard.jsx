import {
    MonitorDonut,
    mapToChartData,
} from './MonitorCharts.jsx';
import {
    formatCount,
    isSectionAvailable,
    LABEL_MAPS,
} from '../../../utils/platformMonitoringDisplay.js';

const UsersOverviewCard = ({ users }) => {
    const available = isSectionAvailable(users);
    const d = available ? users.data : null;
    const byStatus = d
        ? mapToChartData(d.byAccountStatus, { labelMap: LABEL_MAPS.accountStatus })
        : [];
    const byRole = d ? mapToChartData(d.byRole, { labelMap: LABEL_MAPS.role }) : [];

    return (
        <section className="admin-monitor-card">
            <header className="admin-monitor-card__header">
                <div>
                    <h2>Người dùng</h2>
                    <p className="admin-monitor-hint">
                        Trạng thái và vai trò hiện tại của các tài khoản được tạo trong kỳ.
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

            {available ? (
                <div className="admin-monitor-card__body">
                    <div className="admin-monitor-compact-metrics">
                        <div>
                            <span>Tài khoản mới</span>
                            <strong>{formatCount(d.createdUsers)}</strong>
                        </div>
                    </div>

                    <div className="admin-monitor-split">
                        <div>
                            <p className="admin-monitor-chart-caption">Theo trạng thái</p>
                            <MonitorDonut data={byStatus} height={170} />
                        </div>
                        <div>
                            <p className="admin-monitor-chart-caption">Theo vai trò</p>
                            <MonitorDonut data={byRole} height={170} />
                        </div>
                    </div>
                </div>
            ) : (
                <p className="admin-monitor-card__empty">Tạm không có dữ liệu người dùng.</p>
            )}
        </section>
    );
};

export default UsersOverviewCard;
