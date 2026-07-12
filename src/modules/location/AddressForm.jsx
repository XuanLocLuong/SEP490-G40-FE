import { useMemo, useState } from 'react';
import { getProvinces, getWardsByProvince } from './localLocation.js';
import '../../assets/styles/AccountSettingsStyle.css';
import './addressForm.css';

const emptyForm = () => ({
    provinceId: '',
    wardId: '',
    detailAddress: '',
});

/**
 * Form chọn địa chỉ hành chính VN (2 cấp: Tỉnh/TP → Phường/Xã) + địa chỉ chi tiết.
 */
const AddressForm = ({ initialValues, onChange }) => {
    const provinces = useMemo(() => getProvinces(), []);

    const [form, setForm] = useState(() => ({
        ...emptyForm(),
        ...initialValues,
    }));

    const wards = useMemo(
        () => getWardsByProvince(form.provinceId),
        [form.provinceId]
    );

    const buildPayload = (nextForm) => {
        const nextWards = getWardsByProvince(nextForm.provinceId);
        return {
            ...nextForm,
            provinceName: provinces.find((p) => p.id === nextForm.provinceId)?.ten || '',
            wardName: nextWards.find((w) => w.id === nextForm.wardId)?.ten || '',
        };
    };

    const updateField = (field, value) => {
        setForm((prev) => {
            const next = { ...prev, [field]: value };

            if (field === 'provinceId') {
                next.wardId = '';
            }

            onChange?.(buildPayload(next));
            return next;
        });
    };

    return (
        <div className="address-form">
            <p className="address-form__hint">
                Chọn Tỉnh/Thành phố và Phường/Xã, sau đó nhập số nhà và tên đường.
            </p>

            <div className="account-settings__field">
                <label htmlFor="address-form-province">Tỉnh / Thành phố</label>
                <select
                    id="address-form-province"
                    value={form.provinceId}
                    onChange={(e) => updateField('provinceId', e.target.value)}
                >
                    <option value="">— Chọn Tỉnh / Thành phố —</option>
                    {provinces.map((province) => (
                        <option key={province.id} value={province.id}>
                            {province.ten}
                        </option>
                    ))}
                </select>
            </div>

            <div className="account-settings__field">
                <label htmlFor="address-form-ward">Phường / Xã</label>
                <select
                    id="address-form-ward"
                    value={form.wardId}
                    disabled={!form.provinceId}
                    onChange={(e) => updateField('wardId', e.target.value)}
                >
                    <option value="">— Chọn Phường / Xã —</option>
                    {wards.map((ward) => (
                        <option key={ward.id} value={ward.id}>
                            {ward.ten}
                        </option>
                    ))}
                </select>
            </div>

            <div className="account-settings__field">
                <label htmlFor="address-form-detail">Địa chỉ chi tiết</label>
                <input
                    id="address-form-detail"
                    type="text"
                    placeholder="Số nhà, tên đường, tòa nhà..."
                    value={form.detailAddress}
                    onChange={(e) => updateField('detailAddress', e.target.value)}
                />
            </div>
        </div>
    );
};

export default AddressForm;
