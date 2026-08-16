import RichTextContent from '../common/RichTextContent.jsx';
import { formatJobType } from '../../utils/formatters.js';
import {
    REPORT_DECISION,
    formatQueueTime,
    getCategoryLabel,
    getHistoryDecisionLabel,
    getRiskDisplay,
} from '../../utils/reportReviewDisplay.js';

const ReportCaseDetailPanel = ({
    detail,
    loading,
    error,
    reason,
    onReasonChange,
    selectedCategories,
    onToggleCategory,
    penaltyRules,
    deciding,
    onDecide,
    aiAnalysis,
    aiLoading,
    aiError,
    onAnalyzeAi,
    onOpenReport,
    onViewJobContent,
}) => {
    if (loading) {
        return (
            <section className="pm-review-detail pm-review-detail--loading">
                <div className="pm-review-detail__skeleton" />
            </section>
        );
    }

    if (error) {
        return (
            <section className="pm-review-detail pm-review-detail--error">
                <p>{error}</p>
            </section>
        );
    }

    if (!detail) {
        return (
            <section className="pm-review-detail pm-review-detail--empty">
                <p>Chọn một tin bị báo cáo để xem chi tiết và ra quyết định.</p>
            </section>
        );
    }

    const job = detail.job || {};
    const reports = Array.isArray(detail.reports) ? detail.reports : [];
    const history = Array.isArray(detail.previousResolutions) ? detail.previousResolutions : [];
    const penaltyEntries = Object.entries(penaltyRules || {});
    const selectedSet = new Set(selectedCategories || []);
    const estimatedPenalty = (selectedCategories || []).reduce(
        (sum, code) => sum + Math.abs(Number(penaltyRules?.[code]) || 0),
        0
    );
    const risk = getRiskDisplay(aiAnalysis?.riskLevel);

    return (
        <section className={`pm-review-detail${deciding ? ' pm-review-detail--busy' : ''}`}>
            {deciding && (
                <div className="pm-report-saving-overlay" role="status" aria-live="polite">
                    <div className="pm-report-saving-card">
                        <span className="pm-report-spinner" aria-hidden="true" />
                        <p className="pm-report-saving-title">Đang áp dụng quyết định…</p>
                        <p className="pm-report-saving-sub">Vui lòng chờ trong giây lát</p>
                    </div>
                </div>
            )}

            <header className="pm-review-detail__header">
                <div>
                    <h2 className="pm-review-detail__title">{job.title || '—'}</h2>
                    <p className="pm-review-detail__sub">
                        {job.jobType ? <span>{formatJobType(job.jobType)}</span> : null}
                    </p>
                </div>
                <div className="pm-review-detail__badges">
                    <span className="pm-review-detail__status">Đang chờ xử lý báo cáo</span>
                    {aiAnalysis?.riskLevel && (
                        <span className={`pm-review-detail__risk pm-review-detail__risk--${risk.tone}`}>
                            {risk.label}
                        </span>
                    )}
                </div>
            </header>

            <div className="pm-review-detail__preview">
                <h3>Nội dung tin đăng</h3>
                {job.id ? (
                    <button
                        type="button"
                        className="pm-review-btn pm-review-btn--ghost pm-report-view-job"
                        onClick={() => onViewJobContent?.(job.id)}
                        disabled={deciding}
                    >
                        Xem nội dung tin đăng
                    </button>
                ) : job.description ? (
                    <RichTextContent content={job.description} className="pm-review-detail__description" />
                ) : (
                    <p className="pm-report-muted">Không có mô tả.</p>
                )}
            </div>

            <div className="pm-report-section">
                <div className="pm-report-section__head">
                    <h3>Báo cáo chưa xử lý ({reports.length})</h3>
                </div>
                {reports.length === 0 ? (
                    <p className="pm-report-muted">Không có báo cáo PENDING.</p>
                ) : (
                    <ul className="pm-report-list">
                        {reports.map((item) => (
                            <li key={item.reportId}>
                                <button
                                    type="button"
                                    className={`pm-report-list__item${
                                        item.isRead === false ? ' pm-report-list__item--unread' : ''
                                    }`}
                                    onClick={() => onOpenReport(item.reportId)}
                                    disabled={deciding}
                                >
                                    <span className="pm-report-list__name">
                                        {item.reporterName || 'Ẩn danh'}
                                        {item.isRead === false && (
                                            <span className="pm-report-list__dot" aria-label="Chưa đọc" />
                                        )}
                                    </span>
                                    <span className="pm-report-list__time">
                                        {formatQueueTime(item.createdAt)}
                                    </span>
                                    <span className="pm-report-list__preview">
                                        {item.description || 'Không có mô tả'}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="pm-report-section">
                <div className="pm-report-section__head">
                    <h3>Phân tích AI</h3>
                    <button
                        type="button"
                        className="pm-review-btn pm-review-btn--ghost"
                        onClick={onAnalyzeAi}
                        disabled={deciding || aiLoading || !job.id}
                    >
                        {aiLoading ? 'Đang phân tích…' : aiAnalysis ? 'Phân tích lại' : 'Phân tích AI'}
                    </button>
                </div>
                {aiError && <p className="pm-review-detail--error" style={{ padding: 0 }}>{aiError}</p>}
                {aiLoading && !aiAnalysis && (
                    <p className="pm-report-muted">Đang gọi AI phân tích case…</p>
                )}
                {aiAnalysis && (
                    <div className="pm-review-detail__ai-alert" role="status">
                        <strong>Kết quả AI</strong>
                        {aiAnalysis.summary && <p>{aiAnalysis.summary}</p>}
                        {Array.isArray(aiAnalysis.anomalies) && aiAnalysis.anomalies.length > 0 && (
                            <ul>
                                {aiAnalysis.anomalies.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        )}
                        {Array.isArray(aiAnalysis.recommendations) &&
                            aiAnalysis.recommendations.length > 0 && (
                                <p className="pm-review-detail__ai-hint">
                                    Gợi ý: {aiAnalysis.recommendations.join(' · ')}
                                </p>
                            )}
                        {aiAnalysis.spamCheck?.duplicateCount > 0 && (
                            <p className="pm-review-detail__ai-hint">
                                Spam check: {aiAnalysis.spamCheck.duplicateCount} tin tương tự trong{' '}
                                {aiAnalysis.spamCheck.checkPeriodDays || 30} ngày.
                            </p>
                        )}
                    </div>
                )}
            </div>

            {history.length > 0 && (
                <div className="pm-report-section">
                    <h3>Lịch sử xử lý trước</h3>
                    <ul className="pm-report-history">
                        {history.map((item, index) => (
                            <li key={`${item.resolvedAt}-${index}`}>
                                <strong>{getHistoryDecisionLabel(item.decision)}</strong>
                                <span> · {item.resolvedBy || 'PM'} · {formatQueueTime(item.resolvedAt)}</span>
                                {item.reason ? <p>{item.reason}</p> : null}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <footer className="pm-review-detail__footer">
                {penaltyEntries.length > 0 && (
                    <div className="pm-report-categories">
                        <p className="pm-review-detail__note-label">
                            Lý do vi phạm
                        </p>
                        <ul className="pm-report-categories__list">
                            {penaltyEntries.map(([code, points]) => {
                                const checked = selectedSet.has(code);
                                return (
                                    <li key={code}>
                                        <label className="pm-report-categories__item">
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                disabled={deciding}
                                                onChange={() => onToggleCategory(code)}
                                            />
                                            <span>
                                                {getCategoryLabel(code)}
                                                <em> −{Math.abs(Number(points) || 0)}</em>
                                            </span>
                                        </label>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}

                <label className="pm-review-detail__note-label pm-report-reason-label" htmlFor="pm-report-reason">
                    Lý do quyết định <span className="pm-report-req" aria-hidden="true">*</span>
                </label>
                <textarea
                    id="pm-report-reason"
                    className="pm-review-detail__note"
                    rows={4}
                    placeholder="Nhập lý do xử lý…"
                    value={reason}
                    onChange={(e) => onReasonChange(e.target.value)}
                    disabled={deciding}
                />

                <div className="pm-review-detail__actions">
                    <button
                        type="button"
                        className="pm-review-btn pm-review-btn--ghost"
                        disabled={deciding}
                        onClick={() => onDecide(REPORT_DECISION.REJECT)}
                    >
                        Báo cáo không hợp lệ
                    </button>
                    <button
                        type="button"
                        className="pm-review-btn pm-review-btn--danger"
                        disabled={deciding}
                        onClick={() => onDecide(REPORT_DECISION.BLOCK)}
                    >
                        {deciding ? 'Đang xử lý…' : 'Khóa tin vi phạm'}
                    </button>
                </div>
            </footer>
        </section>
    );
};

export default ReportCaseDetailPanel;
