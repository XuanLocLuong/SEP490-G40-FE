import { getReasonMessage } from '../../utils/applicationErrorMessages.js';
import { formatShiftGroupLine } from '../../utils/formatters.js';
import '../../assets/styles/JobApplyModalStyle.css';

const JobApplyConfirmModal = ({
    open,
    preview,
    scheduleSummary,
    shiftGroups = [],
    loading,
    applying,
    onClose,
    onConfirm,
}) => {
    if (!open) return null;

    const blockingMessages = (preview?.blockingReasons || []).map(getReasonMessage);
    const canApply = preview?.eligible && !loading && !applying;

    return (
        <div className="job-apply-modal" role="dialog" aria-modal="true" aria-labelledby="job-apply-modal-title">
            <button
                type="button"
                className="job-apply-modal__backdrop"
                aria-label="Đóng"
                onClick={onClose}
            />

            <div className="job-apply-modal__panel">
                <div className="job-apply-modal__header">
                    <h2 id="job-apply-modal-title">Xác nhận ứng tuyển</h2>
                    <button type="button" className="job-apply-modal__close" onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className="job-apply-modal__body">
                    {loading ? (
                        <p className="job-apply-modal__loading">Đang kiểm tra điều kiện ứng tuyển...</p>
                    ) : (
                        <>
                            <div className="job-apply-modal__job">
                                <h3>{preview?.jobTitle || '—'}</h3>
                                {preview?.businessName && (
                                    <p className="job-apply-modal__company">{preview.businessName}</p>
                                )}
                            </div>

                            {scheduleSummary && (
                                <div className="job-apply-modal__field">
                                    <span className="job-apply-modal__label">Thời gian làm việc (dự kiến)</span>
                                    <p>{scheduleSummary}</p>
                                </div>
                            )}

                            {shiftGroups.length > 1 && (
                                <ul className="job-apply-modal__shifts">
                                    {shiftGroups.map((shift) => (
                                        <li key={`${shift.range}-${shift.days?.join(',')}`}>
                                            {formatShiftGroupLine(shift)}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {preview?.remainingPositions != null && preview.vacancyAvailable && (
                                <p className="job-apply-modal__meta">
                                    Còn {preview.remainingPositions} vị trí.
                                </p>
                            )}

                            <p className="job-apply-modal__note">
                                Trao đổi ca làm với nhà tuyển dụng trước khi ứng tuyển nếu bạn cần làm rõ lịch
                                cụ thể.
                            </p>

                            {blockingMessages.length > 0 && (
                                <ul className="job-apply-modal__errors">
                                    {blockingMessages.map((message) => (
                                        <li key={message}>{message}</li>
                                    ))}
                                </ul>
                            )}
                        </>
                    )}
                </div>

                <div className="job-apply-modal__footer">
                    <button
                        type="button"
                        className="job-apply-modal__btn job-apply-modal__btn--ghost"
                        onClick={onClose}
                        disabled={applying}
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        className="job-apply-modal__btn job-apply-modal__btn--primary"
                        onClick={onConfirm}
                        disabled={!canApply}
                    >
                        {applying ? 'Đang gửi...' : 'Xác nhận ứng tuyển'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JobApplyConfirmModal;
