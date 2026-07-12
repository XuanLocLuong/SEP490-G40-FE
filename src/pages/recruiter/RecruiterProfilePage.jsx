import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import EditFieldModal from '../../components/common/EditFieldModal.jsx';
import { PencilIcon } from '../../components/common/icons.jsx';
import recruiterProfileApi, { getApiErrorMessage } from '../../apis/RecruiterProfileApi.jsx';
import locationApi, { getLocationApiErrorMessage } from '../../apis/LocationApi.jsx';
import {
    AddressForm,
    LocationPicker,
    buildFullAddress,
    findProvinceByName,
    findWardByName,
} from '../../modules/location/index.js';
import { useAuth } from '../../contexts/authContext.js';
import '../../assets/styles/AccountSettingsStyle.css';
import '../../assets/styles/RecruiterProfileStyle.css';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_GALLERY = 8;

const BUSINESS_TYPE_OPTIONS = [
    'Công ty TNHH',
    'Công ty cổ phần',
    'Doanh nghiệp tư nhân',
    'Startup',
    'Tập đoàn',
    'Khác',
];

const emptyProfile = () => ({
    businessName: '',
    description: '',
    websiteUrl: '',
    businessType: '',
    email: '',
    logoUrl: null,
    galleryImages: [],
    completionRate: 0,
    averageRating: 0,
    totalReviews: 0,
    verificationStatus: null,
});

const mapProfileFromApi = (data) => ({
    businessId: data?.businessId,
    businessName: data?.businessName || '',
    description: data?.description || '',
    websiteUrl: data?.websiteUrl || '',
    businessType: data?.businessType || '',
    email: data?.email || '',
    logoUrl: data?.logoUrl || null,
    galleryImages: data?.galleryImages || [],
    completionRate: data?.completionRate ?? 0,
    averageRating: data?.averageRating ?? 0,
    totalReviews: data?.totalReviews ?? 0,
    verificationStatus: data?.verificationStatus || null,
});

const buildUpdatePayload = (profile) => ({
    businessName: profile.businessName.trim(),
    description: profile.description?.trim() || null,
    websiteUrl: profile.websiteUrl?.trim() || null,
    businessType: profile.businessType?.trim() || null,
});

