import { MonitorBar } from './MonitorCharts.jsx';
import {
    AI_AUTO_APPROVE_TOOLTIP,
    AI_HUMAN_AGREEMENT_TOOLTIP,
    formatCount,
    formatRatePercent,
    isSectionAvailable,
} from '../../../utils/platformMonitoringDisplay.js';

const formatDaysFromMinutes = (minutes) => {
    if (minutes == null || minutes === '') return '—';
    const n = Number(minutes);
    if (Number.isNaN(n)) return '—';
    const days = n / (24 * 60);
    return `${days.toLocaleString('vi-VN', {
        maximumFractionDigits: 1,
        minimumFractionDigits: 0,
    })} ngày`;
};

const AiModerationEffectivenessCard = ({ aiModeration }) => {
    const available = isSectionAvailable(aiModeration);
    const d = available ? aiModeration.data : null;

    const totalRequests = d ? Number(d.jobReviewRequests) || 0 : 0;
    const autoApproved = d ? Number(d.queueTypeDistribution?.AUTO_APPROVE) || 0 : 0;
    const manualReviews = Math.max(0, totalRequests - autoApproved);
    const avgManualDaysLabel = d
        ? formatDaysFromMinutes(d.averageManualReviewProcessingMinutes)
        : '—';
    const avgManualTitle =
        d?.averageManualReviewProcessingMinutes == null
            ? 'Chưa có dữ liệu thời gian duyệt tay.'
            : `Trung bình ${(Number(d.averageManualReviewProcessingMinutes) || 0).toLocaleString(
                  'vi-VN',
                  { maximumFractionDigits: 0 }
              )} phút (~${avgManualDaysLabel}).`;

    const compareChart = available
        ? [
              { name: 'Duyệt tự động', value: autoApproved },
              { name: 'Duyệt tay', value: manualReviews },
          ]
        : [];

    return (
        <section className="admin-monitor-card admin-monitor-card--algo">
            <header className="admin-monitor-card__header">
                <div>
                    <h2>Hiệu quả duyệt bằng AI</h2>
                    <p className="admin-monitor-hint">
                        So sánh duyệt tự động và duyệt tay trong kỳ.
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
                            title={AI_AUTO_APPROVE_TOOLTIP}
                        >
                            <span>Tỷ lệ duyệt tự động</span>
                            <strong>{formatRatePercent(d.autoApproveRatePercent)}</strong>
                        </div>
                        <div
                            className="admin-monitor-relation-metric admin-monitor-relation-metric--accent"
                            title={AI_HUMAN_AGREEMENT_TOOLTIP}
                        >
                            <span>Khớp AI–người duyệt</span>
                            <strong>{formatRatePercent(d.aiHumanAgreementRatePercent)}</strong>
                        </div>
                    </div>

                    <div className="admin-monitor-compare-pair">
                        <article
                            className="admin-monitor-compare-pair__col"
                            title="Số yêu cầu duyệt tin được auto-approve trong kỳ."
                        >
                            <h3>Duyệt tự động</h3>
                            <strong className="admin-monitor-compare-pair__value">
                                {formatCount(autoApproved)}
                            </strong>
                            <span className="admin-monitor-compare-pair__sub">
                                / {formatCount(totalRequests)} yêu cầu tin
                            </span>
                            <span className="admin-monitor-compare-pair__meta">Thời gian: tức thì</span>
                        </article>
                        <article
                            className="admin-monitor-compare-pair__col"
                            title={avgManualTitle}
                        >
                            <h3>Duyệt tay</h3>
                            <strong className="admin-monitor-compare-pair__value">
                                {formatCount(manualReviews)}
                            </strong>
                            <span className="admin-monitor-compare-pair__sub">
                                / {formatCount(totalRequests)} yêu cầu tin
                            </span>
                            <span className="admin-monitor-compare-pair__meta">
                                TB xử lý: {avgManualDaysLabel}
                            </span>
                        </article>
                    </div>

                    <p className="admin-monitor-chart-caption">
                        Số yêu cầu: tự động so với duyệt tay
                    </p>
                    <MonitorBar data={compareChart} height={190} />
                </div>
            ) : (
                <p className="admin-monitor-card__empty">Tạm không có dữ liệu duyệt bằng AI.</p>
            )}
        </section>
    );
};

export default AiModerationEffectivenessCard;
