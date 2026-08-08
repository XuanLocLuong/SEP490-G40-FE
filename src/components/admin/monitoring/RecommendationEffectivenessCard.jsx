import { MonitorGroupedBar } from './MonitorCharts.jsx';
import {
    formatCount,
    formatRatePercent,
    isSectionAvailable,
    RECOMMENDATION_HIRE_RATE_TOOLTIP,
} from '../../../utils/platformMonitoringDisplay.js';

const COMPARE_SERIES = [
    { dataKey: 'don', name: 'Đơn ứng tuyển', color: '#2f5fdb' },
    { dataKey: 'tuyen', name: 'Tuyển thành công', color: '#16a34a' },
];

const RecommendationEffectivenessCard = ({ applications }) => {
    const appsOk = isSectionAvailable(applications);
    const attr = appsOk ? applications.data?.recommendationAttribution : null;
    const available = Boolean(attr);

    const hireFromRec = available
        ? formatRatePercent(attr.recommendationHireRatePercent)
        : '—';
    const hireNonRec = available
        ? formatRatePercent(attr.nonRecommendationHireRatePercent)
        : '—';

    const compareChart = available
        ? [
              {
                  name: 'Từ gợi ý',
                  don: Number(attr.recommendationAttributedApplications) || 0,
                  tuyen: Number(attr.recommendationAttributedHires) || 0,
              },
              {
                  name: 'Ngoài gợi ý',
                  don: Number(attr.nonRecommendationApplications) || 0,
                  tuyen: Number(attr.nonRecommendationHires) || 0,
              },
          ]
        : [];

    return (
        <section className="admin-monitor-card admin-monitor-card--algo">
            <header className="admin-monitor-card__header">
                <div>
                    <h2>Hiệu quả gợi ý việc làm</h2>
                    <p className="admin-monitor-hint">
                        So sánh từ gợi ý JobLink với các nguồn khác.
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
                            title={RECOMMENDATION_HIRE_RATE_TOOLTIP}
                        >
                            <span>Tỷ lệ tuyển từ gợi ý</span>
                            <strong>{hireFromRec}</strong>
                        </div>
                        <div className="admin-monitor-relation-metric">
                            <span>Tỷ lệ tuyển ngoài gợi ý</span>
                            <strong>{hireNonRec}</strong>
                        </div>
                    </div>

                    <div className="admin-monitor-compact-metrics">
                        <div>
                            <span>Đơn từ gợi ý</span>
                            <strong>{formatCount(attr.recommendationAttributedApplications)}</strong>
                        </div>
                        <div>
                            <span>Đơn ngoài gợi ý</span>
                            <strong>{formatCount(attr.nonRecommendationApplications)}</strong>
                        </div>
                        <div>
                            <span>Tuyển thành công từ gợi ý</span>
                            <strong>{formatCount(attr.recommendationAttributedHires)}</strong>
                        </div>
                        <div>
                            <span>Tuyển thành công ngoài gợi ý</span>
                            <strong>{formatCount(attr.nonRecommendationHires)}</strong>
                        </div>
                    </div>

                    <p className="admin-monitor-chart-caption admin-monitor-chart-caption--stack">
                        <span>Đơn ứng tuyển</span>
                        <span>Tuyển thành công</span>
                    </p>
                    <MonitorGroupedBar
                        data={compareChart}
                        series={COMPARE_SERIES}
                        height={200}
                    />
                </div>
            ) : (
                <p className="admin-monitor-card__empty">
                    {appsOk
                        ? 'Chưa có số liệu phân bổ nguồn gợi ý cho kỳ này.'
                        : 'Tạm không có dữ liệu đơn ứng tuyển.'}
                </p>
            )}
        </section>
    );
};

export default RecommendationEffectivenessCard;
