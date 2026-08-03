import {
    MonitorDonut,
    mapToChartData,
} from './MonitorCharts.jsx';
import {
    formatCount,
    isSectionAvailable,
    LABEL_MAPS,
} from '../../../utils/platformMonitoringDisplay.js';

const SectionPill = ({ available }) => (
    <span
        className={`admin-monitor-pill ${
            available ? 'admin-monitor-pill--ok' : 'admin-monitor-pill--warn'
        }`}
    >
        {available ? 'Sẵn sàng' : 'Tạm lỗi'}
    </span>
);

const GovernanceQueuesCard = ({ reports, verification, moderation }) => {
    const reportsOk = isSectionAvailable(reports);
    const verificationOk = isSectionAvailable(verification);
    const moderationOk = isSectionAvailable(moderation);
    const anyOk = reportsOk || verificationOk || moderationOk;

    const reportRows = reportsOk
        ? mapToChartData(reports.data.byStatus, { labelMap: LABEL_MAPS.reportStatus })
        : [];
    const verificationRows = verificationOk
        ? mapToChartData(verification.data.byStatus, {
              labelMap: LABEL_MAPS.verificationStatus,
              hideZero: true,
          })
        : [];

    return (
        <section className="admin-monitor-card admin-monitor-card--wide">
            <header className="admin-monitor-card__header">
                <div>
                    <h2>Báo cáo · Xác minh · Kiểm duyệt</h2>
                    <p className="admin-monitor-hint">
                        Hàng đợi vận hành từ API UC-47 — chỉ giám sát, không tự xử lý tại đây.
                    </p>
                </div>
                <SectionPill available={anyOk} />
            </header>

            {!anyOk ? (
                <p className="admin-monitor-card__empty">
                    Tạm không có dữ liệu báo cáo / xác minh / kiểm duyệt.
                </p>
            ) : (
                <div className="admin-monitor-card__body">
                    <div className="admin-monitor-governance-grid">
                        <article className="admin-monitor-governance-block">
                            <header className="admin-monitor-governance-block__head">
                                <h3>Báo cáo</h3>
                                <SectionPill available={reportsOk} />
                            </header>
                            {reportsOk ? (
                                <>
                                    <div className="admin-monitor-compact-metrics">
                                        <div>
                                            <span>Tạo trong kỳ</span>
                                            <strong>{formatCount(reports.data.createdReports)}</strong>
                                        </div>
                                        <div>
                                            <span>Đang chờ</span>
                                            <strong className={reports.data.pendingReports > 0 ? 'is-warn' : ''}>
                                                {formatCount(reports.data.pendingReports)}
                                            </strong>
                                        </div>
                                        <div>
                                            <span>Chờ chưa đọc</span>
                                            <strong
                                                className={
                                                    reports.data.unreadPendingReports > 0 ? 'is-warn' : ''
                                                }
                                            >
                                                {formatCount(reports.data.unreadPendingReports)}
                                            </strong>
                                        </div>
                                    </div>
                                    <p className="admin-monitor-chart-caption">Theo trạng thái</p>
                                    <MonitorDonut data={reportRows} height={150} />
                                </>
                            ) : (
                                <p className="admin-monitor-card__empty">Tạm không có dữ liệu báo cáo.</p>
                            )}
                        </article>

                        <article className="admin-monitor-governance-block">
                            <header className="admin-monitor-governance-block__head">
                                <h3>Xác minh</h3>
                                <SectionPill available={verificationOk} />
                            </header>
                            {verificationOk ? (
                                <>
                                    <div className="admin-monitor-compact-metrics">
                                        <div>
                                            <span>Yêu cầu trong kỳ</span>
                                            <strong>
                                                {formatCount(verification.data.createdRequests)}
                                            </strong>
                                        </div>
                                        <div>
                                            <span>Chờ duyệt tay</span>
                                            <strong
                                                className={
                                                    verification.data.pendingManualRequests > 0
                                                        ? 'is-warn'
                                                        : ''
                                                }
                                            >
                                                {formatCount(verification.data.pendingManualRequests)}
                                            </strong>
                                        </div>
                                        <div>
                                            <span>Hoàn tất</span>
                                            <strong>
                                                {formatCount(verification.data.completedRequests)}
                                            </strong>
                                        </div>
                                        <div>
                                            <span>Từ chối</span>
                                            <strong>
                                                {formatCount(verification.data.rejectedRequests)}
                                            </strong>
                                        </div>
                                    </div>
                                    <p className="admin-monitor-chart-caption">Theo trạng thái</p>
                                    <MonitorDonut data={verificationRows} height={150} />
                                </>
                            ) : (
                                <p className="admin-monitor-card__empty">Tạm không có dữ liệu xác minh.</p>
                            )}
                        </article>

                        <article className="admin-monitor-governance-block">
                            <header className="admin-monitor-governance-block__head">
                                <h3>Kiểm duyệt</h3>
                                <SectionPill available={moderationOk} />
                            </header>
                            {moderationOk ? (
                                <div className="admin-monitor-compact-metrics">
                                    <div>
                                        <span>Duyệt tin (kỳ)</span>
                                        <strong>
                                            {formatCount(moderation.data.jobReviewRequests)}
                                        </strong>
                                    </div>
                                    <div>
                                        <span>Tin đang chờ</span>
                                        <strong
                                            className={
                                                moderation.data.pendingJobReviews > 0 ? 'is-warn' : ''
                                            }
                                        >
                                            {formatCount(moderation.data.pendingJobReviews)}
                                        </strong>
                                    </div>
                                    <div>
                                        <span>Duyệt nội dung (kỳ)</span>
                                        <strong>
                                            {formatCount(moderation.data.contentValidationRequests)}
                                        </strong>
                                    </div>
                                    <div>
                                        <span>Nội dung đang chờ</span>
                                        <strong
                                            className={
                                                moderation.data.pendingContentReviews > 0
                                                    ? 'is-warn'
                                                    : ''
                                            }
                                        >
                                            {formatCount(moderation.data.pendingContentReviews)}
                                        </strong>
                                    </div>
                                    <div>
                                        <span>Tổng backlog</span>
                                        <strong
                                            className={
                                                moderation.data.totalPendingWorkload > 0
                                                    ? 'is-warn'
                                                    : ''
                                            }
                                        >
                                            {formatCount(moderation.data.totalPendingWorkload)}
                                        </strong>
                                    </div>
                                </div>
                            ) : (
                                <p className="admin-monitor-card__empty">
                                    Tạm không có dữ liệu kiểm duyệt.
                                </p>
                            )}
                        </article>
                    </div>
                </div>
            )}
        </section>
    );
};

export default GovernanceQueuesCard;
