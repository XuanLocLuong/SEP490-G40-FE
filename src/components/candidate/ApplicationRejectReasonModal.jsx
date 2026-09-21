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

    const isRecruiterBanned = Boolean(application.recruiterBanned);
    const isJobBlocked =
        application.rejectReason === 'JOB_BLOCKED' ||
        application.jobStatus === 'BLOCKED';

    const isCandidateAction =
        application.rejectReason === 'OFFER_DECLINED' ||
        application.rejectReason === 'CANDIDATE_WITHDREW';

    let modalTitle = 'Lý do từ chối ứng tuyển';
    let reasonDisplay = getRejectReasonLabel(application.rejectReason);
    let noteLabel = 'Ghi chú từ nhà tuyển dụng:';
    let noteDisplay = application.note || '';

    if (isCandidateAction) {
        modalTitle =
            application.rejectReason === 'CANDIDATE_WITHDREW'
                ? 'Chi tiết rút đơn ứng tuyển'
                : 'Chi tiết từ chối nhận việc';
        noteLabel = 'Ghi chú lý do:';
    } else if (isJobBlocked || isRecruiterBanned) {
        noteLabel = 'Ghi chú từ hệ thống:';
        if (isRecruiterBanned) {
            modalTitle = 'Chi tiết tin tuyển dụng bị khóa';
            reasonDisplay = 'Tin tuyển dụng đã bị khóa do vi phạm';
            noteDisplay =
                'Đơn ứng tuyển được hệ thống tự động đóng do tài khoản nhà tuyển dụng bị khóa vi phạm tiêu chuẩn cộng đồng.';
        } else {
            modalTitle = 'Chi tiết tin tuyển dụng đã ngừng tiếp nhận';
            reasonDisplay = 'Tin tuyển dụng đã ngừng tiếp nhận vào thời điểm ứng tuyển';
            noteDisplay =
                'Đơn ứng tuyển đã bị hủy do tin tuyển dụng bị gián đoạn xử lý vào thời điểm ứng tuyển. Hiện tại nhà tuyển dụng đã hoạt động bình thường, bạn có thể theo dõi và ứng tuyển các vị trí mới khác của đơn vị này.';
        }
    }

    const hasNote = Boolean(noteDisplay && noteDisplay.trim());
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
                        <p className="cah-reason-card__value">{reasonDisplay}</p>
                    </div>

                    {hasNote ? (
                        <div className="cah-reason-card cah-reason-card--note">
                            <span className="cah-reason-card__label">{noteLabel}</span>
                            <p className="cah-reason-card__note-text">{noteDisplay}</p>
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
