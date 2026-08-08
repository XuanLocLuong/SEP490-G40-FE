import { MonitorBar, MonitorDonut, mapToChartData } from './MonitorCharts.jsx';
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
    const spotlight = d
        ? [
              { name: 'Công khai', value: Number(d.publicJobs) || 0 },
              { name: 'Tuyển gấp', value: Number(d.urgentJobs) || 0 },
              { name: 'Đã xóa', value: Number(d.deletedJobs) || 0 },
          ]
        : [];

    return (
        <section className="admin-monitor-card">
            <header className="admin-monitor-card__header">
                <div>
                    <h2>Tin tuyển</h2>
                    <p className="admin-monitor-hint">
                        Tin tạo trong kỳ và phân bố trạng thái / đặc điểm nổi bật.
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
                        <div>
                            <span>Đã xóa trong kỳ</span>
                            <strong>{formatCount(d.deletedJobs)}</strong>
                        </div>
                    </div>

                    <div className="admin-monitor-split">
                        <div>
                            <p className="admin-monitor-chart-caption">Theo trạng thái</p>
                            <MonitorDonut data={byStatus} height={170} />
                        </div>
                        <div>
                            <p className="admin-monitor-chart-caption">Đặc điểm nổi bật</p>
                            <MonitorBar data={spotlight} height={170} layout="vertical" />
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
