import { useMemo } from 'react';
import {
    formatAiErrorForDisplay,
    formatAiResultLabel,
    formatAiScore,
    formatReviewTypeLabel,
    formatRiskLevelLabel,
    formatStars,
    getAiResultTone,
    parseAiReason,
} from '../../utils/reviewModerationDisplay.js';

const ReviewModerationDetailPanel = ({
    detail,
    loading,
    error,
    note,
    onNoteChange,
    deciding,
    onDecide,
}) => {
    const aiParsed = useMemo(
        () => parseAiReason(detail?.aiReason),
        [detail?.aiReason]
    );

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
                <p>Chọn một đánh giá trong hàng chờ để xem chi tiết và xử lý.</p>
            </section>
        );
    }

    const aiTone = getAiResultTone(detail.aiResult);
    const riskLabel =
        aiParsed?.kind === 'analysis'
            ? formatRiskLevelLabel(aiParsed.mucDoRuiRo)
            : '';
    const violations =
        aiParsed?.kind === 'analysis' && Array.isArray(aiParsed.viPham)
            ? aiParsed.viPham
            : [];

    return (
        <section className="pm-review-detail mc-review-detail">
            <header className="pm-review-detail__header mc-review-detail__header">
                <div className="mc-review-detail__heading">
                    <h2 className="pm-review-detail__title">
                        {detail.reviewerName || '—'} → {detail.revieweeName || '—'}
                    </h2>

                    <span className="mc-review-detail__type-badge">
                        {formatReviewTypeLabel(detail.reviewType)}
                    </span>

                    <p className="mc-review-detail__job-line">
                        <span className="mc-review-detail__meta-label">Việc làm</span>
                        {detail.jobTitle || '—'}
                    </p>

                    {detail.businessName ? (
                        <p className="mc-review-detail__business-line">{detail.businessName}</p>
                    ) : null}
                </div>

                <div className="pm-review-detail__badges">

                    <span className="pm-review-detail__status">Đang chờ duyệt</span>

                    <span className={`pm-review-detail__risk pm-review-detail__risk--${aiTone}`}>

                        AI: {formatAiResultLabel(detail.aiResult)}

                    </span>

                </div>

            </header>



            <div className="pm-review-detail__preview">

                <h3>Nội dung đánh giá</h3>

                <p className="mc-review-detail__rating">

                    <span aria-hidden="true">{formatStars(detail.rating)}</span>

                    <strong>

                        {detail.rating != null ? ` ${detail.rating}/5` : ' —'}

                    </strong>

                </p>

                <p className="mc-review-detail__comment">

                    {detail.comment?.trim()

                        ? detail.comment

                        : 'Không có nội dung văn bản.'}

                </p>

            </div>



            <div className="pm-review-detail__rules mc-review-detail__ai">

                <h3>Phân tích AI</h3>

                <dl className="pm-review-detail__meta-grid">

                    <div>

                        <dt>Kết quả</dt>

                        <dd>{formatAiResultLabel(detail.aiResult)}</dd>

                    </div>

                    <div>

                        <dt>Điểm an toàn</dt>

                        <dd>{formatAiScore(detail.aiScore)} / 1.00</dd>

                    </div>

                    {riskLabel ? (

                        <div>

                            <dt>Mức rủi ro</dt>

                            <dd>{riskLabel}</dd>

                        </div>

                    ) : null}

                </dl>



                {aiParsed?.kind === 'error' && (

                    <div className="pm-review-detail__ai-alert pm-review-detail__ai-alert--muted">

                        <strong>Lỗi phân tích</strong>

                        <p>

                            {formatAiErrorForDisplay(

                                aiParsed.errorText,

                                detail.aiResult

                            )}

                        </p>

                    </div>

                )}



                {aiParsed?.kind === 'analysis' && (

                    <>

                        {aiParsed.tomTat && (

                            <div className="pm-review-detail__ai-alert" role="status">

                                <strong>Tóm tắt</strong>

                                <p>{aiParsed.tomTat}</p>

                            </div>

                        )}

                        {aiParsed.goiYChoNguoiKiemDuyet && (

                            <p className="pm-review-detail__ai-hint">

                                Gợi ý: {aiParsed.goiYChoNguoiKiemDuyet}

                            </p>

                        )}

                        {violations.length > 0 && (

                            <div className="mc-review-detail__violations">

                                <h4>Vi phạm phát hiện</h4>

                                <ul>

                                    {violations.map((v, index) => (

                                        <li key={`${v.loai || 'v'}-${index}`}>

                                            <strong>{v.loai || 'Vi phạm'}</strong>

                                            {v.moTa ? <p>{v.moTa}</p> : null}

                                            {v.doanVanLienQuan ? (

                                                <p className="mc-review-detail__quote">

                                                    “{v.doanVanLienQuan}”

                                                </p>

                                            ) : null}

                                            {v.lyDo ? <p>Lý do: {v.lyDo}</p> : null}

                                        </li>

                                    ))}

                                </ul>

                            </div>

                        )}

                    </>

                )}



                {!aiParsed && !detail.aiResult && detail.aiScore == null && (

                    <p className="pm-queue__empty">Chưa có dữ liệu phân tích AI.</p>

                )}

            </div>



            <footer className="pm-review-detail__footer mc-review-detail__footer">

                <label className="pm-review-detail__note-label" htmlFor="mc-review-note">

                    Ghi chú kiểm duyệt

                    <span>Bắt buộc khi Từ chối hoặc Ẩn nội dung</span>

                </label>

                <textarea

                    id="mc-review-note"

                    className="pm-review-detail__note"

                    rows={3}

                    placeholder="Nhập ghi chú xử lý..."

                    value={note}

                    onChange={(e) => onNoteChange(e.target.value)}

                    disabled={deciding}

                />



                <div className="pm-review-detail__actions">

                    <button

                        type="button"

                        className="pm-review-btn pm-review-btn--ghost"

                        disabled={deciding}

                        onClick={() => onDecide('HIDDEN')}

                    >

                        Ẩn nội dung

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

                        {deciding ? 'Đang xử lý...' : 'Duyệt'}

                    </button>

                </div>

            </footer>

        </section>

    );

};



export default ReviewModerationDetailPanel;


