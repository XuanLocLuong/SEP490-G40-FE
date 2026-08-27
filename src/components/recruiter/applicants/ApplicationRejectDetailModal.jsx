import { useEffect } from 'react';
import { getRejectionReasonLabel } from '../../../services/recruiterApplicationService.js';
import { AlertCircleIcon } from '../../common/icons.jsx';
import '../../../assets/styles/ApplicationRejectModal.css';

const ApplicationRejectDetailModal = ({ open, application, jobTitle, onClose }) => {
    useEffect(() => {
        if (!open) return undefined;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose]);

    if (!open || !application) return null;

    const reasonLabel = getRejectionReasonLabel(application.rejectReason);
    const hasNote = Boolean(application.note?.trim());
    const subtitle = [application.candidateName, jobTitle].filter(Boolean).join(' · ');

    return (
        <div className="application-reject-modal" role="dialog" aria-modal="true">
            <button
                type="button"
                className="application-reject-modal__backdrop"
                aria-label="Đóng"
                onClick={onClose}
            />
            <div className="application-reject-modal__panel">
                <div className="application-reject-modal__header">
                    <div className="application-reject-modal__title-group">
                        <span className="application-reject-modal__icon-badge">
                            <AlertCircleIcon width={20} height={20} />
                        </span>
                        <h2>Chi tiết lý do từ chối</h2>
                    </div>
                    <button
                        type="button"
                        className="application-reject-modal__close"
                        onClick={onClose}
                        aria-label="Đóng"
                    >
                        ×
                    </button>
                </div>

                <div className="application-reject-modal__body">
                    {subtitle && (
                        <p className="application-reject-modal__meta">
                            <strong>{subtitle}</strong>
                        </p>
                    )}

                    <div className="application-reject-detail__card">
                        <span className="application-reject-detail__label">Lý do từ chối:</span>
                        <p className="application-reject-detail__value">{reasonLabel}</p>
                    </div>

                    {hasNote ? (
                        <div className="application-reject-detail__card application-reject-detail__card--note">
                            <span className="application-reject-detail__label">Ghi chú đã gửi:</span>
                            <p className="application-reject-detail__note">{application.note}</p>
                        </div>
                    ) : (
                        <p className="application-reject-detail__empty-note">
                            Không có ghi chú thêm khi từ chối ứng viên này.
                        </p>
                    )}
                </div>

                <div className="application-reject-modal__footer">
                    <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={onClose}
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApplicationRejectDetailModal;
