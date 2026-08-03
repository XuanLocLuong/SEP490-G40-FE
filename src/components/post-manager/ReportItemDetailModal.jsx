import { useEffect, useState } from 'react';
import {
    getReportDetail,
    getReportReviewApiErrorMessage,
} from '../../apis/ReportReviewApi.jsx';
import { formatQueueTime, getReportReasonDisplay } from '../../utils/reportReviewDisplay.js';

const ReportItemDetailModal = ({ reportId, open, onClose, onMarkedRead }) => {
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open || !reportId) {
            setDetail(null);
            setError('');
            return undefined;
        }

        let cancelled = false;
        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await getReportDetail(reportId);
                if (cancelled) return;
                const data = res?.data?.data ?? res?.data ?? null;
                setDetail(data);
                if (data) onMarkedRead?.(reportId, data);
            } catch (err) {
                if (cancelled) return;
                setDetail(null);
                setError(getReportReviewApiErrorMessage(err, 'Không thể tải chi tiết báo cáo.'));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [open, reportId, onMarkedRead]);

    if (!open) return null;

    const reasons = Array.isArray(detail?.reportReasons) ? detail.reportReasons : [];
    const evidenceUrls = Array.isArray(detail?.evidenceUrls) ? detail.evidenceUrls : [];

    return (
        <div className="pm-report-modal" role="dialog" aria-modal="true" aria-labelledby="pm-report-detail-title">
            <button
                type="button"
                className="pm-report-modal__backdrop"
                aria-label="Đóng"
                onClick={onClose}
            />
            <div className="pm-report-modal__panel">
                <header className="pm-report-modal__header">
                    <h2 id="pm-report-detail-title">Chi tiết báo cáo</h2>
                    <button type="button" className="pm-report-modal__close" onClick={onClose} aria-label="Đóng">
                        ×
                    </button>
                </header>

                <div className="pm-report-modal__body">
                    {loading && <p className="pm-report-modal__loading">Đang tải…</p>}
                    {error && <p className="pm-report-modal__error">{error}</p>}
                    {!loading && !error && detail && (
                        <>
                            <p className="pm-report-modal__meta">
                                <strong>{detail.reporterName || 'Ẩn danh'}</strong>
                                <span> · {formatQueueTime(detail.createdAt)}</span>
                            </p>

                            {reasons.length > 0 && (
                                <ul className="pm-report-modal__reasons">
                                    {reasons.map((reason) => {
                                        const display = getReportReasonDisplay(reason);
                                        return (
                                            <li key={reason.code || display.name}>
                                                <strong>{display.name}</strong>
                                                {display.description ? (
                                                    <span>{display.description}</span>
                                                ) : null}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}

                            <p className="pm-report-modal__desc">{detail.description || '—'}</p>

                            {evidenceUrls.length > 0 ? (
                                <div className="pm-report-modal__evidence">
                                    <h3>Ảnh minh chứng</h3>
                                    <div className="pm-report-modal__thumbs">
                                        {evidenceUrls.map((url) => (
                                            <a
                                                key={url}
                                                href={url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="pm-report-modal__thumb"
                                            >
                                                <img src={url} alt="Minh chứng báo cáo" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="pm-report-modal__hint">Không có ảnh minh chứng.</p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportItemDetailModal;
