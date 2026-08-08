import { MonitorDonut, MonitorGroupedBar } from './MonitorCharts.jsx';
import { formatCount, isSectionAvailable } from '../../../utils/platformMonitoringDisplay.js';

const SectionPill = ({ available }) => (
    <span
        className={`admin-monitor-pill ${
            available ? 'admin-monitor-pill--ok' : 'admin-monitor-pill--warn'
        }`}
    >
        {available ? 'Sẵn sàng' : 'Tạm lỗi'}
    </span>
);

const HeroTotal = ({ label, value, warn = false }) => (
    <div className={`admin-monitor-queue-hero${warn ? ' is-warn' : ''}`}>
        <span>{label}</span>
        <strong>{formatCount(value)}</strong>
    </div>
);

const MODERATION_SERIES = [
    { dataKey: 'trongKy', name: 'Trong kỳ', color: '#2f5fdb' },
    { dataKey: 'choDuyet', name: 'Đang chờ', color: '#dc2626' },
];

const GovernanceQueuesCard = ({ reports, verification, moderation }) => {
    const reportsOk = isSectionAvailable(reports);
    const verificationOk = isSectionAvailable(verification);
    const moderationOk = isSectionAvailable(moderation);
    const anyOk = reportsOk || verificationOk || moderationOk;

    const reportsCreated = reportsOk ? Number(reports.data.createdReports) || 0 : 0;
    const reportsPending = reportsOk ? Number(reports.data.pendingReports) || 0 : 0;
    const reportsDoneOther = Math.max(0, reportsCreated - reportsPending);

    const verificationCreated = verificationOk ? Number(verification.data.createdRequests) || 0 : 0;
    const verificationPending = verificationOk
        ? Number(verification.data.pendingManualRequests) || 0
        : 0;
    const verificationCompleted = verificationOk
        ? Number(verification.data.completedRequests) || 0
        : 0;
    const verificationRejected = verificationOk
        ? Number(verification.data.rejectedRequests) || 0
        : 0;
    const verificationOther = Math.max(
        0,
        verificationCreated - verificationPending - verificationCompleted - verificationRejected
    );

    const jobReviews = moderationOk ? Number(moderation.data.jobReviewRequests) || 0 : 0;
    const pendingJobs = moderationOk ? Number(moderation.data.pendingJobReviews) || 0 : 0;
    const contentReviews = moderationOk
        ? Number(moderation.data.contentValidationRequests) || 0
        : 0;
    const pendingContent = moderationOk
        ? Number(moderation.data.pendingContentReviews) || 0
        : 0;
    const totalBacklog = moderationOk
        ? Number(moderation.data.totalPendingWorkload) || 0
        : 0;

    const reportsChart = [
        { name: 'Chưa xử lý', value: reportsPending },
        { name: 'Đã xong / khác', value: reportsDoneOther },
    ];

    const verificationChart = [
        { name: 'Chờ duyệt thủ công', value: verificationPending },
        { name: 'Đã duyệt / đạt', value: verificationCompleted },
        { name: 'Bị từ chối', value: verificationRejected },
        ...(verificationOther > 0
            ? [{ name: 'Trạng thái khác', value: verificationOther }]
            : []),
    ];

    const moderationChart = [
        { name: 'Duyệt tin', trongKy: jobReviews, choDuyet: pendingJobs },
        { name: 'Duyệt đánh giá', trongKy: contentReviews, choDuyet: pendingContent },
    ];

    return (
        <section className="admin-monitor-card admin-monitor-card--wide">
            <header className="admin-monitor-card__header">
                <div>
                    <h2>Hàng chờ báo cáo, xác minh &amp; duyệt tin tuyển</h2>
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
                                <h3>Báo cáo tin đăng</h3>
                                <SectionPill available={reportsOk} />
                            </header>
                            {reportsOk ? (
                                <>
                                    <HeroTotal
                                        label="Báo cáo mới trong kỳ"
                                        value={reportsCreated}
                                    />
                                    <p className="admin-monitor-chart-caption">
                                        Phân bố xử lý trong kỳ
                                    </p>
                                    <MonitorDonut data={reportsChart} height={170} />
                                </>
                            ) : (
                                <p className="admin-monitor-card__empty">
                                    Tạm không có dữ liệu báo cáo.
                                </p>
                            )}
                        </article>

                        <article className="admin-monitor-governance-block">
                            <header className="admin-monitor-governance-block__head">
                                <h3>Xác minh tài khoản</h3>
                                <SectionPill available={verificationOk} />
                            </header>
                            {verificationOk ? (
                                <>
                                    <HeroTotal
                                        label="Yêu cầu xác minh trong kỳ"
                                        value={verificationCreated}
                                    />
                                    <p className="admin-monitor-chart-caption">
                                        Phân bố kết quả trong kỳ
                                    </p>
                                    <MonitorDonut data={verificationChart} height={170} />
                                </>
                            ) : (
                                <p className="admin-monitor-card__empty">
                                    Tạm không có dữ liệu xác minh.
                                </p>
                            )}
                        </article>

                        <article className="admin-monitor-governance-block">
                            <header className="admin-monitor-governance-block__head">
                                <h3>Duyệt tin tuyển &amp; đánh giá</h3>
                                <SectionPill available={moderationOk} />
                            </header>
                            {moderationOk ? (
                                <>
                                    <HeroTotal
                                        label="Tổng việc chờ duyệt"
                                        value={totalBacklog}
                                        warn={totalBacklog > 0}
                                    />
                                    <p className="admin-monitor-chart-caption">
                                        Trong kỳ so với đang chờ
                                    </p>
                                    <MonitorGroupedBar
                                        data={moderationChart}
                                        series={MODERATION_SERIES}
                                        height={190}
                                    />
                                </>
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
