import { useState } from 'react';
import ProfileModal from './ProfileModal.jsx';
import { PencilIcon } from './profileIcons.jsx';
import { GraduationCapIcon as FallbackCap } from '../common/icons.jsx';
import { EDUCATION_LEVEL_OPTIONS, getEducationLevelLabel } from '../../utils/profileFormat.js';

// Backend chỉ lưu ĐÚNG 1 học vấn (schoolName/studentCode/educationLevel) trên
// CandidateProfile, không phải danh sách nhiều trường/bằng cấp — nên đây là
// form single-entry (giống PersonalInfoCard), bỏ hẳn "thêm nhiều học vấn" của
// bản trước vì chỉ gây hiểu lầm (trước đây thêm cái thứ 2 cũng không được lưu).
const EducationCard = ({ education, onSave, saving }) => {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(education);

    const handleOpen = () => {
        setForm(education);
        setOpen(true);
    };

    const handleSubmit = async () => {
        const ok = await onSave(form);
        if (ok) setOpen(false);
    };

    const hasData = education.school || education.studentCode || education.educationLevel;

    return (
        <section className="cp-card">
            <div className="cp-card__head">
                <h2 className="cp-card__title">
                    <FallbackCap className="cp-card__title-icon" width={18} height={18} />
                    Học vấn
                </h2>
                <button type="button" className="cp-icon-btn" onClick={handleOpen} aria-label="Sửa học vấn">
                    <PencilIcon />
                </button>
            </div>

            {!hasData ? (
                <p className="cp-empty-text">Chưa có thông tin học vấn.</p>
            ) : (
                <div className="cp-edu-item">
                    <div className="cp-edu-item__logo">
                        {(education.school || '?').slice(0, 3).toUpperCase()}
                    </div>
                    <div className="cp-edu-item__body">
                        <h3 className="cp-edu-item__school">{education.school || 'Chưa rõ trường'}</h3>
                        {education.educationLevel && (
                            <p className="cp-edu-item__major">
                                {getEducationLevelLabel(education.educationLevel)}
                            </p>
                        )}
                        {education.studentCode && (
                            <div className="cp-edu-item__meta">
                                <span>MSSV: {education.studentCode}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <ProfileModal
                open={open}
                title="Chỉnh sửa học vấn"
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
                            disabled={saving}
                        >
                            {saving ? 'Đang lưu...' : 'Lưu'}
                        </button>
                    </>
                }
            >
                <div className="cp-form-group">
                    <label className="cp-form-label">Trường</label>
                    <input
                        type="text"
                        className="cp-input"
                        placeholder="VD: Đại học FPT"
                        value={form.school || ''}
                        onChange={(e) => setForm((p) => ({ ...p, school: e.target.value }))}
                    />
                </div>

                <div className="cp-form-group">
                    <label className="cp-form-label">Trình độ học vấn</label>
                    <select
                        className="cp-input"
                        value={form.educationLevel || ''}
                        onChange={(e) => setForm((p) => ({ ...p, educationLevel: e.target.value }))}
                    >
                        <option value="">-- Chọn trình độ --</option>
                        {EDUCATION_LEVEL_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="cp-form-group">
                    <label className="cp-form-label">MSSV</label>
                    <input
                        type="text"
                        className="cp-input"
                        placeholder="VD: SE123456"
                        value={form.studentCode || ''}
                        onChange={(e) => setForm((p) => ({ ...p, studentCode: e.target.value }))}
                    />
                </div>
            </ProfileModal>
        </section>
    );
};

export default EducationCard;