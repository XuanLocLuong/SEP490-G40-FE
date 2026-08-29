import { useEffect } from 'react';
import { getRejectReasonLabel } from '../../utils/applicationErrorMessages.js';
import { AlertCircleIcon, XIcon } from '../common/icons.jsx';

const ApplicationRejectReasonModal = ({ open, application, onClose }) => {
    useEffect(() => {
        if (!open) return undefined;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose]);

    if (!open || !application) return null;

    const reasonLabel = getRejectReasonLabel(application.rejectReason);
    const hasNote = Boolean(application.note?.trim());
    const isCandidateAction =
        application.rejectReason === 'OFFER_DECLINED' ||
        application.rejectReason === 'CANDIDATE_WITHDREW';

    const modalTitle = isCandidateAction
        ? application.rejectReason === 'CANDIDATE_WITHDREW'
            ? 'Chi tiết rút đơn ứng tuyển'
            : 'Chi tiết từ chối nhận việc'
        : 'Lý do từ chối ứng tuyển';

    const noteLabel = isCandidateAction ? 'Ghi chú lý do:' : 'Ghi chú từ nhà tuyển dụng:';
    const emptyNoteText = isCandidateAction
        ? 'Không có ghi chú thêm.'
        : 'Nhà tuyển dụng không để lại ghi chú thêm.';

    return (
        <div className="cah-modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
            <div className="cah-modal-panel" onClick={(e) => e.stopPropagation()}>
                <div className="cah-modal-header">
                    <div className="cah-modal-title-wrap">
                        <span className="cah-modal-icon-badge">
                            <AlertCircleIcon width={22} height={22} />
                        </span>
                        <div>
                            <h3 className="cah-modal-title">{modalTitle}</h3>
                            <p className="cah-modal-subtitle">
                                {[application.jobTitle, application.businessName]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="cah-modal-close"
                        onClick={onClose}
                        aria-label="Đóng"
                    >
                        <XIcon width={18} height={18} />
                    </button>
                </div>

                <div className="cah-modal-body">
                    <div className="cah-reason-card">
                        <span className="cah-reason-card__label">Lý do chính:</span>
                        <p className="cah-reason-card__value">{reasonLabel}</p>
                    </div>

                    {hasNote ? (
                        <div className="cah-reason-card cah-reason-card--note">
                            <span className="cah-reason-card__label">{noteLabel}</span>
                            <p className="cah-reason-card__note-text">{application.note}</p>
                        </div>
                    ) : (
                        <p className="cah-reason-empty-note">{emptyNoteText}</p>
                    )}
                </div>

                <div className="cah-modal-footer">
                    <button
                        type="button"
                        className="cah-btn cah-btn--primary"
                        onClick={onClose}
                    >
                        Đã hiểu
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApplicationRejectReasonModal;
