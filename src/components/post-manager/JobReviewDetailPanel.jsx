import { Link } from 'react-router-dom';
import RichTextContent from '../common/RichTextContent.jsx';
import { getBusinessProfilePath } from '../../routes/path.js';
import { formatJobType, formatSalary } from '../../utils/formatters.js';
import {
    getAutoScoreTone,
    getQueueTypeLabel,
    getRiskDisplay,
    getRuleNameLabel,
    getRuleScoreTone,
    parseRuleEngineResult,
} from '../../utils/jobReviewDisplay.js';

const JobReviewDetailPanel = ({
    detail,
    loading,
    error,
    note,
    onNoteChange,
    deciding,
    onDecide,
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
                <p>Chọn một tin trong hàng chờ để xem chi tiết và ra quyết định.</p>
            </section>
        );
    }

    const risk = getRiskDisplay(detail.aiAnalysis?.mucDoRuiRo || detail.aiRiskLevel);
    const ruleResult = parseRuleEngineResult(detail.ruleEngineResult);
    const ai = detail.aiAnalysis;
    const locationParts = [detail.locationAddress, detail.locationWard, detail.locationCity].filter(
        Boolean
    );
    const autoScore =
        detail.autoApprovalScore != null
            ? Math.round(detail.autoApprovalScore)
            : ruleResult?.finalScore != null
              ? Math.round(ruleResult.finalScore)
              : null;
    const autoScoreTone = getAutoScoreTone(autoScore);

    return (
        <section className="pm-review-detail">
            <header className="pm-review-detail__header">
                <div>
                    <h2 className="pm-review-detail__title">{detail.jobTitle || '—'}</h2>
                    <p className="pm-review-detail__sub">
                        {detail.businessId ? (
                            <Link
                                to={getBusinessProfilePath(detail.businessId)}
                                className="pm-review-detail__company-link"
                            >
                                {detail.businessName || '—'}
                            </Link>
                        ) : (
                            <span>{detail.businessName || '—'}</span>
                        )}
                        {detail.jobId != null && (
                            <span className="pm-review-detail__job-id">#{detail.jobId}</span>
                        )}
                    </p>
                    <p className="pm-review-detail__recruiter">
                        Recruiter: {detail.recruiterName || '—'}
                        {detail.businessTrustScore != null && (
                            <span> · Trust: {Math.round(detail.businessTrustScore)}</span>
                        )}
                    </p>
                </div>
                <div className="pm-review-detail__badges">
                    <span className="pm-review-detail__status">Đang chờ duyệt</span>
                    <span className={`pm-review-detail__risk pm-review-detail__risk--${risk.tone}`}>
                        {risk.label}
                    </span>
                    {detail.queueType && (
                        <span className="pm-review-detail__queue">{getQueueTypeLabel(detail.queueType)}</span>
                    )}
                </div>
            </header>

            {ai?.tomTat && (
                <div className="pm-review-detail__ai-alert" role="alert">
                    <strong>AI cảnh báo</strong>
                    <p>{ai.tomTat}</p>
                    {ai.diemBatThuong?.length > 0 && (
                        <ul>
                            {ai.diemBatThuong.map((item, index) => (
                                <li key={`${item.loai}-${index}`}>
                                    <strong>{item.loai}:</strong> {item.moTa || item.lyDo}
                                </li>
                            ))}
                        </ul>
                    )}
                    {ai.goiYChoNguoiKiemDuyet?.length > 0 && (
                        <p className="pm-review-detail__ai-hint">
                            Gợi ý: {ai.goiYChoNguoiKiemDuyet.join(' · ')}
                        </p>
                    )}
                </div>
            )}

            {detail.aiStatus === 'FAILED' && (
                <div className="pm-review-detail__ai-alert pm-review-detail__ai-alert--muted">
                    AI phân tích thất bại — vẫn có thể duyệt thủ công.
                </div>
            )}

            <div className="pm-review-detail__phase2">
                <h3>Chi tiết chỉnh sửa</h3>
                <p className="pm-review-detail__phase2-note">
                    Phase 2 — Cần BE hỗ trợ version snapshot để so sánh Bản cũ / Bản mới.
                </p>
            </div>

            <div className="pm-review-detail__preview">
                <h3>Nội dung tin đăng (xem trước)</h3>
                <dl className="pm-review-detail__meta-grid">
                    <div>
                        <dt>Loại việc</dt>
                        <dd>{formatJobType(detail.jobType) || '—'}</dd>
                    </div>
                    <div>
                        <dt>Mức lương</dt>
                        <dd>{formatSalary(detail.salaryMin, detail.salaryMax) || '—'}</dd>
                    </div>
                    <div>
                        <dt>Số lượng tuyển</dt>
                        <dd>{detail.requiredCandidates ?? '—'}</dd>
                    </div>
                    <div>
                        <dt>Điểm đánh giá</dt>
                        <dd
                            className={`pm-review-detail__score pm-review-detail__score--${autoScoreTone}`}
                        >
                            {autoScore != null ? `${autoScore}/100` : '—'}
                        </dd>
                    </div>
                    {locationParts.length > 0 && (
                        <div className="pm-review-detail__meta-wide">
                            <dt>Địa điểm</dt>
                            <dd>{locationParts.join(', ')}</dd>
                        </div>
                    )}
                </dl>
                {detail.jobDescription && (
                    <RichTextContent
                        content={detail.jobDescription}
                        className="pm-review-detail__description"
                    />
                )}
            </div>

            {ruleResult?.rules?.length > 0 && (
                <div className="pm-review-detail__rules">
                    <h3>Đánh giá hệ thống</h3>
                    <ul>
                        {ruleResult.rules.map((rule) => {
                            const tone = getRuleScoreTone(rule);
                            return (
                                <li
                                    key={rule.ruleName}
                                    className={`pm-review-detail__rule pm-review-detail__rule--${tone}`}
                                >
                                    <div className="pm-review-detail__rule-head">
                                        <strong>{getRuleNameLabel(rule.ruleName)}</strong>
                                        <span
                                            className={`pm-review-detail__rule-score pm-review-detail__rule-score--${tone}`}
                                        >
                                            {Math.round(rule.scoreContribution ?? 0)}/
                                            {Math.round(rule.maxScore ?? 0)}
                                        </span>
                                    </div>
                                    {rule.message && <p>{rule.message}</p>}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            <footer className="pm-review-detail__footer">
                <label className="pm-review-detail__note-label" htmlFor="pm-review-note">
                    Lý do xử lý
                    <span>Bắt buộc với Từ chối / Yêu cầu chỉnh sửa · Bỏ trống nếu duyệt tin</span>
                </label>
                <textarea
                    id="pm-review-note"
                    className="pm-review-detail__note"
                    rows={4}
                    placeholder="Nhập lý do xử lý cho recruiter..."
                    value={note}
                    onChange={(e) => onNoteChange(e.target.value)}
                    disabled={deciding}
                />

                <div className="pm-review-detail__actions">
                    <button
                        type="button"
                        className="pm-review-btn pm-review-btn--ghost"
                        disabled={deciding}
                        onClick={() => onDecide('REVISION_REQUESTED')}
                    >
                        Yêu cầu chỉnh sửa
                    </button>
                    <button
                        type="button"
                        className="pm-review-btn pm-review-btn--danger"
                        disabled={deciding}
                        onClick={() => onDecide('REJECTED')}
                    >
                        Từ chối
                    </button>
                    <button
                        type="button"
                        className="pm-review-btn pm-review-btn--primary"
                        disabled={deciding}
                        onClick={() => onDecide('APPROVED')}
                    >
                        {deciding ? 'Đang xử lý...' : 'Duyệt tin'}
                    </button>
                </div>
            </footer>
        </section>
    );
};

export default JobReviewDetailPanel;
