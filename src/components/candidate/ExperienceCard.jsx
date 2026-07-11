import { useState } from 'react';
import ProfileModal from './ProfileModal.jsx';
import { PlusIcon, PencilIcon, TrashIcon } from './profileIcons.jsx';
import { formatMonthYear, toMonthInputValue } from '../../utils/profileFormat.js';

const EMPTY_EXP = { company: '', position: '', description: '', startDate: '', endDate: '' };

// SECTION 7 — Experience: danh sách kinh nghiệm (Thêm/Sửa/Xóa) -> PUT Profile.
const ExperienceCard = ({ experiences, onSave, saving }) => {
    const [open, setOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState(-1);
    const [form, setForm] = useState(EMPTY_EXP);

    const openAdd = () => {
        setEditingIndex(-1);
        setForm(EMPTY_EXP);
        setOpen(true);
    };

    const openEdit = (exp, index) => {
        setEditingIndex(index);
        setForm({
            ...EMPTY_EXP,
            ...exp,
            startDate: toMonthInputValue(exp.startDate),
            endDate: toMonthInputValue(exp.endDate),
        });
        setOpen(true);
    };

    const handleSubmit = async () => {
        const next = [...experiences];
        const payload = { ...form };
        if (editingIndex >= 0) next[editingIndex] = { ...next[editingIndex], ...payload };
        else next.push(payload);
        const ok = await onSave(next);
        if (ok) setOpen(false);
    };

    const handleDelete = async (index) => {
        await onSave(experiences.filter((_, i) => i !== index));
    };

    const renderPeriod = (exp) => {
        const start = formatMonthYear(exp.startDate);
        const end = exp.endDate ? formatMonthYear(exp.endDate) : 'Hiện tại';
        if (!start && !exp.endDate) return '';
        return `${start || '?'} - ${end}`;
    };

    return (
        <section className="cp-card">
            <div className="cp-card__head">
                <h2 className="cp-card__title">Kinh nghiệm làm việc</h2>
                <button type="button" className="cp-text-btn" onClick={openAdd}>
                    <PlusIcon width={15} height={15} /> Thêm
                </button>
            </div>

            {experiences.length === 0 ? (
                <p className="cp-empty-text">Chưa có kinh nghiệm làm việc.</p>
            ) : (
                <ul className="cp-list">
                    {experiences.map((exp, index) => {
                        const period = renderPeriod(exp);
                        return (
                            <li key={exp.id ?? index} className="cp-exp-item">
                                <div className="cp-exp-item__head">
                                    <h3 className="cp-exp-item__company">{exp.company || 'Chưa rõ công ty'}</h3>
                                    <div className="cp-edu-item__actions">
                                        <button
                                            type="button"
                                            className="cp-icon-btn cp-icon-btn--sm"
                                            onClick={() => openEdit(exp, index)}
                                            aria-label="Sửa"
                                        >
                                            <PencilIcon width={15} height={15} />
                                        </button>
                                        <button
                                            type="button"
                                            className="cp-icon-btn cp-icon-btn--sm cp-icon-btn--danger"
                                            onClick={() => handleDelete(index)}
                                            aria-label="Xóa"
                                        >
                                            <TrashIcon width={15} height={15} />
                                        </button>
                                    </div>
                                </div>
                                <p className="cp-exp-item__meta">
                                    {exp.position}
                                    {exp.position && period ? ' • ' : ''}
                                    {period}
                                </p>
                                {exp.description && <p className="cp-exp-item__desc">{exp.description}</p>}
                            </li>
                        );
                    })}
                </ul>
            )}

            <ProfileModal
                open={open}
                title={editingIndex >= 0 ? 'Chỉnh sửa kinh nghiệm' : 'Thêm kinh nghiệm'}
                onClose={() => setOpen(false)}
                footer={
                    <>
                        <button type="button" className="cp-btn cp-btn--ghost" onClick={() => setOpen(false)}>
                            Hủy
                        </button>
                        <button
                            type="button"
                            className="cp-btn cp-btn--primary"
                            onClick={handleSubmit}
                            disabled={saving || !form.company.trim()}
                        >
                            {saving ? 'Đang lưu...' : 'Lưu'}
                        </button>
                    </>
                }
            >
                <div className="cp-form-group">
                    <label className="cp-form-label">Công ty *</label>
                    <input
                        type="text"
                        className="cp-input"
                        placeholder="VD: Highlands Coffee"
                        value={form.company}
                        onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
                    />
                </div>
                <div className="cp-form-group">
                    <label className="cp-form-label">Vị trí</label>
                    <input
                        type="text"
                        className="cp-input"
                        placeholder="VD: Nhân viên phục vụ"
                        value={form.position}
                        onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))}
                    />
                </div>
                <div className="cp-form-row">
                    <div className="cp-form-group">
                        <label className="cp-form-label">Bắt đầu</label>
                        <input
                            type="month"
                            className="cp-input"
                            value={form.startDate}
                            onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                        />
                    </div>
                    <div className="cp-form-group">
                        <label className="cp-form-label">Kết thúc</label>
                        <input
                            type="month"
                            className="cp-input"
                            value={form.endDate}
                            onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                        />
                        <span className="cp-input-hint">Để trống nếu đang làm</span>
                    </div>
                </div>
                <div className="cp-form-group">
                    <label className="cp-form-label">Mô tả</label>
                    <textarea
                        className="cp-input cp-textarea"
                        rows={3}
                        placeholder="Mô tả công việc, thành tích..."
                        value={form.description}
                        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    />
                </div>
            </ProfileModal>
        </section>
    );
};

export default ExperienceCard;
