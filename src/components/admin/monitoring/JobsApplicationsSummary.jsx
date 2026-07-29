import {
    MonitorBar,
    MonitorDonut,
    MonitorHiringRelationChart,
    mapToChartData,
} from './MonitorCharts.jsx';
import { APPS_PER_JOB_TOOLTIP, formatAppsPerJob } from '../../../utils/appsPerJob.js';
import {
    formatCount,
    formatRatePercent,
    HIRE_RATE_TOOLTIP,
    isSectionAvailable,
    LABEL_MAPS,
} from '../../../utils/platformMonitoringDisplay.js';

const StatChips = ({ items }) => (
    <div className="admin-monitor-chips">
        {items.map((item) => (
            <div key={item.label} className="admin-monitor-chip" title={item.title}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
            </div>
        ))}
    </div>
);

const JobsApplicationsSummary = ({ jobs, applications, trends, trendRows }) => {
    const jobsOk = isSectionAvailable(jobs);
    const appsOk = isSectionAvailable(applications);
    const trendsOk = isSectionAvailable(trends);
    const available = jobsOk || appsOk || trendsOk;

    const createdJobs = jobsOk ? jobs.data.createdJobs : null;
    const submittedApps = appsOk ? applications.data.submittedApplications : null;
    const hireRate = appsOk
        ? formatRatePercent(applications.data.applicationToHireRatePercent)
        : '—';
    const appsPerJob = formatAppsPerJob(submittedApps, createdJobs);

    return (
        <article className="admin-monitor-card admin-monitor-card--wide">
            <header className="admin-monitor-card__header">
                <div>
                    <h2>Tin tuyển & đơn ứng tuyển</h2>
                    <p className="admin-monitor-hint">
                        Xu hướng tin → đơn → tuyển thành công trong kỳ (không lặp KPI đầu trang).
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
                    <div className="admin-monitor-relation-metrics admin-monitor-relation-metrics--compact">
                        <div
                            className="admin-monitor-relation-metric admin-monitor-relation-metric--accent"
                            title={APPS_PER_JOB_TOOLTIP}
                        >
                            <span>Đơn trung bình trên mỗi tin mới</span>
                            <strong>{appsPerJob}</strong>
                        </div>
                        <div
                            className="admin-monitor-relation-metric admin-monitor-relation-metric--accent"
                            title={HIRE_RATE_TOOLTIP}
                        >
                            <span>Tỷ lệ tuyển</span>
                            <strong>{hireRate}</strong>
                        </div>
                    </div>

                    <p className="admin-monitor-chart-caption">Xu hướng theo ngày</p>
                    {trendsOk ? (
                        <MonitorHiringRelationChart rows={trendRows} height={240} />
                    ) : (
                        <p className="admin-monitor-card__empty">
                            Tạm không có dữ liệu xu hướng để vẽ quan hệ tin–đơn.
                        </p>
                    )}

                    <div className="admin-monitor-split">
                        <div>
                            <p className="admin-monitor-chart-caption">Tin theo trạng thái</p>
                            {jobsOk ? (
                                <>
                                    <StatChips
                                        items={[
                                            {
                                                label: 'Công khai',
                                                value: formatCount(jobs.data.publicJobs),
                                            },
                                            {
                                                label: 'Tuyển gấp',
                                                value: formatCount(jobs.data.urgentJobs),
                                            },
                                            {
                                                label: 'Đã xóa',
                                                value: formatCount(jobs.data.deletedJobs),
                                            },
                                        ]}
                                    />
                                    <MonitorBar
                                        data={mapToChartData(jobs.data.byStatus, {
                                            labelMap: LABEL_MAPS.jobStatus,
                                        })}
                                        height={190}
                                    />
                                </>
                            ) : (
                                <p className="admin-monitor-card__empty">Tạm không có dữ liệu tin tuyển.</p>
                            )}
                        </div>
                        <div>
                            <p className="admin-monitor-chart-caption">Đơn theo trạng thái hiện tại</p>
                            {appsOk ? (
                                <MonitorDonut
                                    data={mapToChartData(applications.data.byCurrentStatus, {
                                        hideZero: true,
                                        labelMap: LABEL_MAPS.applicationStatus,
                                    })}
                                    height={200}
                                />
                            ) : (
                                <p className="admin-monitor-card__empty">
                                    Tạm không có dữ liệu đơn ứng tuyển.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <p className="admin-monitor-card__empty">
                    Tạm không có dữ liệu tin tuyển và đơn ứng tuyển.
                </p>
            )}
        </article>
    );
};

export default JobsApplicationsSummary;
