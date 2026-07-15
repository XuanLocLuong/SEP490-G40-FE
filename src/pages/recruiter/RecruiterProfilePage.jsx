import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
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
import { ROUTES } from '../../routes/path.js';
import { RECRUITER_PROFILE_CREATE_JOB_INTENT } from '../../utils/recruiterJobGuard.js';
import RequiredMark from '../../components/common/RequiredMark.jsx';
import RichTextEditor from '../../components/common/RichTextEditor.jsx';
import { clampPercent } from '../../utils/profileFormat.js';
import { plainTextLength } from '../../utils/richTextUtils.js';
import '../../assets/styles/AccountSettingsStyle.css';
import '../../assets/styles/RecruiterProfileStyle.css';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_GALLERY = 8;
const PHONE_PATTERN = /^(\+84|0)[35789][0-9]{8}$/;
const BUSINESS_DESCRIPTION_MAX_LENGTH = 2000;
const BUSINESS_DESCRIPTION_TEMPLATE = `<h2>Giới thiệu</h2><p>Mô tả ngắn về doanh nghiệp, lĩnh vực, quy mô...</p><h2>Văn hóa &amp; môi trường làm việc</h2><ul><li>Môi trường năng động, hỗ trợ sinh viên part-time</li><li>Văn hóa giao tiếp cởi mở, làm việc nhóm</li></ul><h2>Phúc lợi</h2><ul><li>Lương theo ca + thưởng hiệu suất</li><li>BHXH, phụ cấp ăn ca (nếu có)</li></ul><h2>Đặc quyền khác</h2><ul><li>Đào tạo nghiệp vụ khi vào làm</li><li>Cơ hội chuyển chính thức</li></ul>`;

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
    totalActiveJobs: 0,
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
    totalActiveJobs: data?.totalActiveJobs ?? 0,
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

const getHeroTitle = (noProfile, form, profile) => {
    if (noProfile) {
        return form.businessName.trim() || 'Tạo hồ sơ doanh nghiệp';
    }
    return form.businessName || profile.businessName || 'Doanh nghiệp của bạn';
};

const getHeroSubtitle = (noProfile, form) => {
    if (!noProfile || !form.businessName.trim()) return null;
    return 'Hồ sơ mới — lưu thông tin bên dưới để hoàn tất';
};

/**
 * Mục còn thiếu — mirror BE ProfileCompletionService.calculateBusiness (dữ liệu đã lưu).
 */
const getBusinessCompletionMissing = (profile, savedLocation) => {
    const missing = [];

    if (!profile.businessName?.trim()) missing.push('tên');
    if (!profile.phone?.trim()) missing.push('SĐT');
    if (!profile.email?.trim()) missing.push('email');
    if (!plainTextLength(profile.description)) missing.push('mô tả');
    if (!profile.businessType?.trim()) missing.push('loại hình');
    if (!profile.websiteUrl?.trim()) missing.push('website');
    if (!hasLogo(profile.logoUrl)) missing.push('logo');
    if (!(profile.galleryImages?.length > 0)) missing.push('ảnh');
    if (!savedLocation) missing.push('địa chỉ');
    if (profile.badge !== 'BUSSINESS_VERIFYED') missing.push('xác minh DN');
    if (!(profile.totalActiveJobs > 0)) missing.push('tin tuyển');

    return missing;
};

const getCompletionHint = (noProfile, profile, savedLocation, completionPercent) => {
    if (noProfile) return null;
    if (completionPercent >= 100) return null;

    const missing = getBusinessCompletionMissing(profile, savedLocation);
    if (missing.length === 0) {
        return 'Lưu để cập nhật %.';
    }

    return `Bổ sung: ${missing.join(', ')}`;
};

