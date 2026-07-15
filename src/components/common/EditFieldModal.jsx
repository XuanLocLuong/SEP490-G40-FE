const EditFieldModal = ({
    open,
    title,
    currentLabel,
    currentValue,
    newLabel,
    newValue,
    onNewValueChange,
    placeholder,
    inputType = 'text',
    multiline = false,
    saving = false,
    error = '',
    onClose,
    onSave,
}) => {
    if (!open) return null;

    return (
        <div className="edit-field-modal" role="dialog" aria-modal="true">
            <button
                type="button"
                className="edit-field-modal__backdrop"
                aria-label="Đóng"
                onClick={onClose}
            />

            <div className="edit-field-modal__panel">
                <div className="edit-field-modal__header">
                    <h2>{title}</h2>
                    <button type="button" className="edit-field-modal__close" onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className="edit-field-modal__body">
                    {error && (
                        <div className="edit-field-modal__error" role="alert">
                            {error}
                        </div>
                    )}

                    <label className="edit-field-modal__field">
                        <span>{currentLabel}</span>
                        <input type="text" value={currentValue || '—'} readOnly disabled />
                    </label>

                    <label className="edit-field-modal__field">
                        <span>{newLabel}</span>
                        {multiline ? (
                            <textarea
                                className="edit-field-modal__textarea"
                                value={newValue}
                                onChange={(e) => onNewValueChange(e.target.value)}
                                placeholder={placeholder}
                                rows={5}
                                autoFocus
                            />
                        ) : (
                            <input
                                type={inputType}
                                value={newValue}
                                onChange={(e) => onNewValueChange(e.target.value)}
                                placeholder={placeholder}
                                autoFocus
                            />
                        )}
                    </label>
                </div>

                <div className="edit-field-modal__footer">
                    <button
                        type="button"
                        className="edit-field-modal__btn edit-field-modal__btn--ghost"
                        onClick={onClose}
                        disabled={saving}
                    >
                        Hủy bỏ
                    </button>
                    <button
                        type="button"
                        className="edit-field-modal__btn edit-field-modal__btn--primary"
                        onClick={onSave}
                        disabled={saving}
                    >
                        {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditFieldModal;
