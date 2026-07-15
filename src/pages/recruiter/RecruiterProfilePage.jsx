import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import {
    BuildingIcon,
    CheckCircleIcon,
    ClockIcon,
    GlobeIcon,
    ImagePlusIcon,
    MailIcon,
    MapPinIcon,
    PhoneIcon,
    StarIcon,
} from '../../components/common/icons.jsx';
import recruiterProfileApi, { getApiErrorMessage } from '../../apis/RecruiterProfileApi.jsx';
import locationApi, { getLocationApiErrorMessage } from '../../apis/LocationApi.jsx';
import userApi from '../../apis/UserApi.jsx';
import {
    getProvinces,
    getWardsByProvince,
    findProvinceByName,
    findWardByName,
    resolveAdminFromCoordinates,
    getGeolocationErrorMessage,
} from '../../modules/location/index.js';
import { useAuth } from '../../contexts/authContext.js';
import '../../assets/styles/AccountSettingsStyle.css';
import '../../assets/styles/RecruiterProfileStyle.css';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_GALLERY = 8;
const PHONE_PATTERN = /^(\+84|0)[35789][0-9]{8}$/;

const hasLogo = (url) => Boolean(url?.trim());

const BUSINESS_TYPE_OPTIONS = [
    'Công ty TNHH',
    'Công ty cổ phần',
    'Doanh nghiệp tư nhân',
    'Hộ kinh doanh',
    'Startup',
    'Tập đoàn',
    'F&B (Dịch vụ ăn uống)',
    'Khác',
];

const emptyProfile = () => ({
    businessName: '',
    description: '',
    websiteUrl: '',
    businessType: '',
    phone: '',
    email: '',
    logoUrl: null,
    galleryImages: [],
    completionRate: 0,
    averageRating: 0,
    totalReviews: 0,
    completedHiring: 0,
    memberSince: null,
    verificationStatus: null,
    badge: null,
});

const emptyForm = () => ({
    businessName: '',
    businessType: '',
    description: '',
    phone: '',
    email: '',
    websiteUrl: '',
    provinceId: '',
    wardId: '',
    detailAddress: '',
    provinceName: '',
    wardName: '',
});

const mapProfileFromApi = (data) => ({
    businessId: data?.businessId,
    businessName: data?.businessName || '',
    description: data?.description || '',
    websiteUrl: data?.websiteUrl || '',
    businessType: data?.businessType || '',
    phone: data?.phone || '',
    email: data?.email || '',
    logoUrl: data?.logoUrl || null,
    galleryImages: data?.galleryImages || [],
    completionRate: data?.completionRate ?? 0,
    averageRating: data?.averageRating ?? 0,
    totalReviews: data?.totalReviews ?? 0,
    completedHiring: data?.completedHiring ?? 0,
    memberSince: data?.memberSince || null,
    verificationStatus: data?.verificationStatus || null,
    badge: data?.badge || null,
});

const buildUpdatePayload = (form, businessId) => ({
    businessId,
    businessName: form.businessName.trim(),
    description: form.description?.trim() || null,
    phone: form.phone?.trim() || null,
    email: form.email?.trim() || null,
    websiteUrl: form.websiteUrl?.trim() || null,
    businessType: form.businessType?.trim() || null,
});