const RecruiterProfilePage = () => {
    const { auth } = useAuth();
    const [fromCreateJob, setFromCreateJob] = useState(
        () => sessionStorage.getItem(RECRUITER_PROFILE_CREATE_JOB_INTENT) === '1'
    );
    const logoInputRef = useRef(null);
    const galleryInputRef = useRef(null);
    const provinces = useMemo(() => getProvinces(), []);

    const [profile, setProfile] = useState(emptyProfile);
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(true);
    const [noProfile, setNoProfile] = useState(false);
    const [saving, setSaving] = useState(false);
    const [logoLoading, setLogoLoading] = useState(false);
    const [pendingLogoFile, setPendingLogoFile] = useState(null);
    const [pendingLogoPreview, setPendingLogoPreview] = useState(null);
    const pendingLogoPreviewRef = useRef(null);
    const [galleryLoading, setGalleryLoading] = useState(false);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('info');

    const [savedLocation, setSavedLocation] = useState(null);
    const [coords, setCoords] = useState(null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [addressFieldMessage, setAddressFieldMessage] = useState('');
    const [accountContact, setAccountContact] = useState({ phone: '', email: '' });
    const locationSectionRef = useRef(null);
    const descriptionInsertRef = useRef(null);

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
            setAccountContact(accountContact);
            syncFormFromProfile(mapped);
            await loadLocation(mapped.businessId, mapped.businessName);
        } catch (err) {
            if (err.response?.status === 404) {
                setNoProfile(true);
                setProfile(emptyProfile());
                setAccountContact(accountContact);
                setForm(emptyForm());
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

        if (plainTextLength(form.description) > BUSINESS_DESCRIPTION_MAX_LENGTH) {
            toast.error(
                `Mô tả doanh nghiệp tối đa ${BUSINESS_DESCRIPTION_MAX_LENGTH} ký tự.`
            );
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

        setSaving(true);
        const isCreate = noProfile || !profile.businessId;
        let businessId = profile.businessId;

        try {
            if (isCreate) {
                const created = await recruiterProfileApi.createProfile({
                    businessName: form.businessName.trim(),
                    description: form.description?.trim() || null,
                    websiteUrl: form.websiteUrl?.trim() || null,
                    businessType: form.businessType?.trim() || null,
                    email: form.email?.trim() || null,
                    phone: form.phone?.trim() || null,
                });
                const mapped = mapProfileFromApi(created);
                setProfile(mapped);
                setNoProfile(false);
                businessId = mapped.businessId;
            } else {
                const updated = await recruiterProfileApi.updateProfile(
                    buildUpdatePayload(form, businessId)
                );
                setProfile(mapProfileFromApi(updated));
            }
        } catch (err) {
            toast.error(
                getApiErrorMessage(
                    err,
                    isCreate
                        ? 'Không thể tạo hồ sơ doanh nghiệp.'
                        : 'Không thể cập nhật hồ sơ doanh nghiệp.'
                )
            );
            setSaving(false);
            return;
        }

        if (pendingLogoFile) {
            try {
                const result = await recruiterProfileApi.uploadLogo(businessId, pendingLogoFile);
                setProfile((prev) => ({
                    ...prev,
                    logoUrl: result?.url || result?.logoUrl || prev.logoUrl,
                }));
                clearPendingLogo();
            } catch (err) {
                toast.error(
                    getApiErrorMessage(
                        err,
                        'Đã lưu hồ sơ nhưng không thể tải logo lên. Vui lòng thử lại.'
                    )
                );
            }
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
                await locationApi.updateLocation(businessId, savedLocation.id, locationPayload);
            } else {
                const created = await locationApi.createLocation(businessId, locationPayload);
                setSavedLocation(created);
            }

            toast.success(isCreate ? 'Đã tạo hồ sơ doanh nghiệp.' : 'Đã lưu thay đổi.');
        } catch (err) {
            toast.error(getLocationApiErrorMessage(err, 'Không thể lưu địa chỉ cơ sở.'));
        } finally {
            setSaving(false);
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

        if (!profile.businessId) {
            if (pendingLogoPreviewRef.current) {
                URL.revokeObjectURL(pendingLogoPreviewRef.current);
            }
            const previewUrl = URL.createObjectURL(file);
            pendingLogoPreviewRef.current = previewUrl;
            setPendingLogoFile(file);
            setPendingLogoPreview(previewUrl);
            return;
        }

        setLogoLoading(true);

        try {
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
        if (!hasDisplayLogo) return;

        if (pendingLogoFile) {
            clearPendingLogo();
            return;
        }

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
    const profileReadyForJob = !noProfile && Boolean(savedLocation);
    const displayLogoUrl = pendingLogoPreview || profile.logoUrl;
    const hasDisplayLogo = hasLogo(displayLogoUrl);

    const clearPendingLogo = useCallback(() => {
        if (pendingLogoPreviewRef.current) {
            URL.revokeObjectURL(pendingLogoPreviewRef.current);
            pendingLogoPreviewRef.current = null;
        }
        setPendingLogoFile(null);
        setPendingLogoPreview(null);
    }, []);

    useEffect(
        () => () => {
            if (pendingLogoPreviewRef.current) {
                URL.revokeObjectURL(pendingLogoPreviewRef.current);
            }
        },
        []
    );
    const completionPercent = clampPercent(profile.completionRate);
    const memberSinceDisplay = formatMemberSince(profile.memberSince);
    const heroTitle = getHeroTitle(noProfile, form, profile);
    const heroSubtitle = getHeroSubtitle(noProfile, form);
    const completionHint = getCompletionHint(
        noProfile,
        profile,
        savedLocation,
        completionPercent
    );
    const showHeroMeta =
        !noProfile ||
        (profile.badge &&
            (profile.badge === 'BUSSINESS_VERIFYED' ||
                profile.badge === 'IDENTITY_VERIFYED'));

    return (
        <div className="recruiter-profile-page">
            {fromCreateJob && (
                <div
                    className={`recruiter-profile__create-job-banner${
                        profileReadyForJob
                            ? ' recruiter-profile__create-job-banner--success'
                            : ''
                    }`}
                >
                    <strong>
                        {profileReadyForJob
                            ? 'Hồ sơ doanh nghiệp đã hoàn thiện. Bạn có thể quay lại đăng tin tuyển dụng.'
                            : 'Bạn cần hoàn thiện hồ sơ doanh nghiệp trước khi đăng tin tuyển dụng.'}
                    </strong>
                    {profileReadyForJob && (
                        <Link
                            to={ROUTES.RECRUITER_CREATE_JOB}
                            className="recruiter-profile__back-to-job-btn recruiter-profile__back-to-job-btn--success"
                            onClick={() => {
                                sessionStorage.removeItem(RECRUITER_PROFILE_CREATE_JOB_INTENT);
                                setFromCreateJob(false);
                            }}
                        >
                            Quay lại đăng tin
                        </Link>
                    )}
                </div>
            )}
            {loading ? (
                <div className="account-settings__loading">Đang tải hồ sơ...</div>
            ) : (
                <>
                    <section className="recruiter-profile__hero">
                        <div className="recruiter-profile__hero-logo">
                            <div
                                className={`account-settings__avatar-picker${
                                    hasDisplayLogo
                                        ? ' account-settings__avatar-picker--deletable'
                                        : ''
                                }`}
                            >
                                {hasDisplayLogo ? (
                                    <img
                                        src={displayLogoUrl}
                                        alt={`Logo ${profile.businessName || form.businessName || 'doanh nghiệp'}`}
                                        className="recruiter-profile__logo recruiter-profile__logo--image"
                                    />
                                ) : (
                                    <div className="recruiter-profile__logo recruiter-profile__logo--placeholder">
                                        <BuildingIcon width={32} height={32} />
                                    </div>
                                )}
                                {hasDisplayLogo && (
                                    <button
                                        type="button"
                                        className="account-settings__avatar-delete"
                                        aria-label="Xóa logo"
                                        onClick={handleDeleteLogo}
                                        disabled={logoLoading || saving}
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                            <label
                                className={`recruiter-profile__logo-change${
                                    logoLoading || saving
                                        ? ' recruiter-profile__logo-change--disabled'
                                        : ''
                                }`}
                            >
                                {logoLoading
                                    ? 'Đang xử lý...'
                                    : hasDisplayLogo
                                      ? 'Thay đổi logo'
                                      : 'Thêm logo'}
                                <input
                                    ref={logoInputRef}
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    disabled={logoLoading || saving}
                                    onChange={handleLogoSelect}
                                />
                            </label>
                        </div>

                        <div className="recruiter-profile__hero-main">
                            <div className="recruiter-profile__hero-title-row">
                                <div className="recruiter-profile__hero-heading">
                                    <h1>{heroTitle}</h1>
                                    {heroSubtitle && (
                                        <p className="recruiter-profile__hero-subtitle">{heroSubtitle}</p>
                                    )}
                                </div>
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

                            {showHeroMeta && (
                                <div className="recruiter-profile__hero-meta">
                                    {!noProfile && (
                                        <span className="recruiter-profile__rating">
                                            <StarIcon width={16} height={16} />
                                            {profile.averageRating.toFixed(1)} ({profile.totalReviews}{' '}
                                            lượt đánh giá)
                                        </span>
                                    )}

                                    {profile.badge &&
                                        (profile.badge === 'BUSSINESS_VERIFYED' ||
                                            profile.badge === 'IDENTITY_VERIFYED') && (
                                        <span className="recruiter-profile__trust-badge">
                                            <MapPinIcon width={14} height={14} />
                                            Nhà tuyển dụng uy tín
                                        </span>
                                    )}
                                </div>
                            )}

                            <div
                                className={`recruiter-profile__completion${
                                    completionPercent < 100
                                        ? ' recruiter-profile__completion--incomplete'
                                        : ''
                                }`}
                                aria-label={`Hồ sơ hoàn thiện ${completionPercent}%`}
                            >
                                <div className="recruiter-profile__completion-row">
                                    <span className="recruiter-profile__completion-row-label">
                                        Hồ sơ
                                    </span>
                                    <span className="recruiter-profile__completion-row-percent">
                                        {completionPercent}%
                                    </span>
                                    <div
                                        className="recruiter-profile__completion-bar recruiter-profile__completion-bar--short"
                                        role="progressbar"
                                        aria-valuenow={completionPercent}
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                    >
                                        <div
                                            className="recruiter-profile__completion-fill"
                                            style={{ width: `${completionPercent}%` }}
                                        />
                                    </div>
                                </div>
                                {completionHint && (
                                    <p className="recruiter-profile__completion-hint">
                                        {completionHint}
                                    </p>
                                )}
                            </div>

                            {!noProfile && (
                                <div className="recruiter-profile__hero-stats">
                                    <span className="recruiter-profile__hero-stat-item">
                                        <strong>{profile.completedHiring}</strong>
                                        {' lần tuyển thành công'}
                                    </span>
                                    <span
                                        className="recruiter-profile__hero-stats-sep"
                                        aria-hidden="true"
                                    >
                                        ·
                                    </span>
                                    <span
                                        className="recruiter-profile__hero-stat-item"
                                        title="Ngày tạo hồ sơ doanh nghiệp"
                                    >
                                        <ClockIcon width={14} height={14} />
                                        {' Doanh nghiệp từ '}
                                        <strong>{memberSinceDisplay}</strong>
                                    </span>
                                </div>
                            )}
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
                        {!noProfile && (
                            <>
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
                            </>
                        )}
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
                                        <label htmlFor="rp-business-name">
                                            Tên doanh nghiệp
                                            <RequiredMark />
                                        </label>
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

                                    <div
                                        ref={locationSectionRef}
                                        id="recruiter-profile-location"
                                        className="recruiter-profile__field recruiter-profile__field--location"
                                    >
                                        <div className="recruiter-profile__address-label-row">
                                            <span className="recruiter-profile__address-section-title">
                                                Địa chỉ trụ sở
                                                <RequiredMark />
                                            </span>
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
                                                    <div className="recruiter-profile__address-field">
                                                        <label htmlFor="rp-province">
                                                            Tỉnh / Thành phố
                                                            <RequiredMark />
                                                        </label>
                                                        <select
                                                            id="rp-province"
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
                                                    </div>

                                                    <div className="recruiter-profile__address-field">
                                                        <label htmlFor="rp-ward">
                                                            Phường / Xã
                                                            <RequiredMark />
                                                        </label>
                                                        <select
                                                            id="rp-ward"
                                                            value={form.wardId}
                                                            disabled={!form.provinceId}
                                                            onChange={(e) =>
                                                                updateFormField(
                                                                    'wardId',
                                                                    e.target.value
                                                                )
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
                                                </div>

                                                <div className="recruiter-profile__field recruiter-profile__field--detail-address">
                                                    <label htmlFor="rp-detail-address-input">
                                                        Số nhà, tên đường
                                                        <RequiredMark />
                                                    </label>
                                                    <div className="recruiter-profile__input-icon">
                                                        <MapPinIcon width={16} height={16} />
                                                        <input
                                                            id="rp-detail-address-input"
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
                                        <div className="recruiter-profile__field-label-row">
                                            <label htmlFor="rp-description">Mô tả doanh nghiệp</label>
                                            <button
                                                type="button"
                                                className="recruiter-profile__insert-template-btn"
                                                onClick={() => descriptionInsertRef.current?.()}
                                            >
                                                Chèn mẫu gợi ý
                                            </button>
                                        </div>
                                        <RichTextEditor
                                            id="rp-description"
                                            rows={8}
                                            value={form.description}
                                            maxLength={BUSINESS_DESCRIPTION_MAX_LENGTH}
                                            onChange={(value) =>
                                                updateFormField('description', value)
                                            }
                                            placeholder="Giới thiệu công ty, văn hóa, phúc lợi và đặc quyền."
                                            template={BUSINESS_DESCRIPTION_TEMPLATE}
                                            insertTemplateRef={descriptionInsertRef}
                                            autoInsertTemplate={false}
                                        />
                                    </div>
                                </section>

                                <div className="recruiter-profile__sidebar">
                                <section className="recruiter-profile__panel recruiter-profile__panel--account">
                                    <div className="recruiter-profile__panel-heading">
                                        <h2 className="recruiter-profile__panel-title">
                                            <MailIcon width={18} height={18} />
                                            Tài khoản
                                        </h2>
                                        <Link
                                            to={ROUTES.RECRUITER_SETTINGS}
                                            className="recruiter-profile__panel-action"
                                        >
                                            Cài đặt
                                        </Link>
                                    </div>

                                    <div className="recruiter-profile__field">
                                        <label htmlFor="rp-account-phone">Số điện thoại</label>
                                        <input
                                            id="rp-account-phone"
                                            type="tel"
                                            readOnly
                                            value={accountContact.phone?.trim() || 'Chưa cập nhật'}
                                        />
                                    </div>

                                    <div className="recruiter-profile__field">
                                        <label htmlFor="rp-account-email">Email</label>
                                        <input
                                            id="rp-account-email"
                                            type="email"
                                            readOnly
                                            value={accountContact.email?.trim() || '—'}
                                        />
                                    </div>
                                </section>

                                <section className="recruiter-profile__panel recruiter-profile__panel--contact">
                                    <h2 className="recruiter-profile__panel-title">
                                        <PhoneIcon width={18} height={18} />
                                        Liên hệ tuyển dụng
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
                                        {saving
                                            ? 'Đang lưu...'
                                            : noProfile
                                              ? 'Tạo hồ sơ'
                                              : 'Lưu thay đổi'}
                                    </button>
                                </section>
                                </div>
                            </div>

                            {!noProfile && (
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
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default RecruiterProfilePage;
