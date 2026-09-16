import { MonitorDonut, mapToChartData } from './MonitorCharts.jsx';
import {
    formatCount,
    isSectionAvailable,
    LABEL_MAPS,
} from '../../../utils/platformMonitoringDisplay.js';

const JobsOverviewCard = ({ jobs }) => {
    const available = isSectionAvailable(jobs);
    const d = available ? jobs.data : null;
    const byStatus = d
        ? mapToChartData(d.byStatus, { labelMap: LABEL_MAPS.jobStatus })
        : [];

    return (
        <section className="admin-monitor-card">
            <header className="admin-monitor-card__header">
                <div>
                    <h2>Tin tuyển</h2>
                    <p className="admin-monitor-hint">
                        Trạng thái hiện tại của các tin được tạo trong kỳ.
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
                            <span>Tin mới</span>
                            <strong>{formatCount(d.createdJobs)}</strong>
                        </div>
                        <div>
                            <span>Công khai</span>
                            <strong>{formatCount(d.publicJobs)}</strong>
                        </div>
                        <div>
                            <span>Tuyển gấp</span>
                            <strong>{formatCount(d.urgentJobs)}</strong>
                        </div>
                    </div>

                    <div>
                        <div>
                            <p className="admin-monitor-chart-caption">Theo trạng thái</p>
                            <MonitorDonut data={byStatus} height={170} />
                        </div>
                    </div>
                </div>
            ) : (
                <p className="admin-monitor-card__empty">Tạm không có dữ liệu tin tuyển.</p>
            )}
        </section>
    );
};

export default JobsOverviewCard;
