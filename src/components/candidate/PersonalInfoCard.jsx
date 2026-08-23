import { useState } from 'react';
import ProfileModal from './ProfileModal.jsx';
import RequiredMark from './RequiredMark.jsx';
import { PencilIcon, UserBadgeIcon, CalendarIcon, GenderIcon, HomeAddressIcon } from './profileIcons.jsx';
import { PhoneIcon } from '../common/icons.jsx';
import { GENDER_OPTIONS, formatDate, getGenderLabel, toDateInputValue } from '../../utils/profileFormat.js';

// SECTION 3 — Personal Information: birthday, gender, address, phone.
// phone lưu qua PUT /users/me (khác API profile).
// Apply bắt buộc: dateOfBirth, gender, phone, address (+ lat/lng qua nhu cầu tìm việc).
const PersonalInfoCard = ({ personalInfo, onSave, saving }) => {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(personalInfo);
    const [errors, setErrors] = useState({});

    const handleOpen = () => {
        setForm({
            ...personalInfo,
            birthday: toDateInputValue(personalInfo.birthday),
            phone: personalInfo.phone || '',
        });
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
        const phone = (form.phone || '').trim();
        if (phone && !/^(\+84|0)[35789][0-9]{8}$/.test(phone)) {
            next.phone = 'Số điện thoại không đúng định dạng Việt Nam.';
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
            phone: (form.phone || '').trim(),
        });
        if (ok) setOpen(false);
    };

    const rows = [
        {
            icon: CalendarIcon,
            label: 'Ngày sinh',
            value: formatDate(personalInfo.birthday),
            required: true,
            empty: !personalInfo.birthday,
        },
        {
            icon: GenderIcon,
            label: 'Giới tính',
            value: getGenderLabel(personalInfo.gender),
            required: true,
            empty: !personalInfo.gender,
        },
        {
            icon: PhoneIcon,
            label: 'Số điện thoại',
            value: personalInfo.phone,
            required: true,
            empty: !personalInfo.phone?.trim(),
        },
        {
            icon: HomeAddressIcon,
            label: 'Địa chỉ',
            value: personalInfo.address,
            required: true,
            empty: !personalInfo.address?.trim(),
        },
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
                {rows.map(({ icon: Icon, label, value, required, empty }) => (
                    <div
                        key={label}
                        className={
                            'cp-info-item' + (required && empty ? ' cp-info-item--missing' : '')
                        }
                    >
                        <Icon className="cp-info-item__icon" />
                        <div className="cp-info-item__text">
                            <span className="cp-info-item__label">
                                {label}
                                {required ? <RequiredMark /> : null}
                            </span>
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
                    <label className="cp-form-label">
                        Ngày sinh
                        <RequiredMark />
                    </label>
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
                    <label className="cp-form-label">
                        Giới tính
                        <RequiredMark />
                    </label>
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
                    <label className="cp-form-label">
                        Số điện thoại
                        <RequiredMark />
                    </label>
                    <input
                        type="tel"
                        className="cp-input"
                        placeholder="VD: 0912345678"
                        value={form.phone || ''}
                        onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    />
                    {errors.phone && <span className="cp-input-error">{errors.phone}</span>}
                </div>

                <div className="cp-form-group">
                    <label className="cp-form-label">
                        Địa chỉ
                        <RequiredMark />
                    </label>
                    <input
                        type="text"
                        className="cp-input"
                        placeholder="VD: Quận 9, TP.HCM"
                        value={form.address || ''}
                        onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                    />
                    <p className="cp-input-hint">
                        Để ứng tuyển cần địa chỉ kèm tọa độ — chọn vị trí trên bản đồ ở mục Nhu cầu tìm
                        việc.
                    </p>
                </div>
            </ProfileModal>
        </section>
    );
};

export default PersonalInfoCard;
