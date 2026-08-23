import { useState } from 'react';
import ProfileModal from './ProfileModal.jsx';
import RequiredMark from './RequiredMark.jsx';
import { PencilIcon } from './profileIcons.jsx';
import { GraduationCapIcon as FallbackCap } from '../common/icons.jsx';
import { getEducationLevelLabel } from '../../utils/profileFormat.js';
import { useEducationLevelOptions } from '../../hooks/useEducationLevelOptions.js';

// Backend chỉ lưu ĐÚNG 1 học vấn (schoolName/studentCode/educationLevel) trên
// CandidateProfile. Apply chỉ bắt buộc educationLevel — trường/MSSV optional.
const EducationCard = ({ education, onSave, saving }) => {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(education);
    const educationLevelOptions = useEducationLevelOptions();

    const handleOpen = () => {
        setForm(education);
        setOpen(true);
    };

    const handleSubmit = async () => {
        const ok = await onSave(form);
        if (ok) setOpen(false);
    };

    const hasData = education.school || education.studentCode || education.educationLevel;
    const levelMissing = !education.educationLevel;

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
                <p className="cp-empty-text">
                    Chưa có thông tin học vấn.
                    {levelMissing ? (
                        <>
                            {' '}
                            <span className="cp-required-hint">
                                Cần chọn trình độ học vấn
                                <RequiredMark />
                            </span>
                        </>
                    ) : null}
                </p>
            ) : (
                <div className="cp-edu-item">
                    <div className="cp-edu-item__logo">
                        {(education.school || getEducationLevelLabel(education.educationLevel, educationLevelOptions) || '?')
                            .slice(0, 3)
                            .toUpperCase()}
                    </div>
                    <div className="cp-edu-item__body">
                        {education.educationLevel ? (
                            <h3 className="cp-edu-item__school">
                                {getEducationLevelLabel(
                                    education.educationLevel,
                                    educationLevelOptions
                                )}
                            </h3>
                        ) : (
                            <h3 className="cp-edu-item__school cp-edu-item__school--missing">
                                Chưa chọn trình độ học vấn
                                <RequiredMark />
                            </h3>
                        )}
                        {education.school && (
                            <p className="cp-edu-item__major">{education.school}</p>
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
                    <label className="cp-form-label" htmlFor="cp-edu-level">
                        Trình độ học vấn
                        <RequiredMark />
                    </label>
                    <select
                        id="cp-edu-level"
                        className="cp-input"
                        value={form.educationLevel || ''}
                        onChange={(e) => setForm((p) => ({ ...p, educationLevel: e.target.value }))}
                        required
                    >
                        <option value="">-- Chọn trình độ --</option>
                        {educationLevelOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="cp-form-group">
                    <label className="cp-form-label" htmlFor="cp-edu-school">
                        Trường
                    </label>
                    <input
                        id="cp-edu-school"
                        type="text"
                        className="cp-input"
                        placeholder="VD: Đại học FPT"
                        value={form.school || ''}
                        onChange={(e) => setForm((p) => ({ ...p, school: e.target.value }))}
                    />
                </div>

                <div className="cp-form-group">
                    <label className="cp-form-label" htmlFor="cp-edu-mssv">
                        MSSV
                    </label>
                    <input
                        id="cp-edu-mssv"
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
