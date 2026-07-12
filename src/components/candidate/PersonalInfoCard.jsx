import { useState } from 'react';
import ProfileModal from './ProfileModal.jsx';
import { PencilIcon, UserBadgeIcon, CalendarIcon, GenderIcon, HomeAddressIcon } from './profileIcons.jsx';
import { GENDER_OPTIONS, formatDate, getGenderLabel, toDateInputValue } from '../../utils/profileFormat.js';

// SECTION 3 — Personal Information: birthday, gender, address. Edit qua modal -> PUT Profile.
const PersonalInfoCard = ({ personalInfo, onSave, saving }) => {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(personalInfo);
    const [errors, setErrors] = useState({});

    // Nạp giá trị hiện tại vào form ngay khi mở modal (không dùng effect).
    const handleOpen = () => {
        setForm({ ...personalInfo, birthday: toDateInputValue(personalInfo.birthday) });
        setErrors({});
        setOpen(true);
    };

    const validate = () => {
        const next = {};
        if (form.birthday) {
            const d = new Date(form.birthday);
            if (Number.isNaN(d.getTime())) next.birthday = 'Ngày sinh không hợp lệ.';
            else if (d > new Date()) next.birthday = 'Ngày sinh không thể ở tương lai.';
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        const ok = await onSave({
            birthday: form.birthday || null,
            gender: form.gender || '',
            address: form.address || '',
        });
        if (ok) setOpen(false);
    };

    const rows = [
        { icon: CalendarIcon, label: 'Ngày sinh', value: formatDate(personalInfo.birthday) },
        { icon: GenderIcon, label: 'Giới tính', value: getGenderLabel(personalInfo.gender) },
        { icon: HomeAddressIcon, label: 'Địa chỉ', value: personalInfo.address },
    ];

    return (
        <section className="cp-card">
            <div className="cp-card__head">
                <h2 className="cp-card__title">
                    <UserBadgeIcon className="cp-card__title-icon" />
                    Thông tin cá nhân
                </h2>
                <button type="button" className="cp-icon-btn" onClick={handleOpen} aria-label="Sửa thông tin cá nhân">
                    <PencilIcon />
                </button>
            </div>

            <div className="cp-info-grid">
                {rows.map(({ icon: Icon, label, value }) => (
                    <div key={label} className="cp-info-item">
                        <Icon className="cp-info-item__icon" />
                        <div className="cp-info-item__text">
                            <span className="cp-info-item__label">{label}</span>
                            <span className="cp-info-item__value">{value || 'Chưa cập nhật'}</span>
                        </div>
                    </div>
                ))}
            </div>

            <ProfileModal
                open={open}
                title="Chỉnh sửa thông tin cá nhân"
                onClose={() => setOpen(false)}
                footer={
                    <>
                        <button type="button" className="cp-btn cp-btn--ghost" onClick={() => setOpen(false)}>
                            Hủy
                        </button>
                        <button type="button" className="cp-btn cp-btn--primary" onClick={handleSubmit} disabled={saving}>
                            {saving ? 'Đang lưu...' : 'Lưu'}
                        </button>
                    </>
                }
            >
                <div className="cp-form-group">
                    <label className="cp-form-label">Ngày sinh</label>
                    <input
                        type="date"
                        className="cp-input"
                        value={form.birthday || ''}
                        max={new Date().toISOString().slice(0, 10)}
                        onChange={(e) => setForm((p) => ({ ...p, birthday: e.target.value }))}
                    />
                    {errors.birthday && <span className="cp-input-error">{errors.birthday}</span>}
                </div>

                <div className="cp-form-group">
                    <label className="cp-form-label">Giới tính</label>
                    <select
                        className="cp-input"
                        value={form.gender || ''}
                        onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
                    >
                        <option value="">-- Chọn giới tính --</option>
                        {GENDER_OPTIONS.map((g) => (
                            <option key={g.value} value={g.value}>
                                {g.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="cp-form-group">
                    <label className="cp-form-label">Địa chỉ</label>
                    <input
                        type="text"
                        className="cp-input"
                        placeholder="VD: Quận 9, TP.HCM"
                        value={form.address || ''}
                        onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                    />
                </div>
            </ProfileModal>
        </section>
    );
};

export default PersonalInfoCard;
