import { useEffect, useRef, useState } from 'react';
import ProfileModal from './ProfileModal.jsx';
import { PencilIcon, TargetIcon, WalletIcon, MapPinIcon } from './profileIcons.jsx';
import { JOB_TYPE_OPTIONS, formatSalaryRange, getJobTypeLabel } from '../../utils/profileFormat.js';
import LocationPicker from '../../modules/location/LocationPicker.jsx';

// SECTION 2 — Job Preference: hình thức, lương mong đợi, địa điểm. Edit qua modal -> PUT Profile.
const JobPreferenceCard = ({ preference, onSave, saving }) => {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(preference);

    const [showMap, setShowMap] = useState(false);
    const [formError, setFormError] = useState('');
    const reverseGeocodeTimerRef = useRef(null);

    // Dọn timer khi component unmount, tránh setState sau khi đã unmount.
    useEffect(() => () => {
        if (reverseGeocodeTimerRef.current) clearTimeout(reverseGeocodeTimerRef.current);
    }, []);

    const reverseGeocode = async (latitude, longitude) => {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
                {
                    headers: {
                        'Accept-Language': 'vi',
                    },
                }
            );

            const data = await res.json();

            return data?.display_name || '';
        } catch (err) {
            console.error('Reverse geocode failed:', err);
            return '';
        }
    };

    const handleLocationChange = (loc) => {
        if (reverseGeocodeTimerRef.current) {
            clearTimeout(reverseGeocodeTimerRef.current);
        }

        reverseGeocodeTimerRef.current = setTimeout(async () => {
            const address = await reverseGeocode(
                loc.latitude,
                loc.longitude
            );

            setForm((prev) => ({
                ...prev,
                latitude: loc.latitude,
                longitude: loc.longitude,
                location: address,
            }));
        }, 600);
    };


    // Nạp giá trị hiện tại vào form ngay khi mở modal (không dùng effect).
    const handleOpen = () => {
        setForm(preference);
        setShowMap(false);
        setOpen(true);
    };

    const salaryText = formatSalaryRange(preference);
    const hasTypes = preference.jobTypes?.length > 0;

    const toggleType = (value) => {
        setForm((prev) => {
            const current = prev.jobTypes || [];
            const exists = current.includes(value);
            return {
                ...prev,
                jobTypes: exists ? current.filter((t) => t !== value) : [...current, value],
            };
        });
    };

    const handleSubmit = async () => {

        setFormError('');

        const min = form.salaryMin === '' ? null : Number(form.salaryMin);
        const max = form.salaryMax === '' ? null : Number(form.salaryMax);
        if (min != null && max != null && min > max) {
            setFormError('Lương tối thiểu phải nhỏ hơn hoặc bằng lương tối đa.');
            return;
        }

        let location = form.location || '';

        if (
            form.latitude != null &&
            form.longitude != null
        ) {
            const latestAddress = await reverseGeocode(
                form.latitude,
                form.longitude
            );

            if (latestAddress) {
                location = latestAddress;
            }
        }

        const ok = await onSave({
            jobTypes: form.jobTypes || [],
            salaryMin: form.salaryMin === '' ? null : form.salaryMin,
            salaryMax: form.salaryMax === '' ? null : form.salaryMax,
            salaryUnit: form.salaryUnit || 'giờ',
            locationRadiusKm:
                form.locationRadiusKm === ''
                    ? null
                    : form.locationRadiusKm,
            location,
            latitude: form.latitude ?? null,
            longitude: form.longitude ?? null,
        });

        if (ok) {
            setForm((prev) => ({
                ...prev,
                location,
            }));

            setOpen(false);
        }
    };

    return (
        <section className="cp-card">
            <div className="cp-card__head">
                <h2 className="cp-card__title">
                    <TargetIcon className="cp-card__title-icon" />
                    Nhu cầu tìm việc
                </h2>
                <button type="button" className="cp-icon-btn" onClick={handleOpen} aria-label="Sửa nhu cầu tìm việc">
                    <PencilIcon />
                </button>
            </div>

            <div className="cp-field">
                <span className="cp-field__label">HÌNH THỨC</span>
                {hasTypes ? (
                    <div className="cp-tags">
                        {preference.jobTypes.map((type) => (
                            <span key={type} className="cp-tag cp-tag--soft">
                                {getJobTypeLabel(type)}
                            </span>
                        ))}
                    </div>
                ) : (
                    <span className="cp-empty-text">Chưa chọn hình thức</span>
                )}
            </div>

            <div className="cp-field">
                <span className="cp-field__label">LƯƠNG MONG ĐỢI</span>
                <div className="cp-inline-value">
                    <WalletIcon className="cp-inline-value__icon" />
                    <span>{salaryText || 'Chưa cập nhật'}</span>
                </div>
            </div>

            <div className="cp-field">
                <span className="cp-field__label">ĐỊA ĐIỂM</span>
                <div className="cp-inline-value">
                    <MapPinIcon className="cp-inline-value__icon" />
                    <span>
                        {preference.location
                            ? preference.location
                            : preference.locationRadiusKm
                              ? `Tìm việc trong bán kính ${preference.locationRadiusKm} km`
                              : 'Chưa cập nhật'}
                    </span>
                </div>
            </div>

            <ProfileModal
                open={open}
                title="Chỉnh sửa nhu cầu tìm việc"
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
                    {formError && <p className="cp-form-error">{formError}</p>}
                    <label className="cp-form-label">Hình thức mong muốn</label>
                    <div className="cp-choice-grid">
                        {JOB_TYPE_OPTIONS.map((opt) => {
                            const active = (form.jobTypes || []).includes(opt.value);
                            return (
                                <button
                                    type="button"
                                    key={opt.value}
                                    className={'cp-choice' + (active ? ' cp-choice--active' : '')}
                                    onClick={() => toggleType(opt.value)}
                                >
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="cp-form-row">
                    <div className="cp-form-group">
                        <label className="cp-form-label">Lương tối thiểu</label>
                        <input
                            type="number"
                            min="0"
                            className="cp-input"
                            placeholder="VD: 25000"
                            value={form.salaryMin ?? ''}
                            onChange={(e) => setForm((p) => ({ ...p, salaryMin: e.target.value }))}
                        />
                    </div>
                    <div className="cp-form-group">
                        <label className="cp-form-label">Lương tối đa</label>
                        <input
                            type="number"
                            min="0"
                            className="cp-input"
                            placeholder="VD: 30000"
                            value={form.salaryMax ?? ''}
                            onChange={(e) => setForm((p) => ({ ...p, salaryMax: e.target.value }))}
                        />
                    </div>
                    <div className="cp-form-group cp-form-group--sm">
                        <label className="cp-form-label">Đơn vị</label>
                        <select
                            className="cp-input"
                            value={form.salaryUnit || 'giờ'}
                            onChange={(e) => setForm((p) => ({ ...p, salaryUnit: e.target.value }))}
                        >
                            <option value="giờ">/giờ</option>
                            <option value="ca">/ca</option>
                            <option value="tháng">/tháng</option>
                        </select>
                    </div>
                </div>

                <div className="cp-form-row">
                    <div className="cp-form-group">
                        <label className="cp-form-label">Địa điểm mong muốn</label>
                        <input
                            type="text"
                            className="cp-input"
                            placeholder="VD: Quận 9, TP.HCM"
                            value={form.location || ''}
                            onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                        />
                    </div>
                    <div className="cp-form-group cp-map-toggle-group">
                        <label className="cp-form-label">Toạ độ trên bản đồ</label>
                        {form.latitude != null && form.longitude != null ? (
                            <div className="cp-map-coords">
                                <div>
                                    ✓ Đã chọn:
                                    {' '}
                                    {form.latitude.toFixed(5)},
                                    {' '}
                                    {form.longitude.toFixed(5)}
                                </div>

                                {form.location && (
                                    <div
                                        style={{
                                            marginTop: 6,
                                            color: '#4b5563',
                                            fontSize: 13,
                                        }}
                                    >
                                        📍 {form.location}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="cp-empty-text">Chưa chọn vị trí trên bản đồ.</p>
                        )}
                        <button
                            type="button"
                            className="cp-btn cp-btn--ghost cp-btn--sm"
                            onClick={() => setShowMap((v) => !v)}
                        >
                            {showMap ? 'Ẩn bản đồ' : '📍 Chọn trên bản đồ'}
                        </button>
                    </div>

                    {/*{showMap && (*/}
                    {/*    <div className="cp-map-embed">*/}
                    {/*        <LocationPicker*/}
                    {/*            title="Chọn vị trí tìm việc"*/}
                    {/*            onLocationChange={handleLocationChange}*/}
                    {/*        />*/}
                    {/*    </div>*/}
                    {/*)}*/}
                    <div className="cp-form-group cp-form-group--sm">
                        <label className="cp-form-label">Bán kính (km)</label>
                        <input
                            type="number"
                            min="0"
                            className="cp-input"
                            placeholder="VD: 5"
                            value={form.locationRadiusKm ?? ''}
                            onChange={(e) => setForm((p) => ({ ...p, locationRadiusKm: e.target.value }))}
                        />
                    </div>
                </div>
            </ProfileModal>
            {showMap && (
                <div className="cp-map-modal-overlay">
                    <div className="cp-map-modal">

                        <div className="cp-map-modal-header">
                            <h3>Chọn vị trí tìm việc</h3>

                            <button
                                type="button"
                                className="cp-map-close"
                                onClick={() => setShowMap(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="cp-map-modal-body">
                            <LocationPicker
                                title=""
                                onLocationChange={(loc) => {
                                    handleLocationChange(loc);
                                }}
                            />
                        </div>

                        <div className="cp-map-modal-footer">

                            <button
                                className="cp-btn cp-btn--ghost"
                                onClick={() => setShowMap(false)}
                            >
                                Hủy
                            </button>

                            <button
                                className="cp-btn cp-btn--primary"
                                onClick={() => setShowMap(false)}
                            >
                                Xác nhận
                            </button>

                        </div>

                    </div>
                </div>
            )}
        </section>
    );
};

export default JobPreferenceCard;
