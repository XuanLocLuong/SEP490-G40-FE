import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import {
    MAX_REPORT_EVIDENCE,
    MAX_REPORT_EVIDENCE_SIZE,
    getJobReportApiErrorMessage,
    getReportReasonDisplay,
    loadReportReasons,
    sendJobReport,
    validateJobReportForm,
} from '../../services/jobReportService.js';
import '../../assets/styles/JobReportStyle.css';

/**
 * Modal ứng viên báo cáo tin tuyển dụng.
 * Bắt buộc: lý do (>=1), mô tả. Tuỳ chọn: tối đa 3 ảnh, mỗi ảnh ≤ 10MB.
 */
const JobReportModal = ({ open, jobId, jobTitle, onClose, onSubmitted }) => {
    const [reasons, setReasons] = useState([]);
    const [loadingReasons, setLoadingReasons] = useState(false);
    const [selectedCodes, setSelectedCodes] = useState([]);
    const [description, setDescription] = useState('');
    const [evidenceItems, setEvidenceItems] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = useRef(null);
    const evidenceItemsRef = useRef([]);

    const revokeEvidencePreviews = (items) => {
        (items || []).forEach((item) => {
            if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
        });
    };

    useEffect(() => {
        evidenceItemsRef.current = evidenceItems;
    }, [evidenceItems]);

    useEffect(() => {
        if (!open) return undefined;

        setSelectedCodes([]);
        setDescription('');
        revokeEvidencePreviews(evidenceItemsRef.current);
        setEvidenceItems([]);
        setSubmitting(false);

        let cancelled = false;
        setLoadingReasons(true);
        loadReportReasons()
            .then((list) => {
                if (!cancelled) setReasons(Array.isArray(list) ? list : []);
            })
            .catch((err) => {
                if (!cancelled) {
                    toast.error(
                        getJobReportApiErrorMessage(err, 'Không tải được danh sách lý do báo cáo.')
                    );
                    setReasons([]);
                }
            })
            .finally(() => {
                if (!cancelled) setLoadingReasons(false);
            });

        return () => {
            cancelled = true;
            revokeEvidencePreviews(evidenceItemsRef.current);
        };
    }, [open, jobId]);

    if (!open) return null;

    const toggleReason = (code) => {
        setSelectedCodes((prev) =>
            prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
        );
    };

    const handleFilesChange = (e) => {
        const raw = Array.from(e.target.files || []);
        e.target.value = '';

        const images = raw.filter((f) => f.type?.startsWith('image/'));
        if (!images.length) {
            toast.error('Vui lòng chọn file hình ảnh.');
            return;
        }

        const picked = images.filter((f) => f.size <= MAX_REPORT_EVIDENCE_SIZE);
        if (picked.length < images.length) {
            toast.error('Mỗi ảnh minh chứng không được vượt quá 10MB.');
        }
        if (!picked.length) return;

        setEvidenceItems((prev) => {
            const room = MAX_REPORT_EVIDENCE - prev.length;
            if (room <= 0) {
                toast.info(`Chỉ giữ tối đa ${MAX_REPORT_EVIDENCE} ảnh minh chứng.`);
                return prev;
            }
            if (picked.length > room) {
                toast.info(`Chỉ giữ tối đa ${MAX_REPORT_EVIDENCE} ảnh minh chứng.`);
            }
            const added = picked.slice(0, room).map((file, index) => ({
                id: `${file.name}-${file.size}-${Date.now()}-${index}`,
                file,
                previewUrl: URL.createObjectURL(file),
            }));
            return [...prev, ...added];
        });
    };

    const removeEvidence = (id) => {
        setEvidenceItems((prev) => {
            const target = prev.find((item) => item.id === id);
            if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
            return prev.filter((item) => item.id !== id);
        });
    };

    const handleSubmit = async () => {
        const evidenceFiles = evidenceItems.map((item) => item.file);
        const form = {
            reportReasonCodes: selectedCodes,
            description,
            evidenceFiles,
        };
        const error = validateJobReportForm(form);
        if (error) {
            toast.error(error);
            return;
        }

        setSubmitting(true);
        try {
            await sendJobReport(jobId, form);
            toast.success('Đã gửi báo cáo tin tuyển dụng.');
            onSubmitted?.();
            onClose();
        } catch (err) {
            toast.error(getJobReportApiErrorMessage(err, err.message || 'Không thể gửi báo cáo.'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="job-report-modal" role="dialog" aria-modal="true" aria-labelledby="job-report-title">
            <button
                type="button"
                className="job-report-modal__backdrop"
                aria-label="Đóng"
                onClick={onClose}
                disabled={submitting}
            />

            <div className={`job-report-modal__panel${submitting ? ' job-report-modal__panel--submitting' : ''}`}>
                {submitting && (
                    <div className="job-report-modal__saving-overlay" role="status" aria-live="polite">
                        <div className="job-report-modal__saving-card">
                            <span className="job-report-modal__spinner" aria-hidden="true" />
                            <p className="job-report-modal__saving-title">Đang gửi báo cáo…</p>
                            <p className="job-report-modal__saving-sub">Vui lòng chờ trong giây lát</p>
                        </div>
                    </div>
                )}

                <div className="job-report-modal__header">
                    <h2 id="job-report-title">Báo cáo tin tuyển dụng</h2>
                    <button
                        type="button"
                        className="job-report-modal__close"
                        onClick={onClose}
                        disabled={submitting}
                        aria-label="Đóng"
                    >
                        ×
                    </button>
                </div>

                <div className="job-report-modal__body">
                    {jobTitle ? (
                        <p className="job-report-modal__job">
                            Tin: <strong>{jobTitle}</strong>
                        </p>
                    ) : null}

                    <fieldset className="job-report-modal__fieldset" disabled={loadingReasons || submitting}>
                        <legend>
                            Lý do báo cáo <span className="job-report-modal__req">*</span>
                        </legend>
                        {loadingReasons ? (
                            <p className="job-report-modal__loading">Đang tải lý do…</p>
                        ) : reasons.length === 0 ? (
                            <p className="job-report-modal__empty">Không có lý do khả dụng.</p>
                        ) : (
                            <ul className="job-report-modal__reasons">
                                {reasons.map((reason) => {
                                    const display = getReportReasonDisplay(reason);
                                    const code = reason.code;
                                    const checked = selectedCodes.includes(code);
                                    return (
                                        <li key={code}>
                                            <label className="job-report-modal__reason">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => toggleReason(code)}
                                                />
                                                <span>
                                                    <strong>{display.name}</strong>
                                                    {display.description ? (
                                                        <span className="job-report-modal__reason-desc">
                                                            {display.description}
                                                        </span>
                                                    ) : null}
                                                </span>
                                            </label>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </fieldset>

                    <div className="job-report-modal__field">
                        <label htmlFor="job-report-description">
                            Mô tả chi tiết <span className="job-report-modal__req">*</span>
                        </label>
                        <textarea
                            id="job-report-description"
                            rows={4}
                            value={description}
                            disabled={submitting}
                            placeholder="Mô tả cụ thể vì sao bạn báo cáo tin này…"
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="job-report-modal__field">
                        <span className="job-report-modal__label">
                            Ảnh minh chứng{' '}
                            <span className="job-report-modal__optional">(tuỳ chọn, tối đa 3, mỗi ảnh ≤ 10MB)</span>
                        </span>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            hidden
                            onChange={handleFilesChange}
                        />
                        <div className="job-report-modal__thumbs">
                            {evidenceItems.map((item) => (
                                <div key={item.id} className="job-report-modal__thumb">
                                    <img src={item.previewUrl} alt={item.file?.name || 'Minh chứng'} />
                                    <button
                                        type="button"
                                        className="job-report-modal__thumb-remove"
                                        disabled={submitting}
                                        aria-label="Xóa ảnh"
                                        onClick={() => removeEvidence(item.id)}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            {evidenceItems.length < MAX_REPORT_EVIDENCE && (
                                <button
                                    type="button"
                                    className="job-report-modal__thumb-add"
                                    disabled={submitting}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    +
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="job-report-modal__footer">
                    <button
                        type="button"
                        className="job-report-modal__btn job-report-modal__btn--ghost"
                        onClick={onClose}
                        disabled={submitting}
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        className="job-report-modal__btn job-report-modal__btn--danger"
                        onClick={handleSubmit}
                        disabled={submitting || loadingReasons}
                    >
                        {submitting ? (
                            <>
                                <span className="job-report-modal__btn-spinner" aria-hidden="true" />
                                Đang gửi…
                            </>
                        ) : (
                            'Gửi báo cáo'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JobReportModal;
