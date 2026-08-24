import { useEffect, useRef, useState } from 'react';
import ProfileModal from './ProfileModal.jsx';
import RequiredMark from './RequiredMark.jsx';
import { PencilIcon, TargetIcon, WalletIcon, MapPinIcon } from './profileIcons.jsx';
import { formatSalaryRange } from '../../utils/profileFormat.js';
import {
    formatRemovedJobTypeLabels,
    getActiveJobTypeOptions,
    getInactiveSelectedJobTypes,
    getJobTypeLabels,
} from '../../utils/jobTypeDisplay.js';
import { useJobTypeOptions } from '../../hooks/useJobTypeOptions.js';
import { reverseGeocodeLatLng } from '../../utils/reverseGeocode.js';
import LocationPicker from '../../modules/location/LocationPicker.jsx';

// SECTION 2 — Job Preference: lĩnh vực, lương, tâm tìm việc (lat/lng + bán kính).
// Apply: lat/lng bắt buộc (cặp); address text nằm ở Thông tin cá nhân.
const JobPreferenceCard = ({ preference, onSave, saving }) => {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(preference);
    const jobTypeOptions = useJobTypeOptions({ forceOnMount: true });
    const activeJobTypeOptions = getActiveJobTypeOptions(jobTypeOptions);
    const inactiveSelected = getInactiveSelectedJobTypes(preference.jobTypes, jobTypeOptions);
    const inactiveLabels = formatRemovedJobTypeLabels(inactiveSelected, jobTypeOptions);
    const jobTypeLabels = getJobTypeLabels(
        (preference.jobTypes || []).join(','),
        jobTypeOptions
    );
    const formInactiveSelected = getInactiveSelectedJobTypes(form.jobTypes, jobTypeOptions);
    const formInactiveLabels = formatRemovedJobTypeLabels(formInactiveSelected, jobTypeOptions);

    const [showMap, setShowMap] = useState(false);
    const [formError, setFormError] = useState('');
    const [locationLabel, setLocationLabel] = useState('');
    const reverseGeocodeTimerRef = useRef(null);

    useEffect(() => () => {
        if (reverseGeocodeTimerRef.current) clearTimeout(reverseGeocodeTimerRef.current);
    }, []);

    // Nhãn địa điểm từ tọa độ (chỉ view — không ghi vào address BE).
    useEffect(() => {
        let cancelled = false;
        const lat = preference.latitude;
        const lng = preference.longitude;
        if (lat == null || lng == null) {
            setLocationLabel('');
            return undefined;
        }
        (async () => {
            const label = await reverseGeocodeLatLng(lat, lng);
            if (!cancelled) setLocationLabel(label);
        })();
        return () => {
            cancelled = true;
        };
    }, [preference.latitude, preference.longitude]);

    const handleLocationChange = (loc) => {
        if (reverseGeocodeTimerRef.current) {
            clearTimeout(reverseGeocodeTimerRef.current);
        }

        reverseGeocodeTimerRef.current = setTimeout(async () => {
            const label = await reverseGeocodeLatLng(loc.latitude, loc.longitude);
            setForm((prev) => ({
                ...prev,
                latitude: loc.latitude,
                longitude: loc.longitude,
                location: label,
            }));
        }, 600);
    };

    const handleOpen = async () => {
        const next = { ...preference };
        if (next.latitude != null && next.longitude != null && !next.location) {
            next.location = await reverseGeocodeLatLng(next.latitude, next.longitude);
        }
        setForm(next);
        setFormError('');
        setShowMap(false);
        setOpen(true);
    };

    const salaryText = formatSalaryRange(preference);
    const hasTypes = preference.jobTypes?.length > 0;
    const hasLocation = preference.latitude != null && preference.longitude != null;

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

    const removeInactiveType = (value) => {
        setForm((prev) => ({
            ...prev,
            jobTypes: (prev.jobTypes || []).filter((t) => t !== value),
        }));
    };

    const handleSubmit = async () => {
        setFormError('');

        const isBlankSalary = (v) => v === '' || v == null || String(v).trim() === '';
        const toSalaryNumber = (v) => {
            if (isBlankSalary(v)) return null;
            const n = Number(v);
            return Number.isFinite(n) ? n : null;
        };

        const min = toSalaryNumber(form.salaryMin);
        const max = toSalaryNumber(form.salaryMax);
        if (min != null && max != null && min > max) {
            setFormError('Lương tối thiểu phải nhỏ hơn hoặc bằng lương tối đa.');
            return;
        }

        const lat = form.latitude ?? null;
        const lng = form.longitude ?? null;
        if ((lat == null) !== (lng == null)) {
            setFormError('Vĩ độ và kinh độ phải chọn cùng lúc trên bản đồ.');
            return;
        }

        let location = form.location || '';
        if (lat != null && lng != null) {
            const latestLabel = await reverseGeocodeLatLng(lat, lng);
            if (latestLabel) location = latestLabel;
        }

        const ok = await onSave({
            jobTypes: form.jobTypes || [],
            salaryMin: isBlankSalary(form.salaryMin) ? null : form.salaryMin,
            salaryMax: isBlankSalary(form.salaryMax) ? null : form.salaryMax,
            salaryUnit: 'giờ',
            locationRadiusKm:
                form.locationRadiusKm === '' || form.locationRadiusKm == null
                    ? null
                    : form.locationRadiusKm,
            // Nhãn UI only — toUpdatePayload không PUT field này vào address.
            location,
            latitude: lat,
            longitude: lng,
        });

        if (ok) {
            setLocationLabel(location);
            setOpen(false);
        }
    };

    const locationDisplay = locationLabel
        || (hasLocation
            ? `${Number(preference.latitude).toFixed(5)}, ${Number(preference.longitude).toFixed(5)}`
            : '');

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

            <div className={'cp-field' + (!hasTypes ? ' cp-field--missing' : '')}>
                <span className="cp-field__label">
                    LĨNH VỰC
                    <RequiredMark />
                </span>
                {hasTypes ? (
                    <div className="cp-tags">
                        {(preference.jobTypes || []).map((code, index) => {
                            const isInactive = inactiveSelected.includes(code);
                            const label = isInactive
                                ? inactiveLabels[inactiveSelected.indexOf(code)] ||
                                  jobTypeLabels[index] ||
                                  code
                                : jobTypeLabels[index] || code;
                            return (
                                <span
                                    key={`${code}-${index}`}
                                    className={
                                        'cp-tag' +
                                        (isInactive ? ' cp-tag--inactive' : ' cp-tag--soft')
                                    }
                                    title={isInactive ? 'Lĩnh vực đã bị vô hiệu hóa' : undefined}
                                >
                                    {isInactive ? `${label} (đã vô hiệu)` : label}
                                </span>
                            );
                        })}
                    </div>
                ) : (
                    <span className="cp-empty-text">Chưa chọn lĩnh vực</span>
                )}
                {inactiveSelected.length > 0 && (
                    <p className="cp-field-hint cp-field-hint--warn">
                        Có lĩnh vực đã bị vô hiệu hóa — mở sửa để gỡ, hoặc Lưu hồ sơ để hệ thống tự
                        gỡ.
                    </p>
                )}
            </div>

            <div className="cp-field">
                <span className="cp-field__label">LƯƠNG MONG ĐỢI</span>
                <div className="cp-inline-value">
                    <WalletIcon className="cp-inline-value__icon" />
                    <span>{salaryText || 'Chưa cập nhật'}</span>
                </div>
            </div>

            <div className={'cp-field' + (!hasLocation ? ' cp-field--missing' : '')}>
                <span className="cp-field__label">
                    ĐỊA ĐIỂM TÌM VIỆC
                    <RequiredMark />
                </span>
                <div className="cp-inline-value">
                    <MapPinIcon className="cp-inline-value__icon" />
                    <span>
                        {locationDisplay
                            || (preference.locationRadiusKm
                                ? `Chưa chọn vị trí · bán kính ${preference.locationRadiusKm} km`
                                : 'Chưa chọn vị trí trên bản đồ')}
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
                    <label className="cp-form-label">
                        Lĩnh vực mong muốn
                        <RequiredMark />
                    </label>
                    <div className="cp-choice-grid">
                        {activeJobTypeOptions.map((opt) => {
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
                        {formInactiveSelected.map((code, index) => (
                            <button
                                type="button"
                                key={`inactive-${code}`}
                                className="cp-choice cp-choice--inactive"
                                title="Lĩnh vực đã bị vô hiệu hóa — bấm để gỡ"
                                onClick={() => removeInactiveType(code)}
                            >
                                {formInactiveLabels[index] || code} (đã vô hiệu)
                            </button>
                        ))}
                    </div>
                    {formInactiveSelected.length > 0 && (
                        <p className="cp-field-hint cp-field-hint--warn">
                            Có lĩnh vực đã bị vô hiệu hóa — bấm chip đỏ để gỡ, hoặc lưu để hệ thống
                            tự gỡ.
                        </p>
                    )}
                </div>

                <div className="cp-form-row">
                    <div className="cp-form-group">
                        <label className="cp-form-label">Lương tối thiểu (/giờ)</label>
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
                        <label className="cp-form-label">Lương tối đa (/giờ)</label>
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
                        <label className="cp-form-label">Bán kính (km)</label>
                        <input
                            type="number"
                            min="0"
                            className="cp-input"
                            placeholder="VD: 5"
                            value={form.locationRadiusKm ?? ''}
                            onChange={(e) =>
                                setForm((p) => ({ ...p, locationRadiusKm: e.target.value }))
                            }
                        />
                    </div>
                </div>

                <div className="cp-form-group">
                    <label className="cp-form-label">
                        Địa điểm tìm việc
                        <RequiredMark />
                    </label>
                    {form.latitude != null && form.longitude != null ? (
                        <div className="cp-map-coords">
                            <div>
                                ✓ Đã chọn:{' '}
                                {Number(form.latitude).toFixed(5)},{' '}
                                {Number(form.longitude).toFixed(5)}
                            </div>
                            {form.location && (
                                <div className="cp-map-coords__label">{form.location}</div>
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
                        {showMap ? 'Ẩn bản đồ' : 'Cập nhật vị trí'}
                    </button>
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
                                variant="demo"
                                title="Chọn vị trí tìm việc"
                                initialLocation={
                                    form.latitude != null && form.longitude != null
                                        ? {
                                              latitude: form.latitude,
                                              longitude: form.longitude,
                                          }
                                        : null
                                }
                                onLocationChange={handleLocationChange}
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
