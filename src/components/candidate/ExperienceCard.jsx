import { useState } from 'react';
import ProfileModal from './ProfileModal.jsx';
import ConfirmModal from '../common/ConfirmModal.jsx';
import { PlusIcon, PencilIcon, TrashIcon } from './profileIcons.jsx';
import { formatDate } from '../../utils/profileFormat.js';

const EMPTY_EXP = {
    jobTitle: '',
    organization: '',
    description: '',
    startDate: '',
    endDate: '',
};

const renderPeriod = (exp) => {
    const start = formatDate(exp.startDate);
    const end = exp.endDate ? formatDate(exp.endDate) : 'Hiện tại';
    if (!start && !exp.endDate) return '';
    return `${start || '?'} - ${end}`;
};

const ExperienceCard = ({ experiences, onSave, onDelete, saving, loading }) => {
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_EXP);
    const [dateError, setDateError] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);

    const openAdd = () => {
        setEditingId(null);
        setForm(EMPTY_EXP);
        setDateError('');
        setOpen(true);
    };

    const openEdit = (exp) => {
        setEditingId(exp.id);
        setForm({
            ...EMPTY_EXP,
            jobTitle: exp.jobTitle || '',
            organization: exp.organization || '',
            description: exp.description || '',
            startDate: exp.startDate || '',
            endDate: exp.endDate || '',
        });
        setDateError('');
        setOpen(true);
    };

    const canSubmit =
        form.jobTitle.trim() &&
        form.organization.trim() &&
        form.startDate &&
        (!form.endDate || form.startDate <= form.endDate);

    const handleSubmit = async () => {
        if (!form.jobTitle.trim() || !form.organization.trim() || !form.startDate) {
            return;
        }
        if (form.endDate && form.startDate > form.endDate) {
            setDateError('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.');
            return;
        }

        const ok = await onSave(editingId, {
            jobTitle: form.jobTitle,
            organization: form.organization,
            startDate: form.startDate,
            endDate: form.endDate || null,
            description: form.description,
        });
        if (ok) setOpen(false);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget?.id) return;
        const ok = await onDelete(deleteTarget.id);
        if (ok) setDeleteTarget(null);
    };

    return (
        <section className="cp-card">
            <div className="cp-card__head">
                <h2 className="cp-card__title">Kinh nghiệm làm việc</h2>
                <button type="button" className="cp-text-btn" onClick={openAdd}>
                    <PlusIcon width={15} height={15} /> Thêm
                </button>
            </div>

            {loading && experiences.length === 0 ? (
                <p className="cp-empty-text">Đang tải kinh nghiệm làm việc…</p>
            ) : experiences.length === 0 ? (
                <p className="cp-empty-text">Chưa có kinh nghiệm làm việc.</p>
            ) : (
                <ul className="cp-list">
                    {experiences.map((exp, index) => {
                        const period = renderPeriod(exp);
                        return (
                            <li key={exp.id ?? index} className="cp-exp-item">
                                <div className="cp-exp-item__head">
                                    <h3 className="cp-exp-item__company">
                                        {exp.organization || 'Chưa rõ nơi làm việc'}
                                    </h3>
                                    <div className="cp-edu-item__actions">
                                        <button
                                            type="button"
                                            className="cp-icon-btn cp-icon-btn--sm"
                                            onClick={() => openEdit(exp)}
                                            aria-label="Sửa"
                                        >
                                            <PencilIcon width={15} height={15} />
                                        </button>
                                        <button
                                            type="button"
                                            className="cp-icon-btn cp-icon-btn--sm cp-icon-btn--danger"
                                            onClick={() => setDeleteTarget(exp)}
                                            aria-label="Xóa"
                                        >
                                            <TrashIcon width={15} height={15} />
                                        </button>
                                    </div>
                                </div>
                                <p className="cp-exp-item__meta">
                                    {exp.jobTitle}
                                    {exp.jobTitle && period ? ' • ' : ''}
                                    {period}
                                </p>
                                {exp.description && (
                                    <p className="cp-exp-item__desc">{exp.description}</p>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}

            <ProfileModal
                open={open}
                title={editingId ? 'Chỉnh sửa kinh nghiệm' : 'Thêm kinh nghiệm'}
                onClose={() => setOpen(false)}
                footer={
                    <>
                        <button
                            type="button"
                            className="cp-btn cp-btn--ghost"
                            onClick={() => setOpen(false)}
                        >
                            Hủy
                        </button>
                        <button
                            type="button"
                            className="cp-btn cp-btn--primary"
                            onClick={handleSubmit}
                            disabled={saving || !canSubmit}
                        >
                            {saving ? 'Đang lưu...' : 'Lưu'}
                        </button>
                    </>
                }
            >
                <div className="cp-form-group">
                    <label className="cp-form-label">Vị trí *</label>
                    <input
                        type="text"
                        className="cp-input"
                        placeholder="VD: Barista"
                        value={form.jobTitle}
                        onChange={(e) => setForm((p) => ({ ...p, jobTitle: e.target.value }))}
                    />
                </div>
                <div className="cp-form-group">
                    <label className="cp-form-label">Nơi làm việc *</label>
                    <input
                        type="text"
                        className="cp-input"
                        placeholder="VD: Highlands Coffee"
                        value={form.organization}
                        onChange={(e) => setForm((p) => ({ ...p, organization: e.target.value }))}
                    />
                </div>
                <div className="cp-form-row">
                    <div className="cp-form-group">
                        <label className="cp-form-label">Ngày bắt đầu *</label>
                        <input
                            type="date"
                            className="cp-input"
                            value={form.startDate}
                            max={form.endDate || undefined}
                            onChange={(e) => {
                                setDateError('');
                                setForm((p) => ({ ...p, startDate: e.target.value }));
                            }}
                        />
                    </div>
                    <div className="cp-form-group">
                        <label className="cp-form-label">Ngày kết thúc</label>
                        <input
                            type="date"
                            className="cp-input"
                            value={form.endDate}
                            min={form.startDate || undefined}
                            onChange={(e) => {
                                setDateError('');
                                setForm((p) => ({ ...p, endDate: e.target.value }));
                            }}
                        />
                        <span className="cp-input-hint">Để trống nếu đang làm</span>
                    </div>
                </div>
                {dateError && <span className="cp-input-error">{dateError}</span>}
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

            <ConfirmModal
                open={Boolean(deleteTarget)}
                title="Xóa kinh nghiệm?"
                confirmLabel="Xóa"
                cancelLabel="Hủy"
                variant="danger"
                loading={saving}
                onConfirm={handleConfirmDelete}
                onCancel={() => {
                    if (!saving) setDeleteTarget(null);
                }}
            >
                <p>
                    Kinh nghiệm
                    {deleteTarget?.jobTitle ? (
                        <>
                            {' '}
                            <strong>{deleteTarget.jobTitle}</strong>
                        </>
                    ) : null}
                    {deleteTarget?.organization ? (
                        <>
                            {' '}
                            tại <strong>{deleteTarget.organization}</strong>
                        </>
                    ) : null}{' '}
                    sẽ bị xóa vĩnh viễn.
                </p>
            </ConfirmModal>
        </section>
    );
};

export default ExperienceCard;