const RecruiterProfilePage = () => {
    const { auth } = useAuth();
    const logoInputRef = useRef(null);
    const galleryInputRef = useRef(null);

    const [profile, setProfile] = useState(emptyProfile);
    const [loading, setLoading] = useState(true);
    const [noProfile, setNoProfile] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [editModal, setEditModal] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [saving, setSaving] = useState(false);
    const [logoLoading, setLogoLoading] = useState(false);
    const [galleryLoading, setGalleryLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createForm, setCreateForm] = useState({
        businessName: '',
        description: '',
        websiteUrl: '',
        businessType: '',
        taxCode: '',
        legalRepresentativeName: '',
        email: auth?.email || '',
    });

    const [savedLocation, setSavedLocation] = useState(null);
    const [addressInitial, setAddressInitial] = useState(null);
    const [addressFormKey, setAddressFormKey] = useState('new');
    const [addressData, setAddressData] = useState({});
    const [coords, setCoords] = useState(null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationSaving, setLocationSaving] = useState(false);

    const handleAddressChange = useCallback((data) => {
        setAddressData(data);
    }, []);

    const handleCoordsChange = useCallback((data) => {
        setCoords(data);
    }, []);

    const searchQuery = useMemo(
        () =>
            buildFullAddress({
                detailAddress: addressData.detailAddress,
                wardName: addressData.wardName,
                provinceName: addressData.provinceName,
            }),
        [addressData.detailAddress, addressData.wardName, addressData.provinceName]
    );

    const loadLocation = async () => {
        setLocationLoading(true);

        try {
            const list = await locationApi.getMyLocations();
            const loc = Array.isArray(list) ? list[0] : null;

            if (loc) {
                setSavedLocation(loc);
                const province = findProvinceByName(loc.city);
                const ward = province ? findWardByName(province.id, loc.district) : null;

                const initial = {
                    provinceId: province?.id || '',
                    wardId: ward?.id || '',
                    detailAddress: loc.address || '',
                    provinceName: province?.ten || loc.city || '',
                    wardName: ward?.ten || loc.district || '',
                };

                setAddressInitial(initial);
                setAddressData(initial);
                setAddressFormKey(String(loc.id));

                if (loc.latitude != null && loc.longitude != null) {
                    setCoords({
                        latitude: Number(loc.latitude),
                        longitude: Number(loc.longitude),
                    });
                } else {
                    setCoords(null);
                }
            } else {
                setSavedLocation(null);
                const initial = {
                    provinceId: '',
                    wardId: '',
                    detailAddress: '',
                    provinceName: '',
                    wardName: '',
                };
                setAddressInitial(initial);
                setAddressData(initial);
                setAddressFormKey('new');
                setCoords(null);
            }
        } catch (err) {
            if (err.response?.status !== 404) {
                setError(getLocationApiErrorMessage(err, 'Không thể tải địa chỉ cơ sở.'));
            }
        } finally {
            setLocationLoading(false);
        }
    };

    const loadProfile = async () => {
        setLoading(true);
        setError('');

        try {
            const data = await recruiterProfileApi.getProfile();
            const mapped = mapProfileFromApi(data);
            setProfile(mapped);
            setNoProfile(false);
            await loadLocation();
        } catch (err) {
            if (err.response?.status === 404) {
                setNoProfile(true);
                setCreateForm((prev) => ({ ...prev, email: auth?.email || prev.email }));
            } else {
                setError(getApiErrorMessage(err, 'Không thể tải hồ sơ nhà tuyển dụng.'));
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    const openEditModal = (field) => {
        setMessage('');
        setError('');
        setEditModal(field);
        setEditValue('');
    };

    const closeEditModal = () => {
        setEditModal(null);
        setEditValue('');
    };

    const saveProfileUpdate = async (nextProfile) => {
        const payload = buildUpdatePayload(nextProfile);
        const updated = await recruiterProfileApi.updateProfile(payload);
        setProfile(mapProfileFromApi(updated));
        setMessage('Đã cập nhật hồ sơ doanh nghiệp.');
    };

    const handleModalSave = async () => {
        setMessage('');
        setError('');
        const normalized = editValue.trim();

        if (editModal === 'businessName') {
            if (!normalized) {
                setError('Tên doanh nghiệp không được để trống.');
                return;
            }
        }

        if (editModal === 'websiteUrl' && normalized) {
            try {
                new URL(normalized);
            } catch {
                setError('Đường dẫn website không hợp lệ.');
                return;
            }
        }

        setSaving(true);

        try {
            const nextProfile = {
                ...profile,
                [editModal]: normalized,
            };
            await saveProfileUpdate(nextProfile);
            closeEditModal();
        } catch (err) {
            setError(getApiErrorMessage(err, 'Không thể cập nhật hồ sơ.'));
        } finally {
            setSaving(false);
        }
    };

    const handleCreateProfile = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        const businessName = createForm.businessName.trim();
        if (!businessName) {
            setError('Tên doanh nghiệp không được để trống.');
            return;
        }

        if (createForm.websiteUrl?.trim()) {
            try {
                new URL(createForm.websiteUrl.trim());
            } catch {
                setError('Đường dẫn website không hợp lệ.');
                return;
            }
        }

        setCreating(true);

        try {
            const payload = {
                businessName,
                description: createForm.description?.trim() || null,
                websiteUrl: createForm.websiteUrl?.trim() || null,
                businessType: createForm.businessType?.trim() || null,
                taxCode: createForm.taxCode?.trim() || null,
                legalRepresentativeName: createForm.legalRepresentativeName?.trim() || null,
                email: createForm.email?.trim() || null,
            };

            const data = await recruiterProfileApi.createProfile(payload);
            const mapped = mapProfileFromApi(data);
            setProfile(mapped);
            setNoProfile(false);
            setMessage('Đã tạo hồ sơ doanh nghiệp.');
            await loadLocation();
        } catch (err) {
            setError(getApiErrorMessage(err, 'Không thể tạo hồ sơ doanh nghiệp.'));
        } finally {
            setCreating(false);
        }
    };

    const handleLogoSelect = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Vui lòng chọn file hình ảnh.');
            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
            setError('Ảnh vượt quá 10MB.');
            return;
        }

        setMessage('');
        setError('');
        setLogoLoading(true);

        try {
            const result = await recruiterProfileApi.uploadLogo(file);
            setProfile((prev) => ({ ...prev, logoUrl: result?.url || result?.logoUrl || null }));
            setMessage('Đã cập nhật logo.');
            await loadProfile();
        } catch (err) {
            setError(getApiErrorMessage(err, 'Không thể tải logo lên.'));
        } finally {
            setLogoLoading(false);
        }
    };

    const handleDeleteLogo = async () => {
        setMessage('');
        setError('');
        setLogoLoading(true);

        try {
            await recruiterProfileApi.deleteLogo();
            setProfile((prev) => ({ ...prev, logoUrl: null }));
            setMessage('Đã xóa logo.');
        } catch (err) {
            setError(getApiErrorMessage(err, 'Không thể xóa logo.'));
        } finally {
            setLogoLoading(false);
        }
    };

    const handleGallerySelect = async (e) => {
        const files = Array.from(e.target.files || []);
        e.target.value = '';
        if (!files.length) return;

        const currentCount = profile.galleryImages?.length || 0;
        if (currentCount + files.length > MAX_GALLERY) {
            setError(`Bộ sưu tập tối đa ${MAX_GALLERY} ảnh.`);
            return;
        }

        for (const file of files) {
            if (!file.type.startsWith('image/')) {
                setError('Chỉ chấp nhận file hình ảnh.');
                return;
            }
            if (file.size > MAX_IMAGE_SIZE) {
                setError('Mỗi ảnh tối đa 10MB.');
                return;
            }
        }

        setMessage('');
        setError('');
        setGalleryLoading(true);

        try {
            await recruiterProfileApi.uploadGallery(files);
            setMessage('Đã thêm ảnh vào bộ sưu tập.');
            await loadProfile();
        } catch (err) {
            setError(getApiErrorMessage(err, 'Không thể tải ảnh lên.'));
        } finally {
            setGalleryLoading(false);
        }
    };

    const handleDeleteGalleryImage = async (imageId) => {
        setMessage('');
        setError('');
        setGalleryLoading(true);

        try {
            await recruiterProfileApi.deleteGalleryImage(imageId);
            setProfile((prev) => ({
                ...prev,
                galleryImages: prev.galleryImages.filter((img) => img.id !== imageId),
            }));
            setMessage('Đã xóa ảnh.');
        } catch (err) {
            setError(getApiErrorMessage(err, 'Không thể xóa ảnh.'));
        } finally {
            setGalleryLoading(false);
        }
    };

    const handleSaveLocation = async () => {
        setMessage('');
        setError('');

        if (!addressData.provinceId || !addressData.wardId) {
            setError('Vui lòng chọn Tỉnh/Thành phố và Phường/Xã.');
            return;
        }

        if (!addressData.detailAddress?.trim()) {
            setError('Vui lòng nhập địa chỉ chi tiết (số nhà, tên đường).');
            return;
        }

        const payload = {
            name: profile.businessName.trim(),
            address: addressData.detailAddress.trim(),
            city: addressData.provinceName,
            district: addressData.wardName,
            latitude: coords?.latitude ?? null,
            longitude: coords?.longitude ?? null,
        };

        setLocationSaving(true);

        try {
            if (savedLocation?.id) {
                await locationApi.updateLocation(savedLocation.id, payload);
            } else {
                const created = await locationApi.createLocation(payload);
                setSavedLocation(created);
                setAddressFormKey(String(created.id));
            }

            setMessage('Đã lưu địa chỉ cơ sở.');
            await loadProfile();
        } catch (err) {
            setError(getLocationApiErrorMessage(err, 'Không thể lưu địa chỉ cơ sở.'));
        } finally {
            setLocationSaving(false);
        }
    };

    const galleryCount = profile.galleryImages?.length || 0;
    const canAddGallery = galleryCount < MAX_GALLERY;

    return (
        <div className="account-settings-page">
            <header className="account-settings__header">
                <h1>Hồ sơ nhà tuyển dụng</h1>
                <p>Quản lý thông tin doanh nghiệp hiển thị với ứng viên.</p>
            </header>

            {message && <div className="account-settings__message">{message}</div>}
            {error && <div className="account-settings__error">{error}</div>}

            {loading ? (
                    <div className="account-settings__loading">Đang tải hồ sơ...</div>
                ) : noProfile ? (
                    <div className="account-settings__card">
                        <h2>Tạo hồ sơ doanh nghiệp</h2>
                        <p className="account-settings__hint">
                            Bạn chưa có hồ sơ doanh nghiệp. Điền thông tin bên dưới để bắt đầu.
                        </p>

                        <form className="recruiter-profile__create-form" onSubmit={handleCreateProfile}>
                            <div className="account-settings__field">
                                <label htmlFor="create-business-name">Tên doanh nghiệp *</label>
                                <input
                                    id="create-business-name"
                                    value={createForm.businessName}
                                    onChange={(e) =>
                                        setCreateForm((prev) => ({
                                            ...prev,
                                            businessName: e.target.value,
                                        }))
                                    }
                                    placeholder="Nhập tên công ty / doanh nghiệp"
                                />
                            </div>

                            <div className="account-settings__field">
                                <label htmlFor="create-description">Mô tả</label>
                                <textarea
                                    id="create-description"
                                    rows={4}
                                    value={createForm.description}
                                    onChange={(e) =>
                                        setCreateForm((prev) => ({
                                            ...prev,
                                            description: e.target.value,
                                        }))
                                    }
                                    placeholder="Giới thiệu ngắn về doanh nghiệp"
                                />
                            </div>

                            <div className="account-settings__field">
                                <label htmlFor="create-website">Website</label>
                                <input
                                    id="create-website"
                                    type="url"
                                    value={createForm.websiteUrl}
                                    onChange={(e) =>
                                        setCreateForm((prev) => ({
                                            ...prev,
                                            websiteUrl: e.target.value,
                                        }))
                                    }
                                    placeholder="https://example.com"
                                />
                            </div>

                            <div className="account-settings__field">
                                <label htmlFor="create-business-type">Loại hình kinh doanh</label>
                                <select
                                    id="create-business-type"
                                    value={createForm.businessType}
                                    onChange={(e) =>
                                        setCreateForm((prev) => ({
                                            ...prev,
                                            businessType: e.target.value,
                                        }))
                                    }
                                >
                                    <option value="">— Chọn loại hình —</option>
                                    {BUSINESS_TYPE_OPTIONS.map((opt) => (
                                        <option key={opt} value={opt}>
                                            {opt}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="account-settings__field">
                                <label htmlFor="create-email">Email doanh nghiệp</label>
                                <input
                                    id="create-email"
                                    type="email"
                                    value={createForm.email}
                                    onChange={(e) =>
                                        setCreateForm((prev) => ({ ...prev, email: e.target.value }))
                                    }
                                />
                            </div>

                            <div className="account-settings__field">
                                <label htmlFor="create-tax">Mã số thuế</label>
                                <input
                                    id="create-tax"
                                    value={createForm.taxCode}
                                    onChange={(e) =>
                                        setCreateForm((prev) => ({ ...prev, taxCode: e.target.value }))
                                    }
                                />
                            </div>

                            <div className="account-settings__field">
                                <label htmlFor="create-legal">Người đại diện pháp luật</label>
                                <input
                                    id="create-legal"
                                    value={createForm.legalRepresentativeName}
                                    onChange={(e) =>
                                        setCreateForm((prev) => ({
                                            ...prev,
                                            legalRepresentativeName: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <button
                                type="submit"
                                className="account-settings__btn account-settings__btn--primary"
                                disabled={creating}
                            >
                                {creating ? 'Đang tạo...' : 'Tạo hồ sơ'}
                            </button>
                        </form>
                    </div>
                ) : (
                    <>
                        <div className="recruiter-profile__stats">
                            <div className="recruiter-profile__stat">
                                <p className="recruiter-profile__stat-value">
                                    {profile.completionRate}%
                                </p>
                                <p className="recruiter-profile__stat-label">Hoàn thiện hồ sơ</p>
                                <div className="recruiter-profile__completion-bar">
                                    <div
                                        className="recruiter-profile__completion-fill"
                                        style={{ width: `${profile.completionRate}%` }}
                                    />
                                </div>
                            </div>
                            <div className="recruiter-profile__stat">
                                <p className="recruiter-profile__stat-value">
                                    {profile.averageRating.toFixed(1)}
                                </p>
                                <p className="recruiter-profile__stat-label">Điểm đánh giá</p>
                            </div>
                            <div className="recruiter-profile__stat">
                                <p className="recruiter-profile__stat-value">{profile.totalReviews}</p>
                                <p className="recruiter-profile__stat-label">Lượt đánh giá</p>
                            </div>
                        </div>

                        <div className="account-settings__card">
                            <div className="account-settings__avatar-block">
                                {profile.logoUrl ? (
                                    <img
                                        src={profile.logoUrl}
                                        alt={`Logo ${profile.businessName}`}
                                        className="recruiter-profile__logo"
                                    />
                                ) : (
                                    <div className="recruiter-profile__logo recruiter-profile__logo--placeholder">
                                        Chưa có logo
                                    </div>
                                )}
                                <div>
                                    <div className="account-settings__avatar-actions">
                                        <label className="account-settings__file-btn">
                                            {logoLoading ? 'Đang xử lý...' : 'Chọn logo'}
                                            <input
                                                ref={logoInputRef}
                                                type="file"
                                                accept="image/*"
                                                hidden
                                                disabled={logoLoading}
                                                onChange={handleLogoSelect}
                                            />
                                        </label>
                                        {profile.logoUrl && (
                                            <button
                                                type="button"
                                                className="account-settings__btn account-settings__btn--ghost"
                                                disabled={logoLoading}
                                                onClick={handleDeleteLogo}
                                            >
                                                Xóa logo
                                            </button>
                                        )}
                                    </div>
                                    <div className="recruiter-profile__logo-intro">
                                        <p className="account-settings__hint">
                                            Tối đa 10MB.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="account-settings__info-row">
                                <div>
                                    <p className="account-settings__info-label">Tên doanh nghiệp</p>
                                    <p className="account-settings__info-value">
                                        {profile.businessName || '—'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="account-settings__edit-btn"
                                    onClick={() => openEditModal('businessName')}
                                >
                                    <PencilIcon width={16} height={16} />
                                    Sửa
                                </button>
                            </div>

                            <div className="account-settings__info-row">
                                <div>
                                    <p className="account-settings__info-label">Loại hình kinh doanh</p>
                                    <p className="account-settings__info-value">
                                        {profile.businessType || '—'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="account-settings__edit-btn"
                                    onClick={() => openEditModal('businessType')}
                                >
                                    <PencilIcon width={16} height={16} />
                                    Sửa
                                </button>
                            </div>

                            <div className="account-settings__info-row">
                                <div>
                                    <p className="account-settings__info-label">Mô tả</p>
                                    <p className="account-settings__info-value">
                                        {profile.description || '—'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="account-settings__edit-btn"
                                    onClick={() => openEditModal('description')}
                                >
                                    <PencilIcon width={16} height={16} />
                                    Sửa
                                </button>
                            </div>

                            <div className="account-settings__info-row">
                                <div>
                                    <p className="account-settings__info-label">Website</p>
                                    <p className="account-settings__info-value">
                                        {profile.websiteUrl || '—'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="account-settings__edit-btn"
                                    onClick={() => openEditModal('websiteUrl')}
                                >
                                    <PencilIcon width={16} height={16} />
                                    Sửa
                                </button>
                            </div>
                        </div>

                        <div className="account-settings__card recruiter-profile__location-card">
                            <h2>Địa chỉ cơ sở</h2>

                            {locationLoading || !addressInitial ? (
                                <div className="account-settings__loading">Đang tải địa chỉ...</div>
                            ) : (
                                <>
                                    <AddressForm
                                        key={addressFormKey}
                                        initialValues={addressInitial}
                                        onChange={handleAddressChange}
                                    />

                                    <LocationPicker
                                        searchQuery={searchQuery}
                                        initialLocation={coords}
                                        onLocationChange={handleCoordsChange}
                                    />

                                    {!coords && (
                                        <p className="account-settings__hint">
                                            Chưa có tọa độ trên bản đồ. Bạn vẫn có thể lưu địa chỉ text; nên
                                            bấm &quot;Xác nhận địa chỉ&quot; để ứng viên tìm việc gần chính xác hơn.
                                        </p>
                                    )}

                                    <button
                                        type="button"
                                        className="account-settings__btn account-settings__btn--primary recruiter-profile__location-save"
                                        disabled={locationSaving}
                                        onClick={handleSaveLocation}
                                    >
                                        {locationSaving ? 'Đang lưu...' : 'Cập nhật địa chỉ'}
                                    </button>
                                </>
                            )}
                        </div>

                        <div className="account-settings__card">
                            <h2>Ảnh cửa hàng / sản phẩm</h2>
                            <div className="recruiter-profile__gallery-intro">
                                <p className="account-settings__hint">
                                    Tải lên hình ảnh cửa hàng và sản phẩm kinh doanh để ứng viên hiểu rõ hơn về
                                    doanh nghiệp của bạn.
                                </p>
                                <p className="account-settings__hint">
                                    Tối đa {MAX_GALLERY} ảnh, mỗi ảnh tối đa 10MB. ({galleryCount}/{MAX_GALLERY})
                                </p>
                            </div>

                            {canAddGallery && (
                                <label className="account-settings__file-btn recruiter-profile__gallery-upload">
                                    {galleryLoading ? 'Đang xử lý...' : 'Thêm ảnh'}
                                    <input
                                        ref={galleryInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        hidden
                                        disabled={galleryLoading}
                                        onChange={handleGallerySelect}
                                    />
                                </label>
                            )}

                            {galleryCount > 0 && (
                                <div className="recruiter-profile__gallery-grid">
                                    {profile.galleryImages.map((img) => (
                                        <div key={img.id} className="recruiter-profile__gallery-item">
                                            <img src={img.fileUrl} alt="Ảnh cửa hàng hoặc sản phẩm" />
                                            <button
                                                type="button"
                                                className="recruiter-profile__gallery-delete"
                                                disabled={galleryLoading}
                                                aria-label="Xóa ảnh"
                                                onClick={() => handleDeleteGalleryImage(img.id)}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
            )}

            <EditFieldModal
                open={editModal === 'businessName'}
                title="Thay đổi tên doanh nghiệp"
                currentLabel="Tên hiện tại"
                currentValue={profile.businessName}
                newLabel="Tên mới"
                newValue={editValue}
                onNewValueChange={setEditValue}
                placeholder="Nhập tên doanh nghiệp"
                saving={saving}
                onClose={closeEditModal}
                onSave={handleModalSave}
            />

            <EditFieldModal
                open={editModal === 'businessType'}
                title="Thay đổi loại hình kinh doanh"
                currentLabel="Loại hình hiện tại"
                currentValue={profile.businessType}
                newLabel="Loại hình mới"
                newValue={editValue}
                onNewValueChange={setEditValue}
                placeholder="VD: Công ty TNHH"
                saving={saving}
                onClose={closeEditModal}
                onSave={handleModalSave}
            />

            <EditFieldModal
                open={editModal === 'description'}
                title="Thay đổi mô tả"
                currentLabel="Mô tả hiện tại"
                currentValue={profile.description}
                newLabel="Mô tả mới"
                newValue={editValue}
                onNewValueChange={setEditValue}
                placeholder="Giới thiệu về doanh nghiệp"
                multiline
                saving={saving}
                onClose={closeEditModal}
                onSave={handleModalSave}
            />

            <EditFieldModal
                open={editModal === 'websiteUrl'}
                title="Thay đổi website"
                currentLabel="Website hiện tại"
                currentValue={profile.websiteUrl}
                newLabel="Website mới"
                newValue={editValue}
                onNewValueChange={setEditValue}
                placeholder="https://example.com"
                inputType="url"
                saving={saving}
                onClose={closeEditModal}
                onSave={handleModalSave}
            />
        </div>
    );
};

export default RecruiterProfilePage;
