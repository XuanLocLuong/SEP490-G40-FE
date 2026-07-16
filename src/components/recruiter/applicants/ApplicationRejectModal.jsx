import { useEffect, useState } from 'react';
import { REJECTION_REASONS } from '../../../services/recruiterApplicationService.js';
import '../../../assets/styles/ApplicationRejectModal.css';

const ApplicationRejectModal = ({
    open,
    application,
    jobTitle,
    loading,
    onConfirm,
    onCancel,
}) => {
    const [reason, setReason] = useState(REJECTION_REASONS[0]?.value || 'OTHER');
    const [note, setNote] = useState('');

    useEffect(() => {
        if (open) {
            setReason(REJECTION_REASONS[0]?.value || 'OTHER');
            setNote('');
        }
    }, [open, application?.id]);

    if (!open || !application) return null;

    return (
        <div className="application-reject-modal" role="dialog" aria-modal="true">
            <button
                type="button"
                className="application-reject-modal__backdrop"
                aria-label="Đóng"
                onClick={onCancel}
                disabled={loading}
            />
            <div className="application-reject-modal__panel">
                <div className="application-reject-modal__header">
                    <h2>Từ chối ứng viên</h2>
                    <button
                        type="button"
                        className="application-reject-modal__close"
                        onClick={onCancel}
                        disabled={loading}
                        aria-label="Đóng"
                    >
                        ×
                    </button>
                </div>

                <div className="application-reject-modal__body">
                    <p className="application-reject-modal__meta">
                        <strong>{application.candidateName}</strong>
                        {jobTitle ? ` · ${jobTitle}` : ''}
                    </p>

                    <fieldset className="application-reject-modal__reasons">
                        <legend>Lý do từ chối *</legend>
                        {REJECTION_REASONS.map((item) => (
                            <label key={item.value} className="application-reject-modal__reason">
                                <input
                                    type="radio"
                                    name="rejectReason"
                                    value={item.value}
                                    checked={reason === item.value}
                                    onChange={() => setReason(item.value)}
                                    disabled={loading}
                                />
                                <span>{item.label}</span>
                            </label>
                        ))}
                    </fieldset>

                    <label className="application-reject-modal__note-label">
                        Ghi chú (tuỳ chọn)
                        <textarea
                            rows={3}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            disabled={loading}
                            placeholder="Thêm ghi chú cho ứng viên (nếu cần)"
                        />
                    </label>
                </div>

                <div className="application-reject-modal__footer">
                    <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        Huỷ
                    </button>
                    <button
                        type="button"
                        className="btn btn--danger"
                        onClick={() => onConfirm({ reason, note })}
                        disabled={loading || !reason}
                    >
                        {loading ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApplicationRejectModal;
