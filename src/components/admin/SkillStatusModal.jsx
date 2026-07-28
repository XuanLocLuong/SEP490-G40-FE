import { useEffect, useState } from 'react';

const SkillStatusModal = ({
    open,
    skill = null,
    loading = false,
    onConfirm,
    onCancel,
}) => {
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;
        setReason('');
        setError('');
    }, [open, skill?.id]);

    if (!open || !skill) return null;

    const activating = !skill.active;
    const title = activating ? 'Kích hoạt kỹ năng' : 'Vô hiệu hóa kỹ năng';
    const usage = (skill.candidateUsageCount || 0) + (skill.jobUsageCount || 0);

    const handleConfirm = () => {
        const trimmed = reason.trim();
        if (!trimmed) {
            setError('Lý do là bắt buộc.');
            return;
        }
        onConfirm?.({ reason: trimmed });
    };

    return (
        <div className="admin-skills-modal" role="dialog" aria-modal="true" aria-labelledby="skill-status-title">
            <button
                type="button"
                className="admin-skills-modal__backdrop"
                aria-label="Đóng"
                onClick={onCancel}
                disabled={loading}
            />
            <div className="admin-skills-modal__panel admin-skills-modal__panel--sm">
                <div className="admin-skills-modal__header">
                    <h2 id="skill-status-title">{title}</h2>
                    <button
                        type="button"
                        className="admin-skills-modal__close"
                        onClick={onCancel}
                        disabled={loading}
                        aria-label="Đóng"
                    >
                        ×
                    </button>
                </div>

                <div className="admin-skills-modal__body">
                    <p className="admin-skills-modal__message">
                        Bạn đang {activating ? 'kích hoạt' : 'vô hiệu hóa'} kỹ năng{' '}
                        <strong>{skill.name}</strong>.
                    </p>

                    {!activating && usage > 0 ? (
                        <p className="admin-skills-modal__hint admin-skills-modal__hint--warn">
                            Kỹ năng đang được dùng bởi {skill.candidateUsageCount || 0} ứng viên và{' '}
                            {skill.jobUsageCount || 0} tin tuyển. Dữ liệu cũ vẫn giữ; chỉ chặn chọn mới
                            khi tạo/sửa job.
                        </p>
                    ) : null}

                    <label className="admin-skills-field">
                        <span>
                            Lý do <span className="required-mark">*</span>
                        </span>
                        <textarea
                            value={reason}
                            onChange={(e) => {
                                setReason(e.target.value);
                                setError('');
                            }}
                            placeholder="Lý do thay đổi trạng thái"
                            rows={3}
                            disabled={loading}
                            autoFocus
                        />
                    </label>

                    {error ? <p className="admin-skills-modal__error">{error}</p> : null}
                </div>

                <div className="admin-skills-modal__footer">
                    <button
                        type="button"
                        className="admin-skills-btn admin-skills-btn--ghost"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        className={`admin-skills-btn ${
                            activating ? 'admin-skills-btn--primary' : 'admin-skills-btn--danger'
                        }`}
                        onClick={handleConfirm}
                        disabled={loading}
                    >
                        {loading
                            ? 'Đang xử lý...'
                            : activating
                              ? 'Kích hoạt'
                              : 'Vô hiệu hóa'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SkillStatusModal;