const formatMemberSince = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${month}/${date.getFullYear()}`;
};

const isVerified = (status) =>
    status === 'BUSSINESS_PASSED' ||
    status === 'CCCD_PASSED' ||
    status === 'FACE_PASSED' ||
    status === 'BUSSINESS_MANUALLY' ||
    status === 'CCCD_MANUALLY';

const RecruiterProfilePage = () => {
    const { auth } = useAuth();
    const logoInputRef = useRef(null);
    const galleryInputRef = useRef(null);
    const provinces = useMemo(() => getProvinces(), []);

    const [profile, setProfile] = useState(emptyProfile);
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(true);
    const [noProfile, setNoProfile] = useState(false);
    const [saving, setSaving] = useState(false);
    const [logoLoading, setLogoLoading] = useState(false);
    const [galleryLoading, setGalleryLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('info');
    const [createForm, setCreateForm] = useState({
        businessName: '',
        description: '',
        websiteUrl: '',
        businessType: '',
        taxCode: '',
        legalRepresentativeName: '',
        phone: '',
        email: '',
    });

    const [savedLocation, setSavedLocation] = useState(null);
    const [coords, setCoords] = useState(null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [addressFieldMessage, setAddressFieldMessage] = useState('');

    const wards = useMemo(
        () => getWardsByProvince(form.provinceId),
        [form.provinceId]
    );

    const applyAddressFields = useCallback((addressFields) => {
        setForm((prev) => ({ ...prev, ...addressFields }));
    }, []);

    const loadLocation = async (businessId, businessName) => {
        setLocationLoading(true);

        if (!businessId) {
            setSavedLocation(null);
            setCoords(null);
            applyAddressFields({
                provinceId: '',
                wardId: '',
                detailAddress: '',
                provinceName: '',
                wardName: '',
            });
            setLocationLoading(false);
            return;
        }

        try {
            const list = await locationApi.getMyLocations(businessId);
            const loc = Array.isArray(list) ? list[0] : null;

            if (loc) {
                setSavedLocation(loc);
                const province = findProvinceByName(loc.city);
                const ward = province ? findWardByName(province.id, loc.ward) : null;

                applyAddressFields({
                    provinceId: province?.id || '',
                    wardId: ward?.id || '',
                    detailAddress: loc.address || '',
                    provinceName: province?.ten || loc.city || '',
                    wardName: ward?.ten || loc.ward || '',
                });

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
                setCoords(null);
                applyAddressFields({
                    provinceId: '',
                    wardId: '',
                    detailAddress: '',
                    provinceName: '',
                    wardName: '',
                });
            }
        } catch (err) {
            if (err.response?.status !== 404) {
                toast.error(getLocationApiErrorMessage(err, 'Không thể tải địa chỉ cơ sở.'));
            }
        } finally {
            setLocationLoading(false);
        }

        if (businessName) {
            setForm((prev) => ({ ...prev, businessName }));
        }
    };

    const syncFormFromProfile = (mapped, keepAddress = true) => {
        setForm((prev) => ({
            ...prev,
            businessName: mapped.businessName,
            businessType: mapped.businessType,
            description: mapped.description,
            phone: mapped.phone,
            email: mapped.email,
            websiteUrl: mapped.websiteUrl,
            ...(keepAddress
                ? {}
                : {
                      provinceId: '',
                      wardId: '',
                      detailAddress: '',
                      provinceName: '',
                      wardName: '',
                  }),
        }));
    };

    const getAccountContact = async () => {
        try {
            const user = await userApi.getCurrentUser();
            return {
                email: user?.email || auth?.email || '',
                phone: user?.phone || auth?.phone || '',
            };
        } catch {
            return {
                email: auth?.email || '',
                phone: auth?.phone || '',
            };
        }
    };

    const loadProfile = async () => {
        setLoading(true);
        const accountContact = await getAccountContact();

        try {
            const data = await recruiterProfileApi.getProfile();
            const mapped = mapProfileFromApi(data);
            setProfile(mapped);
            setNoProfile(false);
            syncFormFromProfile({
                ...mapped,
                phone: mapped.phone || accountContact.phone,
                email: mapped.email || accountContact.email,
            });
            await loadLocation(mapped.businessId, mapped.businessName);
        } catch (err) {
            if (err.response?.status === 404) {
                setNoProfile(true);
                setCreateForm((prev) => ({
                    ...prev,
                    phone: prev.phone || accountContact.phone,
                    email: prev.email || accountContact.email,
                }));
            } else {
                toast.error(getApiErrorMessage(err, 'Không thể tải hồ sơ nhà tuyển dụng.'));
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    const updateFormField = (field, value) => {
        if (field === 'detailAddress' && value.trim()) {
            setAddressFieldMessage('');
        }

        setForm((prev) => {
            const next = { ...prev, [field]: value };

            if (field === 'provinceId') {
                const province = provinces.find((p) => p.id === value);
                next.wardId = '';
                next.wardName = '';
                next.provinceName = province?.ten || '';
            }

            if (field === 'wardId') {
                const ward = getWardsByProvince(prev.provinceId).find((w) => w.id === value);
                next.wardName = ward?.ten || '';
            }

            return next;
        });
    };

    const handleGetCurrentLocation = () => {
        if (!window.isSecureContext) {
            toast.error('Geolocation chỉ hoạt động trên HTTPS hoặc localhost.');
            return;
        }
        if (!navigator.geolocation) {
            toast.error('Trình duyệt không hỗ trợ Geolocation.');
            return;
        }

        setGpsLoading(true);
        setAddressFieldMessage('');

        navigator.geolocation.getCurrentPosition(
            async (result) => {
                const latitude = result.coords.latitude;
                const longitude = result.coords.longitude;
                setCoords({ latitude, longitude });
                applyAddressFields({
                    provinceId: '',
                    wardId: '',
                    detailAddress: '',
                    provinceName: '',
                    wardName: '',
                });

                try {
                    const { province, ward } = await resolveAdminFromCoordinates(
                        latitude,
                        longitude
                    );

                    if (province) {
                        applyAddressFields({
                            provinceId: province.id,
                            provinceName: province.ten,
                            wardId: ward?.id || '',
                            wardName: ward?.ten || '',
                        });

                        if (ward) {
                            setAddressFieldMessage(
                                'Vui lòng nhập địa chỉ chi tiết (số nhà, tên đường).'
                            );
                        } else {
                            setAddressFieldMessage(
                                'Vui lòng chọn Phường/Xã và nhập địa chỉ chi tiết.'
                            );
                        }
                    } else {
                        toast.warning(
                            'Không khớp Tỉnh/Phường trong danh mục. Vui lòng chọn thủ công.'
                        );
                    }
                } catch {
                    toast.error('Không thể xác định địa chỉ từ vị trí hiện tại.');
                } finally {
                    setGpsLoading(false);
                }
            },
            (geoError) => {
                toast.error(getGeolocationErrorMessage(geoError.code));
                setGpsLoading(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    const canSave =
        form.businessName.trim() &&
        form.provinceId &&
        form.wardId &&
        form.detailAddress?.trim();

    const handleSaveAll = async () => {
        if (!form.businessName.trim()) {
            toast.error('Tên doanh nghiệp không được để trống.');
            return;
        }

        if (!form.provinceId || !form.wardId) {
            toast.error('Vui lòng chọn Tỉnh/Thành phố và Phường/Xã.');
            return;
        }

        if (!form.detailAddress?.trim()) {
            toast.error('Vui lòng nhập địa chỉ chi tiết (số nhà, tên đường).');
            return;
        }

        if (form.phone?.trim() && !PHONE_PATTERN.test(form.phone.trim())) {
            toast.error('Số điện thoại liên hệ không đúng định dạng Việt Nam.');
            return;
        }

        if (form.websiteUrl?.trim()) {
            try {
                new URL(form.websiteUrl.trim());
            } catch {
                toast.error('Đường dẫn website không hợp lệ.');
                return;
            }
        }

        if (!profile.businessId) {
            toast.error('Chưa có hồ sơ doanh nghiệp.');
            return;
        }

        setSaving(true);

        try {
            const updated = await recruiterProfileApi.updateProfile(
                buildUpdatePayload(form, profile.businessId)
            );
            setProfile(mapProfileFromApi(updated));
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Không thể cập nhật hồ sơ doanh nghiệp.'));
            setSaving(false);
            return;
        }

        try {
            const locationPayload = {
                name: form.businessName.trim(),
                address: form.detailAddress.trim(),
                city: form.provinceName,
                ward: form.wardName,
                latitude: coords?.latitude ?? null,
                longitude: coords?.longitude ?? null,
            };

            if (savedLocation?.id) {
                await locationApi.updateLocation(
                    profile.businessId,
                    savedLocation.id,
                    locationPayload
                );
            } else {
                const created = await locationApi.createLocation(
                    profile.businessId,
                    locationPayload
                );
                setSavedLocation(created);
            }

            toast.success('Đã lưu thay đổi.');
        } catch (err) {
            toast.error(getLocationApiErrorMessage(err, 'Không thể lưu địa chỉ cơ sở.'));
        } finally {
            setSaving(false);
        }
    };

    const handleCreateProfile = async (e) => {
        e.preventDefault();

        const businessName = createForm.businessName.trim();
        if (!businessName) {
            toast.error('Tên doanh nghiệp không được để trống.');
            return;
        }

        if (createForm.phone?.trim() && !PHONE_PATTERN.test(createForm.phone.trim())) {
            toast.error('Số điện thoại không đúng định dạng Việt Nam.');
            return;
        }

        if (createForm.websiteUrl?.trim()) {
            try {
                new URL(createForm.websiteUrl.trim());
            } catch {
                toast.error('Đường dẫn website không hợp lệ.');
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
                phone: createForm.phone?.trim() || null,
            };

            const data = await recruiterProfileApi.createProfile(payload);
            const mapped = mapProfileFromApi(data);
            setProfile(mapped);
            setNoProfile(false);
            syncFormFromProfile(mapped, false);
            toast.success('Đã tạo hồ sơ doanh nghiệp.');
            await loadLocation(mapped.businessId, mapped.businessName);
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Không thể tạo hồ sơ doanh nghiệp.'));
        } finally {
            setCreating(false);
        }
    };

    const handleLogoSelect = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Vui lòng chọn file hình ảnh.');
            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
            toast.error('Ảnh vượt quá 10MB.');
            return;
        }

        setLogoLoading(true);

        try {
            if (!profile.businessId) {
                toast.error('Chưa có hồ sơ doanh nghiệp.');
                return;
            }

            const result = await recruiterProfileApi.uploadLogo(profile.businessId, file);
            setProfile((prev) => ({ ...prev, logoUrl: result?.url || result?.logoUrl || null }));
            toast.success('Đã cập nhật logo.');
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Không thể tải logo lên.'));
        } finally {
            setLogoLoading(false);
        }
    };

    const handleDeleteLogo = async () => {
        if (!hasLogo(profile.logoUrl)) return;

        setLogoLoading(true);

        try {
            if (!profile.businessId) {
                toast.error('Chưa có hồ sơ doanh nghiệp.');
                return;
            }

            await recruiterProfileApi.deleteLogo(profile.businessId);
            setProfile((prev) => ({ ...prev, logoUrl: null }));
            toast.success('Đã xóa logo.');
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Không thể xóa logo.'));
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
            toast.error(`Bộ sưu tập tối đa ${MAX_GALLERY} ảnh.`);
            return;
        }

        for (const file of files) {
            if (!file.type.startsWith('image/')) {
                toast.error('Chỉ chấp nhận file hình ảnh.');
                return;
            }
            if (file.size > MAX_IMAGE_SIZE) {
                toast.error('Mỗi ảnh tối đa 10MB.');
                return;
            }
        }

        setGalleryLoading(true);

        try {
            if (!profile.businessId) {
                toast.error('Chưa có hồ sơ doanh nghiệp.');
                return;
            }

            await recruiterProfileApi.uploadGallery(profile.businessId, files);
            toast.success('Đã thêm ảnh vào bộ sưu tập.');
            await loadProfile();
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Không thể tải ảnh lên.'));
        } finally {
            setGalleryLoading(false);
        }
    };

    const handleDeleteGalleryImage = async (imageId) => {
        setGalleryLoading(true);

        try {
            await recruiterProfileApi.deleteGalleryImage(imageId);
            setProfile((prev) => ({
                ...prev,
                galleryImages: prev.galleryImages.filter((img) => img.id !== imageId),
            }));
            toast.success('Đã xóa ảnh.');
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Không thể xóa ảnh.'));
        } finally {
            setGalleryLoading(false);
        }
    };

    const galleryCount = profile.galleryImages?.length || 0;
    const canAddGallery = galleryCount < MAX_GALLERY;

    return (
        <div className="recruiter-profile-page">
            {loading ? (
                <div className="account-settings__loading">Đang tải hồ sơ...</div>
            ) : noProfile ? (
                <div className="account-settings__card recruiter-profile__create-card">
                    <h2>Tạo hồ sơ doanh nghiệp</h2>
                    <p className="account-settings__hint">
                        Bạn chưa có hồ sơ doanh nghiệp. Thông tin liên hệ được điền sẵn từ tài
                        khoản — có thể chỉnh trước khi tạo.
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
                            <label htmlFor="create-phone">Số điện thoại liên hệ</label>
                            <input
                                id="create-phone"
                                type="tel"
                                value={createForm.phone}
                                onChange={(e) =>
                                    setCreateForm((prev) => ({ ...prev, phone: e.target.value }))
                                }
                                placeholder="0xxxxxxxxx"
                            />
                        </div>

                        <div className="account-settings__field">
                            <label htmlFor="create-email">Email tuyển dụng</label>
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
                    <section className="recruiter-profile__hero">
                        <div className="recruiter-profile__hero-logo">
                            <div
                                className={`account-settings__avatar-picker${
                                    hasLogo(profile.logoUrl)
                                        ? ' account-settings__avatar-picker--deletable'
                                        : ''
                                }`}
                            >
                                {hasLogo(profile.logoUrl) ? (
                                    <img
                                        src={profile.logoUrl}
                                        alt={`Logo ${profile.businessName}`}
                                        className="recruiter-profile__logo recruiter-profile__logo--image"
                                    />
                                ) : (
                                    <div className="recruiter-profile__logo recruiter-profile__logo--placeholder">
                                        <BuildingIcon width={32} height={32} />
                                    </div>
                                )}
                                {hasLogo(profile.logoUrl) && (
                                    <button
                                        type="button"
                                        className="account-settings__avatar-delete"
                                        aria-label="Xóa logo"
                                        onClick={handleDeleteLogo}
                                        disabled={logoLoading}
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                            <label
                                className={`recruiter-profile__logo-change${
                                    logoLoading ? ' recruiter-profile__logo-change--disabled' : ''
                                }`}
                            >
                                {logoLoading ? 'Đang xử lý...' : 'Thay đổi logo'}
                                <input
                                    ref={logoInputRef}
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    disabled={logoLoading}
                                    onChange={handleLogoSelect}
                                />
                            </label>
                        </div>

                        <div className="recruiter-profile__hero-main">
                            <div className="recruiter-profile__hero-title-row">
                                <h1>{profile.businessName || 'Doanh nghiệp'}</h1>
                                {profile.businessType && (
                                    <span className="recruiter-profile__badge recruiter-profile__badge--muted">
                                        {profile.businessType}
                                    </span>
                                )}
                                {isVerified(profile.verificationStatus) && (
                                    <span className="recruiter-profile__badge recruiter-profile__badge--verified">
                                        <CheckCircleIcon width={14} height={14} />
                                        Đã xác thực
                                    </span>
                                )}
                            </div>

                            <div className="recruiter-profile__hero-meta">
                                <span className="recruiter-profile__rating">
                                    <StarIcon width={16} height={16} />
                                    {profile.averageRating.toFixed(1)} ({profile.totalReviews}{' '}
                                    lượt đánh giá)
                                </span>
                                {profile.badge &&
                                    (profile.badge === 'BUSSINESS_VERIFYED' ||
                                        profile.badge === 'IDENTITY_VERIFYED') && (
                                    <span className="recruiter-profile__trust-badge">
                                        <MapPinIcon width={14} height={14} />
                                        Nhà tuyển dụng uy tín
                                    </span>
                                )}
                            </div>

                            <div className="recruiter-profile__hero-stats">
                                <div className="recruiter-profile__hero-stat">
                                    <strong>{profile.completedHiring}</strong>
                                    <span>Lần tuyển thành công</span>
                                </div>
                                <div className="recruiter-profile__hero-stat">
                                    <strong>{profile.completionRate}%</strong>
                                    <span>Tỷ lệ hoàn thành</span>
                                </div>
                                <div className="recruiter-profile__hero-stat">
                                    <strong>
                                        <ClockIcon width={14} height={14} />
                                        {formatMemberSince(profile.memberSince)}
                                    </strong>
                                    <span>Thành viên từ</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <nav className="recruiter-profile__tabs" aria-label="Hồ sơ doanh nghiệp">
                        <button
                            type="button"
                            className={`recruiter-profile__tab${
                                activeTab === 'info' ? ' recruiter-profile__tab--active' : ''
                            }`}
                            onClick={() => setActiveTab('info')}
                        >
                            Thông tin doanh nghiệp
                        </button>
                        <button
                            type="button"
                            className="recruiter-profile__tab"
                            disabled
                            title="Sắp có"
                        >
                            Lịch sử tuyển dụng
                        </button>
                        <button
                            type="button"
                            className="recruiter-profile__tab"
                            disabled
                            title="Sắp có"
                        >
                            Đánh giá từ ứng viên
                        </button>
                    </nav>

                    {activeTab === 'info' && (
                        <>
                            <div className="recruiter-profile__content-grid">
                                <section className="recruiter-profile__panel">
                                    <h2 className="recruiter-profile__panel-title">
                                        <BuildingIcon width={18} height={18} />
                                        Tổng quan
                                    </h2>

                                    <div className="recruiter-profile__field">
                                        <label htmlFor="rp-business-name">Tên doanh nghiệp</label>
                                        <input
                                            id="rp-business-name"
                                            value={form.businessName}
                                            onChange={(e) =>
                                                updateFormField('businessName', e.target.value)
                                            }
                                        />
                                    </div>

                                    <div className="recruiter-profile__field">
                                        <label htmlFor="rp-business-type">Ngành nghề</label>
                                        <select
                                            id="rp-business-type"
                                            value={form.businessType}
                                            onChange={(e) =>
                                                updateFormField('businessType', e.target.value)
                                            }
                                        >
                                            <option value="">— Chọn ngành nghề —</option>
                                            {BUSINESS_TYPE_OPTIONS.map((opt) => (
                                                <option key={opt} value={opt}>
                                                    {opt}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="recruiter-profile__field">
                                        <div className="recruiter-profile__address-label-row">
                                            <label htmlFor="rp-detail-address">Địa chỉ trụ sở</label>
                                            <button
                                                type="button"
                                                className="recruiter-profile__gps-btn"
                                                onClick={handleGetCurrentLocation}
                                                disabled={gpsLoading || locationLoading}
                                            >
                                                <MapPinIcon width={14} height={14} />
                                                {gpsLoading
                                                    ? 'Đang lấy vị trí...'
                                                    : 'Lấy vị trí hiện tại'}
                                            </button>
                                        </div>

                                        {locationLoading ? (
                                            <p className="account-settings__hint">
                                                Đang tải địa chỉ...
                                            </p>
                                        ) : (
                                            <>
                                                <div className="recruiter-profile__address-admin">
                                                    <select
                                                        value={form.provinceId}
                                                        onChange={(e) =>
                                                            updateFormField(
                                                                'provinceId',
                                                                e.target.value
                                                            )
                                                        }
                                                    >
                                                        <option value="">
                                                            — Tỉnh / Thành phố —
                                                        </option>
                                                        {provinces.map((province) => (
                                                            <option
                                                                key={province.id}
                                                                value={province.id}
                                                            >
                                                                {province.ten}
                                                            </option>
                                                        ))}
                                                    </select>

                                                    <select
                                                        value={form.wardId}
                                                        disabled={!form.provinceId}
                                                        onChange={(e) =>
                                                            updateFormField('wardId', e.target.value)
                                                        }
                                                    >
                                                        <option value="">— Phường / Xã —</option>
                                                        {wards.map((ward) => (
                                                            <option key={ward.id} value={ward.id}>
                                                                {ward.ten}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="recruiter-profile__input-icon">
                                                    <MapPinIcon width={16} height={16} />
                                                    <input
                                                        id="rp-detail-address"
                                                        type="text"
                                                        placeholder="Số nhà, tên đường, tòa nhà..."
                                                        value={form.detailAddress}
                                                        onChange={(e) =>
                                                            updateFormField(
                                                                'detailAddress',
                                                                e.target.value
                                                            )
                                                        }
                                                    />
                                                </div>

                                                {addressFieldMessage && (
                                                    <p
                                                        className="recruiter-profile__address-field-message"
                                                        role="status"
                                                    >
                                                        {addressFieldMessage}
                                                    </p>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    <div className="recruiter-profile__field">
                                        <label htmlFor="rp-description">Mô tả doanh nghiệp</label>
                                        <textarea
                                            id="rp-description"
                                            rows={5}
                                            value={form.description}
                                            onChange={(e) =>
                                                updateFormField('description', e.target.value)
                                            }
                                            placeholder="Giới thiệu về doanh nghiệp, văn hóa, môi trường làm việc..."
                                        />
                                    </div>
                                </section>

                                <section className="recruiter-profile__panel recruiter-profile__panel--contact">
                                    <h2 className="recruiter-profile__panel-title">
                                        <PhoneIcon width={18} height={18} />
                                        Thông tin liên hệ
                                    </h2>

                                    <div className="recruiter-profile__field">
                                        <label htmlFor="rp-phone">Số điện thoại</label>
                                        <div className="recruiter-profile__input-icon">
                                            <PhoneIcon width={16} height={16} />
                                            <input
                                                id="rp-phone"
                                                type="tel"
                                                value={form.phone}
                                                onChange={(e) =>
                                                    updateFormField('phone', e.target.value)
                                                }
                                                placeholder="0xxxxxxxxx"
                                            />
                                        </div>
                                    </div>

                                    <div className="recruiter-profile__field">
                                        <label htmlFor="rp-email">Email tuyển dụng</label>
                                        <div className="recruiter-profile__input-icon">
                                            <MailIcon width={16} height={16} />
                                            <input
                                                id="rp-email"
                                                type="email"
                                                value={form.email}
                                                onChange={(e) =>
                                                    updateFormField('email', e.target.value)
                                                }
                                                placeholder="tuyendung@company.com"
                                            />
                                        </div>
                                    </div>

                                    <div className="recruiter-profile__field">
                                        <label htmlFor="rp-website">Website / Fanpage</label>
                                        <div className="recruiter-profile__input-icon">
                                            <GlobeIcon width={16} height={16} />
                                            <input
                                                id="rp-website"
                                                type="url"
                                                value={form.websiteUrl}
                                                onChange={(e) =>
                                                    updateFormField('websiteUrl', e.target.value)
                                                }
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        className="account-settings__btn account-settings__btn--primary recruiter-profile__save-btn"
                                        disabled={saving || !canSave}
                                        onClick={handleSaveAll}
                                    >
                                        {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                                    </button>
                                </section>
                            </div>

                            <section className="recruiter-profile__gallery-panel">
                                <div className="recruiter-profile__gallery-header">
                                    <h2>
                                        <ImagePlusIcon width={18} height={18} />
                                        Ảnh cửa hàng / môi trường làm việc
                                    </h2>
                                    <span className="recruiter-profile__gallery-count">
                                        {galleryCount} / {MAX_GALLERY} ảnh tối đa
                                    </span>
                                </div>

                                <div className="recruiter-profile__gallery-grid">
                                    {profile.galleryImages.map((img) => (
                                        <div
                                            key={img.id}
                                            className="recruiter-profile__gallery-item recruiter-profile__gallery-item--deletable"
                                        >
                                            <img
                                                src={img.fileUrl}
                                                alt="Ảnh cửa hàng hoặc môi trường làm việc"
                                            />
                                            <button
                                                type="button"
                                                className="account-settings__avatar-delete"
                                                disabled={galleryLoading}
                                                aria-label="Xóa ảnh"
                                                onClick={() => handleDeleteGalleryImage(img.id)}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}

                                    {canAddGallery && (
                                        <label className="recruiter-profile__gallery-add">
                                            <ImagePlusIcon width={28} height={28} />
                                            <span>
                                                {galleryLoading
                                                    ? 'Đang xử lý...'
                                                    : 'Thêm ảnh mới'}
                                            </span>
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
                                </div>
                            </section>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default RecruiterProfilePage;
