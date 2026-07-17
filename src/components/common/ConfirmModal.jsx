import '../../assets/styles/ConfirmModal.css';

const ConfirmModal = ({
    open,
    title,
    children,
    confirmLabel = 'Xác nhận',
    cancelLabel = 'Hủy',
    variant = 'primary',
    loading = false,
    onConfirm,
    onCancel,
}) => {
    if (!open) return null;

    return (
        <div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
            <button
                type="button"
                className="confirm-modal__backdrop"
                aria-label="Đóng"
                onClick={onCancel}
                disabled={loading}
            />

            <div className="confirm-modal__panel">
                <div className="confirm-modal__header">
                    <h2 id="confirm-modal-title">{title}</h2>
                    <button
                        type="button"
                        className="confirm-modal__close"
                        onClick={onCancel}
                        disabled={loading}
                        aria-label="Đóng"
                    >
                        ×
                    </button>
                </div>

                <div className="confirm-modal__body">{children}</div>

                <div className="confirm-modal__footer">
                    <button
                        type="button"
                        className="confirm-modal__btn confirm-modal__btn--ghost"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        className={`confirm-modal__btn confirm-modal__btn--${variant}`}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? 'Đang xử lý...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
