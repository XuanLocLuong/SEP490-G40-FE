import { useEffect, useState } from 'react';

const EMPTY = {
    name: '',
    description: '',
    active: true,
    reason: '',
};

const SkillFormModal = ({
    open,
    mode = 'create',
    initialSkill = null,
    loading = false,
    onSubmit,
    onCancel,
}) => {
    const [form, setForm] = useState(EMPTY);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;
        setError('');
        if (mode === 'edit' && initialSkill) {
            setForm({
                name: initialSkill.name || '',
                description: initialSkill.description || '',
                active: initialSkill.active !== false,
                reason: '',
            });
        } else {
            setForm(EMPTY);
        }
    }, [open, mode, initialSkill]);

    if (!open) return null;

    const title = mode === 'edit' ? 'Sửa kỹ năng' : 'Thêm kỹ năng';

    const patch = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setError('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const name = form.name.trim();
        const reason = form.reason.trim();
        if (!name) {
            setError('Tên kỹ năng là bắt buộc.');
            return;
        }
        if (!reason) {
            setError('Lý do thay đổi là bắt buộc.');
            return;
        }

        const payload = {
            name,
            description: form.description.trim() || null,
            reason,
        };
        if (mode === 'create') {
            payload.active = Boolean(form.active);
        } else {
            // Category is no longer managed in FE; preserve the existing DB value on update.
            payload.category = initialSkill?.category || null;
        }
        onSubmit?.(payload);
    };

    return (
        <div className="admin-skills-modal" role="dialog" aria-modal="true" aria-labelledby="skill-form-title">
            <button
                type="button"
                className="admin-skills-modal__backdrop"
                aria-label="Đóng"
                onClick={onCancel}
                disabled={loading}
            />
            <form className="admin-skills-modal__panel" onSubmit={handleSubmit}>
                <div className="admin-skills-modal__header">
                    <h2 id="skill-form-title">{title}</h2>
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
                            Tên kỹ năng <span className="required-mark">*</span>
                        </span>
                        <input
                            value={form.name}
                            onChange={(e) => patch('name', e.target.value)}
                            placeholder="Ví dụ: Pha chế"
                            disabled={loading}
                            autoFocus
                        />
                    </label>

                    <label className="admin-skills-field">
                        <span>Mô tả</span>
                        <textarea
                            value={form.description}
                            onChange={(e) => patch('description', e.target.value)}
                            placeholder="Mô tả ngắn về kỹ năng"
                            rows={3}
                            disabled={loading}
                        />
                    </label>

                    {mode === 'create' && (
                        <label className="admin-skills-field admin-skills-field--row">
                            <input
                                type="checkbox"
                                checked={form.active}
                                onChange={(e) => patch('active', e.target.checked)}
                                disabled={loading}
                            />
                            <span>Kích hoạt ngay sau khi tạo</span>
                        </label>
                    )}

                    <label className="admin-skills-field">
                        <span>
                            Lý do <span className="required-mark">*</span>
                        </span>
                        <textarea
                            value={form.reason}
                            onChange={(e) => patch('reason', e.target.value)}
                            placeholder="Lý do tạo/sửa (ghi audit log)"
                            rows={2}
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
                        {loading ? 'Đang lưu...' : mode === 'edit' ? 'Lưu thay đổi' : 'Tạo kỹ năng'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SkillFormModal;
