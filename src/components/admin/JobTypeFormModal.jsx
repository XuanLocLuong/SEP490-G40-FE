import { useState } from 'react';

const EMPTY_FORM = {
    code: '',
    name: '',
    description: '',
};

const initialFormOf = (mode, initialType) =>
    mode === 'edit' && initialType
        ? {
              code: initialType.code || '',
              name: initialType.name || '',
              description: initialType.description || '',
          }
        : EMPTY_FORM;

const JobTypeFormModal = ({
    open,
    mode = 'create',
    initialType = null,
    loading = false,
    onSubmit,
    onCancel,
}) => {
    const [form, setForm] = useState(() => initialFormOf(mode, initialType));
    const [error, setError] = useState('');

    if (!open) return null;

    const patch = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
        setError('');
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const code = form.code.trim().toUpperCase();
        const name = form.name.trim();
        const description = form.description.trim();

        if (!code) {
            setError('Mã lĩnh vực là bắt buộc.');
            return;
        }
        if (!name) {
            setError('Tên lĩnh vực là bắt buộc.');
            return;
        }

        onSubmit?.({ code, name, description: description || null });
    };

    const title = mode === 'edit' ? 'Sửa lĩnh vực' : 'Thêm lĩnh vực';

    return (
        <div
            className="admin-skills-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="job-type-form-title"
        >
            <button
                type="button"
                className="admin-skills-modal__backdrop"
                aria-label="Đóng"
                onClick={onCancel}
                disabled={loading}
            />
            <form className="admin-skills-modal__panel" onSubmit={handleSubmit}>
                <div className="admin-skills-modal__header">
                    <h2 id="job-type-form-title">{title}</h2>
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
                    <label className="admin-skills-field">
                        <span>
                            Mã lĩnh vực <span className="required-mark">*</span>
                        </span>
                        <input
                            value={form.code}
                            onChange={(event) => patch('code', event.target.value.toUpperCase())}
                            placeholder="VD: RETAIL"
                            maxLength={64}
                            disabled={loading}
                            autoFocus={mode === 'create'}
                        />
                    </label>

                    <label className="admin-skills-field">
                        <span>
                            Tên hiển thị <span className="required-mark">*</span>
                        </span>
                        <input
                            value={form.name}
                            onChange={(event) => patch('name', event.target.value)}
                            placeholder="VD: Bán hàng & Bán lẻ"
                            maxLength={255}
                            disabled={loading}
                        />
                    </label>

                    <label className="admin-skills-field">
                        <span>Mô tả</span>
                        <textarea
                            value={form.description}
                            onChange={(event) => patch('description', event.target.value)}
                            placeholder="Mô tả ngắn về lĩnh vực"
                            rows={4}
                            maxLength={1000}
                            disabled={loading}
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
                        type="submit"
                        className="admin-skills-btn admin-skills-btn--primary"
                        disabled={loading}
                    >
                        {loading ? 'Đang lưu…' : mode === 'edit' ? 'Lưu thay đổi' : 'Tạo lĩnh vực'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default JobTypeFormModal;
