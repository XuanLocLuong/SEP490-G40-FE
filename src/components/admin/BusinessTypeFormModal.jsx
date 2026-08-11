import { useEffect, useState } from 'react';

const EMPTY = {
    code: '',
    name: '',
    description: '',
    requiresBusinessLicense: true,
};

const BusinessTypeFormModal = ({
    open,
    mode = 'create',
    initialType = null,
    loading = false,
    onSubmit,
    onCancel,
}) => {
    const [form, setForm] = useState(EMPTY);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;
        setError('');
        if (mode === 'edit' && initialType) {
            setForm({
                code: initialType.code || '',
                name: initialType.name || '',
                description: initialType.description || '',
                requiresBusinessLicense: Boolean(initialType.requiresBusinessLicense),
            });
        } else {
            setForm(EMPTY);
        }
    }, [open, mode, initialType]);

    if (!open) return null;

    const title = mode === 'edit' ? 'Sửa loại hình doanh nghiệp' : 'Thêm loại hình doanh nghiệp';

    const patch = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setError('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const code = form.code.trim().toUpperCase();
        const name = form.name.trim();
        if (!code) {
            setError('Mã loại hình là bắt buộc.');
            return;
        }
        if (!name) {
            setError('Tên loại hình là bắt buộc.');
            return;
        }

        onSubmit?.({
            code,
            name,
            description: form.description.trim() || null,
            requiresBusinessLicense: Boolean(form.requiresBusinessLicense),
        });
    };

    return (
        <div
            className="admin-skills-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="biz-type-form-title"
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
                    <h2 id="biz-type-form-title">{title}</h2>
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
                            Mã (code) <span className="required-mark">*</span>
                        </span>
                        <input
                            value={form.code}
                            onChange={(e) => patch('code', e.target.value.toUpperCase())}
                            placeholder="VD: FNB, RETAIL"
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
                            onChange={(e) => patch('name', e.target.value)}
                            placeholder="VD: F&B (Dịch vụ ăn uống)"
                            disabled={loading}
                        />
                    </label>

                    <label className="admin-skills-field">
                        <span>Mô tả</span>
                        <textarea
                            value={form.description}
                            onChange={(e) => patch('description', e.target.value)}
                            placeholder="Mô tả ngắn về loại hình"
                            rows={3}
                            disabled={loading}
                        />
                    </label>

                    <label className="admin-skills-field admin-skills-field--row">
                        <input
                            type="checkbox"
                            checked={form.requiresBusinessLicense}
                            onChange={(e) => patch('requiresBusinessLicense', e.target.checked)}
                            disabled={loading}
                        />
                        <span>Yêu cầu giấy phép kinh doanh khi xác minh</span>
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
                        {loading ? 'Đang lưu…' : mode === 'edit' ? 'Lưu thay đổi' : 'Tạo loại hình'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BusinessTypeFormModal;
