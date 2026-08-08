import { Link } from 'react-router-dom';
import {
    formatAiRiskLabel,
    formatAiStatusLabel,
    formatJobStatusLabel,
    formatMetricsDateTime,
    formatMetricsHours,
    formatMetricsNumber,
    formatMetricsRate,
    formatModerationStatusLabel,
    formatQueueTypeLabel,
    formatReportStatusLabel,
    formatReviewDecisionLabel,
    getAiRiskTone,
    getJobStatusTone,
    getModerationStatusTone,
    getSuspiciousIndicatorLabel,
    resolveModerationActionHint,
} from '../../utils/jobPostMetricsDisplay.js';

const toneClass = (prefix, tone) => `${prefix} ${prefix}--${tone || 'muted'}`;

const JobPostMetricsDetailPanel = ({ detail, loading, error, onClose }) => {
    if (!detail && !loading && !error) {
        return (
            <div className="jpm-detail jpm-detail--empty">
                <p>Chọn một tin trong danh sách để xem chi tiết metrics.</p>
            </div>
        );
    }

    const metrics = detail?.metrics || detail || {};
    const indicators = Array.isArray(metrics.suspiciousIndicators)
        ? metrics.suspiciousIndicators
        : [];
    const moderationHistory = Array.isArray(detail?.moderationHistory)
        ? detail.moderationHistory
        : [];
    const aiHistory = Array.isArray(detail?.aiValidationHistory)
        ? detail.aiValidationHistory
        : [];
    const actions = Array.isArray(detail?.availableModerationActions)
        ? detail.availableModerationActions
        : [];

    return (
        <div className="jpm-detail">
            <div className="jpm-detail__head">
                <div>
                    <h2>{loading ? 'Đang tải…' : metrics.title || `Job #${metrics.jobId || '—'}`}</h2>
                    <p>
                        Job ID: {metrics.jobId ?? '—'}
                        {metrics.deleted ? ' · Soft-deleted / ẩn' : ''}
                        {metrics.publicJob === false ? ' · Không public' : ''}
                    </p>
                </div>
                {onClose ? (
                    <button type="button" className="jpm-btn jpm-btn--ghost" onClick={onClose}>
                        Đóng
                    </button>
                ) : null}
            </div>

            {error ? <p className="jpm-error">{error}</p> : null}
            {loading ? <p className="jpm-empty">Đang tải chi tiết…</p> : null}

            {!loading && detail ? (
                <>
                    <div className="jpm-detail__badges">
                        <span className={toneClass('jpm-badge', getJobStatusTone(metrics.jobStatus))}>
                            {formatJobStatusLabel(metrics.jobStatus)}
                        </span>
                        <span
                            className={toneClass(
                                'jpm-badge',
                                getModerationStatusTone(metrics.moderationStatus)
                            )}
                        >
                            Kiểm duyệt: {formatModerationStatusLabel(metrics.moderationStatus)}
                        </span>
                        <span className={toneClass('jpm-badge', getAiRiskTone(metrics.aiRiskLevel))}>
                            AI: {formatAiRiskLabel(metrics.aiRiskLevel)}
                            {!metrics.aiRiskLevel && metrics.aiStatus
                                ? ` (${formatAiStatusLabel(metrics.aiStatus)})`
                                : ''}
                        </span>
                        {metrics.suspicious ? (
                            <span className="jpm-badge jpm-badge--danger">Cần chú ý</span>
                        ) : null}
                    </div>

                    <section className="jpm-detail__section">
                        <h3>Doanh nghiệp / Nhà tuyển dụng</h3>
                        <dl className="jpm-dl">
                            <div>
                                <dt>Doanh nghiệp</dt>
                                <dd>{metrics.businessName || '—'} (#{metrics.businessId ?? '—'})</dd>
                            </div>
                            <div>
                                <dt>Nhà tuyển dụng</dt>
                                <dd>
                                    {metrics.recruiterName || '—'} (#{metrics.recruiterId ?? '—'})
                                </dd>
                            </div>
                            <div>
                                <dt>Điểm uy tín</dt>
                                <dd>{formatMetricsNumber(detail.recruiterTrustScore)}</dd>
                            </div>
                            <div>
                                <dt>Cờ lừa đảo</dt>
                                <dd>{detail.recruiterScamFlag ? 'Có' : 'Không'}</dd>
                            </div>
                        </dl>
                    </section>

                    <section className="jpm-detail__section">
                        <h3>Hiệu suất</h3>
                        <dl className="jpm-dl">
                            <div>
                                <dt>Lượt xem</dt>
                                <dd>{formatMetricsNumber(metrics.viewCount)}</dd>
                            </div>
                            <div>
                                <dt>Đơn ứng tuyển</dt>
                                <dd>{formatMetricsNumber(metrics.applicationCount)}</dd>
                            </div>
                            <div>
                                <dt>Tỉ lệ chuyển đổi</dt>
                                <dd>{formatMetricsRate(metrics.conversionRate)}</dd>
                            </div>
                            <div>
                                <dt>Ngày tạo</dt>
                                <dd>{formatMetricsDateTime(metrics.createdAt)}</dd>
                            </div>
                        </dl>
                    </section>

                    <section className="jpm-detail__section">
                        <h3>Báo cáo / AI / Kiểm duyệt</h3>
                        <dl className="jpm-dl">
                            <div>
                                <dt>Báo cáo</dt>
                                <dd>
                                    {formatMetricsNumber(metrics.reportCount)} ·{' '}
                                    {formatReportStatusLabel(metrics.reportStatus)}
                                </dd>
                            </div>
                            <div>
                                <dt>Trạng thái AI</dt>
                                <dd>{formatAiStatusLabel(metrics.aiStatus)}</dd>
                            </div>
                            <div>
                                <dt>Rule engine</dt>
                                <dd>
                                    {metrics.ruleEnginePassed == null
                                        ? '—'
                                        : metrics.ruleEnginePassed
                                          ? 'Đạt'
                                          : 'Không đạt'}
                                </dd>
                            </div>
                            <div>
                                <dt>Điểm tự duyệt</dt>
                                <dd>{formatMetricsNumber(metrics.autoApprovalScore)}</dd>
                            </div>
                            <div>
                                <dt>Quyết định duyệt</dt>
                                <dd>{formatReviewDecisionLabel(metrics.reviewDecision) || '—'}</dd>
                            </div>
                            <div>
                                <dt>Hàng đợi</dt>
                                <dd>{formatQueueTypeLabel(metrics.queueType)}</dd>
                            </div>
                            <div>
                                <dt>Gán / Duyệt lúc</dt>
                                <dd>
                                    {formatMetricsDateTime(metrics.assignedAt)} /{' '}
                                    {formatMetricsDateTime(metrics.reviewedAt)}
                                </dd>
                            </div>
                            <div>
                                <dt>Tuổi moderation</dt>
                                <dd>{formatMetricsHours(metrics.moderationAgeHours)}</dd>
                            </div>
                        </dl>
                    </section>

                    {indicators.length > 0 ? (
                        <section className="jpm-detail__section">
                            <h3>Chỉ số cảnh báo</h3>
                            <p className="jpm-hint">Chỉ cảnh báo — không phải kết luận vi phạm.</p>
                            <div className="jpm-chip-row">
                                {indicators.map((code) => (
                                    <span key={code} className="jpm-chip jpm-chip--warn" title={code}>
                                        {getSuspiciousIndicatorLabel(code)}
                                    </span>
                                ))}
                            </div>
                        </section>
                    ) : null}

                    <section className="jpm-detail__section">
                        <h3>Lịch sử kiểm duyệt</h3>
                        {moderationHistory.length === 0 ? (
                            <p className="jpm-empty">Không có lịch sử kiểm duyệt.</p>
                        ) : (
                            <ul className="jpm-timeline">
                                {moderationHistory.map((row, index) => (
                                    <li key={row.reviewId || `${row.decision}-${index}`}>
                                        <strong>
                                            {formatReviewDecisionLabel(row.decision) || row.decision || '—'}
                                        </strong>
                                        <span>
                                            {formatQueueTypeLabel(row.queueType)} · {row.reviewer || '—'}
                                        </span>
                                        <span>{formatMetricsDateTime(row.reviewedAt || row.createdAt)}</span>
                                        {row.note ? <p>{row.note}</p> : null}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section className="jpm-detail__section">
                        <h3>Lịch sử AI</h3>
                        {aiHistory.length === 0 ? (
                            <p className="jpm-empty">Không có lịch sử AI.</p>
                        ) : (
                            <ul className="jpm-timeline">
                                {aiHistory.map((row, index) => (
                                    <li key={row.logId || `${row.riskLevel}-${index}`}>
                                        <strong className={toneClass('jpm-inline', getAiRiskTone(row.riskLevel))}>
                                            {formatAiRiskLabel(row.riskLevel)}
                                        </strong>
                                        <span>{row.requestType || '—'}</span>
                                        <span>{formatMetricsDateTime(row.createdAt)}</span>
                                        {row.explanation ? <p>{row.explanation}</p> : null}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    {actions.length > 0 ? (
                        <section className="jpm-detail__section">
                            <h3>Gợi ý điều hướng</h3>
                            <p className="jpm-hint">
                                Chỉ mở hàng chờ liên quan — màn này không duyệt / từ chối.
                            </p>
                            <div className="jpm-chip-row">
                                {actions.map((action) => {
                                    const hint = resolveModerationActionHint(action);
                                    if (!hint) {
                                        return (
                                            <span key={action} className="jpm-chip">
                                                {action}
                                            </span>
                                        );
                                    }
                                    return (
                                        <Link key={action} to={hint.to} className="jpm-chip jpm-chip--link">
                                            {hint.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </section>
                    ) : null}
                </>
            ) : null}
        </div>
    );
};

export default JobPostMetricsDetailPanel;
