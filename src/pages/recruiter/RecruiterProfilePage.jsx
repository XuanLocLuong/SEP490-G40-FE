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
import recruiterJobApi, { getRecruiterJobApiErrorMessage } from '../../apis/RecruiterJobApi.jsx';
import { getRecruiterReviews, getReviewApiErrorMessage } from '../../apis/ReviewApi.jsx';
import locationApi, { getLocationApiErrorMessage } from '../../apis/LocationApi.jsx';
import userApi from '../../apis/UserApi.jsx';
import {
    buildFullAddress,
    findProvinceByName,
    findWardByName,
} from '../../modules/location/index.js';
import { useAuth } from '../../contexts/authContext.js';
import { ROUTES } from '../../routes/path.js';
import { RECRUITER_PROFILE_CREATE_JOB_INTENT } from '../../utils/recruiterJobGuard.js';
import {
    clearRecruiterProfileDraft,
    getRecruiterProfileDraftKey,
    loadRecruiterProfileDraft,
    saveRecruiterProfileDraft,
} from '../../utils/recruiterProfileDraftStorage.js';
import {
    clearPendingMedia,
    loadPendingMedia,
    savePendingMedia,
} from '../../utils/recruiterPendingMediaStorage.js';
import RequiredMark from '../../components/common/RequiredMark.jsx';
import RichTextEditor from '../../components/common/RichTextEditor.jsx';
import RecruiterAddressModal from '../../components/recruiter/RecruiterAddressModal.jsx';
import ReadonlyMapPreview from '../../components/recruiter/ReadonlyMapPreview.jsx';
import HiringHistoryTab from '../../components/recruiter/HiringHistoryTab.jsx';
import { clampPercent } from '../../utils/profileFormat.js';
import { plainTextLength } from '../../utils/richTextUtils.js';
import {
    formatBusinessTypeLabel,
    mapBusinessTypeOptions,
    toBusinessTypeCode,
} from '../../utils/businessTypeDisplay.js';
import {
    VERIFICATION_STATUS,
    getBusinessTypeChangeVerifyFeedback,
    isFullyBusinessVerified,
    needsBusinessLicenseTopUp,
    resolveRequiresBusinessLicense,
} from '../../utils/verificationDisplay.js';
import '../../assets/styles/AccountSettingsStyle.css';
import '../../assets/styles/RecruiterProfileStyle.css';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_GALLERY = 8;
const REVIEW_PAGE_SIZE = 5;
const PHONE_PATTERN = /^(\+84|0)[35789][0-9]{8}$/;
const BUSINESS_DESCRIPTION_MAX_LENGTH = 2000;
const BUSINESS_DESCRIPTION_TEMPLATE = `<h2>Giới thiệu</h2><p>Mô tả ngắn về doanh nghiệp, lĩnh vực, quy mô...</p><h2>Văn hóa &amp; môi trường làm việc</h2><ul><li>Môi trường năng động, hỗ trợ sinh viên part-time</li><li>Văn hóa giao tiếp cởi mở, làm việc nhóm</li></ul><h2>Phúc lợi</h2><ul><li>Lương theo ca + thưởng hiệu suất</li><li>BHXH, phụ cấp ăn ca (nếu có)</li></ul><h2>Đặc quyền khác</h2><ul><li>Đào tạo nghiệp vụ khi vào làm</li><li>Cơ hội chuyển chính thức</li></ul>`;

const hasLogo = (url) => Boolean(url?.trim());

const emptyAddressInitial = () => ({
    provinceId: '',
    wardId: '',
    detailAddress: '',
    provinceName: '',
    wardName: '',
});

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
    taxCode: '',
    totalActiveJobs: 0,
    requiresBusinessLicense: undefined,
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
    businessType: toBusinessTypeCode(data?.businessType) || data?.businessType || '',
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
    taxCode: data?.taxCode || '',
    totalActiveJobs: data?.totalActiveJobs ?? 0,
    requiresBusinessLicense:
        typeof data?.requiresBusinessLicense === 'boolean'
            ? data.requiresBusinessLicense
            : undefined,
});

const buildUpdatePayload = (form, businessId) => ({
    businessId,
    businessName: form.businessName.trim(),
    description: form.description?.trim() || null,
    phone: form.phone?.trim() || null,
    email: form.email?.trim() || null,
    websiteUrl: form.websiteUrl?.trim() || null,
    businessType: toBusinessTypeCode(form.businessType),
});

const formatMemberSince = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${month}/${date.getFullYear()}`;
};

const formatReviewDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

const isBusinessVerifiedBadge = (badge) => badge === 'BUSINESS_VERIFIED';

const isPendingManualVerification = (status) =>
    status === 'BUSINESS_MANUALLY' ||
    status === 'CCCD_MANUALLY';

const isRejectedVerification = (status) =>
    status === 'BUSINESS_REJECTED' ||
    status === 'CCCD_REJECTED';

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
    if (profile.badge !== 'BUSINESS_VERIFIED') missing.push('xác minh DN');
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

/** Mục còn thiếu để quay lại đăng tin — chỉ điều kiện tối thiểu, không gồm % hoàn thiện. */
const getJobPostingMissingItems = ({
    noProfile,
    form,
    savedLocation,
    hasCommittedAddress,
    hasPhone,
}) => {
    const missing = [];

    if (!form.businessName?.trim()) missing.push('tên doanh nghiệp');
    if (!form.businessType?.trim()) missing.push('loại hình doanh nghiệp');

    if (!savedLocation && !hasCommittedAddress) {
        missing.push('địa chỉ trụ sở');
    }

    const profileFieldsReady =
        Boolean(form.businessName?.trim()) &&
        Boolean(form.businessType?.trim()) &&
        hasCommittedAddress;

    if (profileFieldsReady && (noProfile || !savedLocation)) {
        missing.push('lưu hồ sơ');
    }

    if (!hasPhone) missing.push('số điện thoại)');

    return missing;
};

const applyStoredRecruiterDraft = (draftKey, setForm, setCoords) => {
    if (!draftKey) return;
    const stored = loadRecruiterProfileDraft(draftKey);
    if (!stored?.form) return;
    setForm(stored.form);
    if (stored.coords?.latitude != null && stored.coords?.longitude != null) {
        setCoords(stored.coords);
    }
};

const RecruiterProfilePage = () => {
    const { auth } = useAuth();
    const draftKey = useMemo(() => getRecruiterProfileDraftKey(auth), [auth]);
    const [fromCreateJob, setFromCreateJob] = useState(
        () => sessionStorage.getItem(RECRUITER_PROFILE_CREATE_JOB_INTENT) === '1'
    );
    const logoInputRef = useRef(null);
    const galleryInputRef = useRef(null);

    const [profile, setProfile] = useState(emptyProfile);
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(true);
    const [businessTypeOptions, setBusinessTypeOptions] = useState([]);
    const [noProfile, setNoProfile] = useState(false);
    const [saving, setSaving] = useState(false);
    const [logoLoading, setLogoLoading] = useState(false);
    const [pendingLogoFile, setPendingLogoFile] = useState(null);
    const [pendingLogoPreview, setPendingLogoPreview] = useState(null);
    const pendingLogoPreviewRef = useRef(null);
    /** @type {[{ id: string, file: File, previewUrl: string }[], Function]} */
    const [pendingGallery, setPendingGallery] = useState([]);
    const pendingGalleryRef = useRef([]);
    const [galleryLoading, setGalleryLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('info');
    const [reviewJobs, setReviewJobs] = useState([]);
    const [reviewJobsLoaded, setReviewJobsLoaded] = useState(false);
    const [selectedReviewJobId, setSelectedReviewJobId] = useState('');
    const [recruiterReviews, setRecruiterReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewsError, setReviewsError] = useState('');
    const [reviewsPage, setReviewsPage] = useState(0);
    const [reviewsTotalPages, setReviewsTotalPages] = useState(0);
    const [reviewsTotalElements, setReviewsTotalElements] = useState(0);

    const [savedLocation, setSavedLocation] = useState(null);
    const [coords, setCoords] = useState(null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [addressModalOpen, setAddressModalOpen] = useState(false);
    const [accountContact, setAccountContact] = useState({ phone: '', email: '' });
    const locationSectionRef = useRef(null);
    const descriptionInsertRef = useRef(null);

    const committedAddress = useMemo(
        () => ({
            provinceId: form.provinceId || '',
            wardId: form.wardId || '',
            detailAddress: form.detailAddress || '',
            provinceName: form.provinceName || '',
            wardName: form.wardName || '',
        }),
        [
            form.provinceId,
            form.wardId,
            form.detailAddress,
            form.provinceName,
            form.wardName,
        ]
    );

    const addressDisplay = useMemo(
        () =>
            buildFullAddress({
                detailAddress: form.detailAddress,
                wardName: form.wardName,
                provinceName: form.provinceName,
            }),
        [form.detailAddress, form.wardName, form.provinceName]
    );

    const hasCommittedAddress =
        Boolean(form.provinceId && form.wardId && form.detailAddress?.trim()) &&
        coords?.latitude != null &&
        coords?.longitude != null;

    const handleAddressModalConfirm = (result) => {
        setForm((prev) => ({
            ...prev,
            ...result.address,
        }));
        setCoords(result.coords);
        setAddressModalOpen(false);
    };

    const loadLocation = async (businessId, businessName) => {
        setLocationLoading(true);

        if (!businessId) {
            setSavedLocation(null);
            setCoords(null);
            setForm((prev) => ({ ...prev, ...emptyAddressInitial() }));
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

                const initial = {
                    provinceId: province?.id || '',
                    wardId: ward?.id || '',
                    detailAddress: loc.address || '',
                    provinceName: province?.ten || loc.city || '',
                    wardName: ward?.ten || loc.ward || '',
                };

                setForm((prev) => ({ ...prev, ...initial }));

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
                setForm((prev) => ({ ...prev, ...emptyAddressInitial() }));
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
        let profileExists = false;
        let loadedBusinessId = null;

        try {
            try {
                const types = await recruiterProfileApi.getBusinessTypes();
                setBusinessTypeOptions(mapBusinessTypeOptions(types));
            } catch {
                setBusinessTypeOptions([]);
                toast.warn('Không tải được danh mục ngành nghề.');
            }

            const data = await recruiterProfileApi.getProfile();
            const mapped = mapProfileFromApi(data);
            setProfile(mapped);
            setNoProfile(false);
            profileExists = true;
            loadedBusinessId = mapped.businessId;
            setAccountContact(accountContact);
            syncFormFromProfile(mapped);
            await loadLocation(mapped.businessId, mapped.businessName);
        } catch (err) {
            if (err.response?.status === 404) {
                setNoProfile(true);
                setProfile(emptyProfile());
                setAccountContact(accountContact);
                setForm(emptyForm());
                setCoords(null);
                setSavedLocation(null);
            } else {
                toast.error(getApiErrorMessage(err, 'Không thể tải hồ sơ nhà tuyển dụng.'));
            }
        } finally {
            applyStoredRecruiterDraft(getRecruiterProfileDraftKey(auth), setForm, setCoords);

            const key = getRecruiterProfileDraftKey(auth);
            if (key) {
                const pending = await loadPendingMedia(key);
                if (profileExists && loadedBusinessId) {
                    // Hồ sơ đã có nhưng còn file pending (upload lỗi lần trước) → đẩy lên BE.
                    if (pending.logoFile || pending.galleryFiles.length > 0) {
                        try {
                            if (pending.logoFile) {
                                await recruiterProfileApi.uploadLogo(
                                    loadedBusinessId,
                                    pending.logoFile
                                );
                            }
                            if (pending.galleryFiles.length > 0) {
                                await recruiterProfileApi.uploadGallery(
                                    loadedBusinessId,
                                    pending.galleryFiles
                                );
                            }
                            await clearPendingMedia(key);
                            const fresh = await recruiterProfileApi.getProfile(loadedBusinessId);
                            const mappedFresh = mapProfileFromApi(fresh);
                            setProfile(mappedFresh);
                            syncFormFromProfile(mappedFresh);
                        } catch {
                            applyPendingFilesToState(pending.logoFile, pending.galleryFiles);
                        }
                    }
                } else if (!profileExists) {
                    applyPendingFilesToState(pending.logoFile, pending.galleryFiles);
                }
            }

            setLoading(false);
        }
    };

    const loadReviewJobs = useCallback(async () => {
        try {
            const pageData = await recruiterJobApi.getMyJobs({ page: 0, size: 100 });
            const jobs = Array.isArray(pageData?.content) ? pageData.content : [];
            setReviewJobs(jobs);
            setReviewJobsLoaded(true);
        } catch (err) {
            setReviewJobs([]);
            setReviewJobsLoaded(true);
            toast.error(
                getRecruiterJobApiErrorMessage(err, 'Không tải được danh sách tin tuyển dụng.')
            );
        }
    }, []);

    const loadRecruiterReviews = useCallback(
        async (page = 0) => {
            setReviewsLoading(true);
            setReviewsError('');
            try {
                const res = await getRecruiterReviews({
                    jobId: selectedReviewJobId || undefined,
                    page,
                    size: REVIEW_PAGE_SIZE,
                });
                const pageData = res?.data?.data ?? res?.data ?? {};
                setRecruiterReviews(Array.isArray(pageData.content) ? pageData.content : []);
                setReviewsPage(pageData.currentPage ?? pageData.number ?? page);
                setReviewsTotalPages(pageData.totalPages ?? 0);
                setReviewsTotalElements(pageData.totalElements ?? 0);
            } catch (err) {
                setRecruiterReviews([]);
                setReviewsPage(0);
                setReviewsTotalPages(0);
                setReviewsTotalElements(0);
                setReviewsError(
                    getReviewApiErrorMessage(err, 'Không tải được đánh giá từ ứng viên.')
                );
            } finally {
                setReviewsLoading(false);
            }
        },
        [selectedReviewJobId]
    );

    useEffect(() => {
        loadProfile();
    }, []);

    useEffect(() => {
        if (activeTab !== 'reviews' || noProfile || reviewJobsLoaded) return;
        void loadReviewJobs();
    }, [activeTab, noProfile, reviewJobsLoaded, loadReviewJobs]);

    useEffect(() => {
        if (activeTab !== 'reviews' || noProfile) return;
        void loadRecruiterReviews(0);
    }, [activeTab, noProfile, loadRecruiterReviews]);

    useEffect(() => {
        if (loading || !draftKey) return;
        saveRecruiterProfileDraft(draftKey, { form, coords });
    }, [form, coords, loading, draftKey]);

    const updateFormField = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleReviewJobChange = (event) => {
        setSelectedReviewJobId(event.target.value);
        setReviewsPage(0);
    };

    const canSave =
        form.businessName.trim() &&
        form.businessType?.trim() &&
        form.provinceId &&
        form.wardId &&
        form.detailAddress?.trim() &&
        coords?.latitude != null &&
        coords?.longitude != null;

    const handleSaveAll = async () => {
        if (!form.businessName.trim()) {
            toast.error('Tên doanh nghiệp không được để trống.');
            return;
        }

        if (!hasCommittedAddress) {
            toast.error('Vui lòng cập nhật địa chỉ trụ sở trước khi lưu.');
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

        if (!form.businessType?.trim()) {
            toast.error('Vui lòng chọn loại hình doanh nghiệp.');
            return;
        }

        const businessTypeCode = toBusinessTypeCode(form.businessType, businessTypeOptions);
        if (form.businessType?.trim() && !businessTypeCode) {
            toast.error('Ngành nghề không hợp lệ. Vui lòng chọn lại trong danh sách.');
            return;
        }

        setSaving(true);
        const isCreate = noProfile || !profile.businessId;
        let businessId = profile.businessId;
        let mappedAfterSave = null;
        const prevRequiresLicense = resolveRequiresBusinessLicense({
            businessType: profile.businessType,
            typeOptions: businessTypeOptions,
            profileRequiresBusinessLicense: profile.requiresBusinessLicense,
        });
        const prevBadge = profile.badge;

        try {
            if (isCreate) {
                const created = await recruiterProfileApi.createProfile({
                    businessName: form.businessName.trim(),
                    description: form.description?.trim() || null,
                    websiteUrl: form.websiteUrl?.trim() || null,
                    businessType: businessTypeCode,
                    email: form.email?.trim() || null,
                    phone: form.phone?.trim() || null,
                });
                mappedAfterSave = mapProfileFromApi(created);
                setProfile(mappedAfterSave);
                setNoProfile(false);
                businessId = mappedAfterSave.businessId;
            } else {
                const updated = await recruiterProfileApi.updateProfile(
                    buildUpdatePayload(form, businessId)
                );
                mappedAfterSave = mapProfileFromApi(updated);

                // Luôn ưu tiên badge/status mới từ BE; thiếu thì GET lại profile.
                const missingVerifyFields =
                    mappedAfterSave.badge == null && mappedAfterSave.verificationStatus == null;
                if (missingVerifyFields || businessTypeCode !== profile.businessType) {
                    try {
                        const fresh = await recruiterProfileApi.getProfile(businessId);
                        mappedAfterSave = {
                            ...mappedAfterSave,
                            ...mapProfileFromApi(fresh),
                        };
                    } catch {
                        // giữ response update nếu GET thất bại
                    }
                }

                setProfile(mappedAfterSave);
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

        const logoPendingUpload = pendingLogoFile;
        const galleryPendingUpload = [...pendingGalleryRef.current];
        let logoUploadDone = !logoPendingUpload;
        let galleryUploadDone = galleryPendingUpload.length === 0;

        if (logoPendingUpload) {
            try {
                const result = await recruiterProfileApi.uploadLogo(
                    businessId,
                    logoPendingUpload
                );
                setProfile((prev) => ({
                    ...prev,
                    logoUrl: result?.url || result?.logoUrl || prev.logoUrl,
                }));
                if (pendingLogoPreviewRef.current) {
                    URL.revokeObjectURL(pendingLogoPreviewRef.current);
                    pendingLogoPreviewRef.current = null;
                }
                setPendingLogoFile(null);
                setPendingLogoPreview(null);
                logoUploadDone = true;
            } catch (err) {
                toast.error(
                    getApiErrorMessage(
                        err,
                        'Đã lưu hồ sơ nhưng không thể tải logo lên. Vui lòng thử lại.'
                    )
                );
            }
        }

        if (galleryPendingUpload.length > 0) {
            try {
                await recruiterProfileApi.uploadGallery(
                    businessId,
                    galleryPendingUpload.map((item) => item.file)
                );
                clearPendingGallery();
                galleryUploadDone = true;
                toast.success('Đã tải ảnh cửa hàng lên hồ sơ.');
            } catch (err) {
                toast.error(
                    getApiErrorMessage(
                        err,
                        'Đã lưu hồ sơ nhưng không thể tải ảnh cửa hàng. Vui lòng thử lại.'
                    )
                );
            }
        }

        if (logoUploadDone && galleryUploadDone && draftKey) {
            await clearPendingMedia(draftKey);
        } else if (draftKey) {
            await persistPendingToIdb(
                logoUploadDone ? null : logoPendingUpload,
                galleryUploadDone ? [] : galleryPendingUpload
            );
        }

        if (logoPendingUpload || galleryPendingUpload.length > 0) {
            try {
                const fresh = await recruiterProfileApi.getProfile(businessId);
                setProfile(mapProfileFromApi(fresh));
            } catch {
                // giữ state hiện tại
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
                const updated = await locationApi.updateLocation(
                    businessId,
                    savedLocation.id,
                    locationPayload
                );
                if (updated) setSavedLocation(updated);
            } else {
                const created = await locationApi.createLocation(businessId, locationPayload);
                setSavedLocation(created);
            }

            clearRecruiterProfileDraft(draftKey);

            if (isCreate) {
                toast.success('Đã tạo hồ sơ doanh nghiệp.');
            } else {
                const nextRequiresLicense = resolveRequiresBusinessLicense({
                    businessType: mappedAfterSave?.businessType || businessTypeCode,
                    typeOptions: businessTypeOptions,
                    profileRequiresBusinessLicense: mappedAfterSave?.requiresBusinessLicense,
                });
                const verifyFeedback = getBusinessTypeChangeVerifyFeedback({
                    prevRequiresLicense,
                    nextRequiresLicense,
                    prevBadge,
                    nextBadge: mappedAfterSave?.badge,
                    nextVerificationStatus: mappedAfterSave?.verificationStatus,
                });

                if (verifyFeedback?.kind === 'license_required') {
                    toast.warning(verifyFeedback.message);
                } else if (verifyFeedback?.kind === 'badge_restored') {
                    toast.info(verifyFeedback.message);
                } else {
                    toast.success('Đã lưu thay đổi.');
                }
            }
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
            void persistPendingToIdb(file, pendingGalleryRef.current);
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

        const savedCount = profile.galleryImages?.length || 0;
        const pendingCount = pendingGalleryRef.current.length;
        if (savedCount + pendingCount + files.length > MAX_GALLERY) {
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

        // Chưa có businessId: giữ pending + IndexedDB, upload sau khi tạo hồ sơ.
        if (!profile.businessId) {
            const additions = files.map((file, index) => ({
                id: `pending-${Date.now()}-${index}-${file.name}`,
                file,
                previewUrl: URL.createObjectURL(file),
            }));
            const next = setPendingGallerySafe([...pendingGalleryRef.current, ...additions]);
            void persistPendingToIdb(pendingLogoFile, next);
            return;
        }

        setGalleryLoading(true);

        try {
            await recruiterProfileApi.uploadGallery(profile.businessId, files);
            toast.success('Đã thêm ảnh vào bộ sưu tập.');
            await loadProfile();
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Không thể tải ảnh lên.'));
        } finally {
            setGalleryLoading(false);
        }
    };

    const handleDeletePendingGalleryImage = (pendingId) => {
        const target = pendingGalleryRef.current.find((item) => item.id === pendingId);
        if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
        const next = setPendingGallerySafe(
            pendingGalleryRef.current.filter((item) => item.id !== pendingId)
        );
        void persistPendingToIdb(pendingLogoFile, next);
    };

    const handleDeleteGalleryImage = async (imageId) => {
        if (String(imageId).startsWith('pending-')) {
            handleDeletePendingGalleryImage(imageId);
            return;
        }

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

    const galleryCount = (profile.galleryImages?.length || 0) + pendingGallery.length;
    const canAddGallery = galleryCount < MAX_GALLERY;
    const hasPhone = Boolean(form.phone?.trim() || accountContact.phone?.trim());
    const profileReadyForJob = !noProfile && Boolean(savedLocation) && hasPhone;
    const jobPostingMissing = getJobPostingMissingItems({
        noProfile,
        form,
        savedLocation,
        hasCommittedAddress,
        hasPhone,
    });
    /** Cần hồ sơ đã lưu (businessId + tên + địa chỉ) trước khi mở wizard xác minh. */
    const canStartVerification =
        Boolean(profile.businessId) &&
        Boolean(profile.businessName?.trim()) &&
        Boolean(savedLocation);
    const needsBusinessLicense = resolveRequiresBusinessLicense({
        businessType: profile.businessType,
        typeOptions: businessTypeOptions,
        profileRequiresBusinessLicense: profile.requiresBusinessLicense,
    });
    const showVerifiedBadge = isFullyBusinessVerified({
        badge: profile.badge,
        verificationStatus: profile.verificationStatus,
        needsLicense: needsBusinessLicense,
    });
    const needsLicenseTopUp = needsBusinessLicenseTopUp({
        verificationStatus: profile.verificationStatus,
        needsLicense: needsBusinessLicense,
        badge: profile.badge,
    });
    const verificationGateHint = (() => {
        if (canStartVerification || showVerifiedBadge) return '';
        const missing = [];
        if (!profile.businessId || !profile.businessName?.trim()) missing.push('tên doanh nghiệp');
        if (!savedLocation) missing.push('địa chỉ trụ sở');
        if (noProfile || missing.length === 2) {
            return 'Hãy cập nhật và lưu thông tin doanh nghiệp bên dưới (tên + địa chỉ trụ sở) trước khi xác minh.';
        }
        return `Hãy bổ sung và lưu ${missing.join(' và ')} bên dưới trước khi xác minh.`;
    })();
    const displayLogoUrl = pendingLogoPreview || profile.logoUrl;
    const hasDisplayLogo = hasLogo(displayLogoUrl);

    const clearPendingLogo = useCallback(() => {
        if (pendingLogoPreviewRef.current) {
            URL.revokeObjectURL(pendingLogoPreviewRef.current);
            pendingLogoPreviewRef.current = null;
        }
        setPendingLogoFile(null);
        setPendingLogoPreview(null);
        void savePendingMedia(draftKey, {
            logoFile: null,
            galleryFiles: pendingGalleryRef.current.map((item) => item.file).filter(Boolean),
        });
    }, [draftKey]);

    const revokePendingGalleryPreviews = useCallback((items) => {
        (items || []).forEach((item) => {
            if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
        });
    }, []);

    const setPendingGallerySafe = useCallback((next) => {
        const resolved = typeof next === 'function' ? next(pendingGalleryRef.current) : next;
        pendingGalleryRef.current = resolved;
        setPendingGallery(resolved);
        return resolved;
    }, []);

    const clearPendingGallery = useCallback(() => {
        revokePendingGalleryPreviews(pendingGalleryRef.current);
        setPendingGallerySafe([]);
    }, [revokePendingGalleryPreviews, setPendingGallerySafe]);

    const persistPendingToIdb = useCallback(
        async (logoFile, galleryItems) => {
            if (!draftKey) return;
            await savePendingMedia(draftKey, {
                logoFile: logoFile || null,
                galleryFiles: (galleryItems || []).map((item) => item.file).filter(Boolean),
            });
        },
        [draftKey]
    );

    const applyPendingFilesToState = useCallback(
        (logoFile, galleryFiles) => {
            if (logoFile) {
                if (pendingLogoPreviewRef.current) {
                    URL.revokeObjectURL(pendingLogoPreviewRef.current);
                }
                const previewUrl = URL.createObjectURL(logoFile);
                pendingLogoPreviewRef.current = previewUrl;
                setPendingLogoFile(logoFile);
                setPendingLogoPreview(previewUrl);
            }
            if (Array.isArray(galleryFiles) && galleryFiles.length > 0) {
                revokePendingGalleryPreviews(pendingGalleryRef.current);
                const items = galleryFiles.map((file, index) => ({
                    id: `pending-${file.name}-${file.lastModified}-${index}`,
                    file,
                    previewUrl: URL.createObjectURL(file),
                }));
                setPendingGallerySafe(items);
            }
        },
        [revokePendingGalleryPreviews, setPendingGallerySafe]
    );

    useEffect(
        () => () => {
            if (pendingLogoPreviewRef.current) {
                URL.revokeObjectURL(pendingLogoPreviewRef.current);
            }
            revokePendingGalleryPreviews(pendingGalleryRef.current);
        },
        [revokePendingGalleryPreviews]
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
    const showHeroMeta = !noProfile || showVerifiedBadge;

    return (
        <div className="recruiter-profile-page">
            {fromCreateJob && (
                <div
                    className={`recruiter-profile__create-job-banner${profileReadyForJob
                            ? ' recruiter-profile__create-job-banner--success'
                            : ''
                        }`}
                >
                    <div className="recruiter-profile__create-job-banner-content">
                        <strong>
                            {profileReadyForJob
                                ? 'Hồ sơ doanh nghiệp đã hoàn thiện. Bạn có thể quay lại đăng tin tuyển dụng.'
                                : 'Bạn cần hoàn thiện hồ sơ doanh nghiệp trước khi đăng tin tuyển dụng.'}
                        </strong>
                        {!profileReadyForJob && jobPostingMissing.length > 0 && (
                            <span className="recruiter-profile__create-job-banner-note">
                                (Còn thiếu: {jobPostingMissing.join(', ')})
                            </span>
                        )}
                    </div>
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
                                className={`account-settings__avatar-picker${hasDisplayLogo
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
                                className={`recruiter-profile__logo-change${logoLoading || saving
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
                                        {formatBusinessTypeLabel(
                                            profile.businessType,
                                            businessTypeOptions
                                        )}
                                    </span>
                                )}
                                {showVerifiedBadge ? (
                                    <span className="recruiter-profile__badge recruiter-profile__badge--verified">
                                        <CheckCircleIcon width={14} height={14} />
                                        Đã xác thực
                                    </span>
                                ) : (
                                    <div className="recruiter-profile__verify-cluster">
                                        <div className="recruiter-profile__verify-cluster-row">
                                            {isPendingManualVerification(profile.verificationStatus) ? (
                                                <span className="recruiter-profile__badge recruiter-profile__badge--muted">
                                                    <ClockIcon width={14} height={14} />
                                                    Đang chờ duyệt
                                                </span>
                                            ) : isRejectedVerification(profile.verificationStatus) ? (
                                                <span className="recruiter-profile__badge recruiter-profile__badge--muted">
                                                    Xác minh chưa đạt
                                                </span>
                                            ) : needsLicenseTopUp ? (
                                                <span className="recruiter-profile__badge recruiter-profile__badge--muted">
                                                    Cần xác thực GPKD
                                                </span>
                                            ) : profile.verificationStatus === VERIFICATION_STATUS.EXPIRED ? (
                                                <span className="recruiter-profile__badge recruiter-profile__badge--muted">
                                                    Hồ sơ xác minh hết hạn
                                                </span>
                                            ) : (
                                                <span className="recruiter-profile__badge recruiter-profile__badge--muted">
                                                    Chưa xác thực
                                                </span>
                                            )}
                                            {canStartVerification ? (
                                                <Link
                                                    to={
                                                        isRejectedVerification(profile.verificationStatus) ||
                                                            isPendingManualVerification(profile.verificationStatus) ||
                                                            profile.verificationStatus === VERIFICATION_STATUS.EXPIRED
                                                            ? `${ROUTES.RECRUITER_VERIFICATION}?retry=1`
                                                            : ROUTES.RECRUITER_VERIFICATION
                                                    }
                                                    className="recruiter-profile__badge recruiter-profile__badge--verify-cta"
                                                >
                                                    {isPendingManualVerification(profile.verificationStatus)
                                                        ? 'Xem / nộp lại'
                                                        : isRejectedVerification(profile.verificationStatus)
                                                            ? 'Thử lại ngay'
                                                            : profile.verificationStatus ===
                                                                VERIFICATION_STATUS.EXPIRED
                                                                ? 'Nộp lại xác minh'
                                                                : needsLicenseTopUp
                                                                    ? 'Xác thực Giấy phép kinh doanh'
                                                                    : 'Xác minh ngay'}
                                                </Link>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="recruiter-profile__badge recruiter-profile__badge--verify-cta recruiter-profile__badge--verify-cta-disabled"
                                                    disabled
                                                    title={verificationGateHint}
                                                >
                                                    Xác minh ngay
                                                </button>
                                            )}
                                        </div>
                                        {!canStartVerification && verificationGateHint ? (
                                            <p className="recruiter-profile__verify-gate-hint">
                                                {verificationGateHint}
                                            </p>
                                        ) : null}
                                    </div>
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

                                    {showVerifiedBadge && (
                                        <span className="recruiter-profile__trust-badge">
                                            <MapPinIcon width={14} height={14} />
                                            Nhà tuyển dụng uy tín
                                        </span>
                                    )}
                                </div>
                            )}

                            <div
                                className={`recruiter-profile__completion${completionPercent < 100
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
                            className={`recruiter-profile__tab${activeTab === 'info' ? ' recruiter-profile__tab--active' : ''
                                }`}
                            onClick={() => setActiveTab('info')}
                        >
                            Thông tin doanh nghiệp
                        </button>
                        {!noProfile && (
                            <>
                                <button
                                    type="button"
                                    className={`recruiter-profile__tab${activeTab === 'history'
                                            ? ' recruiter-profile__tab--active'
                                            : ''
                                        }`}
                                    onClick={() => setActiveTab('history')}
                                >
                                    Lịch sử tuyển dụng
                                </button>
                                <button
                                    type="button"
                                    className={`recruiter-profile__tab${activeTab === 'reviews'
                                            ? ' recruiter-profile__tab--active'
                                            : ''
                                        }`}
                                    onClick={() => setActiveTab('reviews')}
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
                                        <label htmlFor="rp-business-type">
                                            Loại hình doanh nghiệp
                                            <RequiredMark />
                                        </label>
                                        <select
                                            id="rp-business-type"
                                            value={
                                                toBusinessTypeCode(
                                                    form.businessType,
                                                    businessTypeOptions
                                                ) || ''
                                            }
                                            onChange={(e) =>
                                                updateFormField('businessType', e.target.value)
                                            }
                                            disabled={businessTypeOptions.length === 0}
                                        >
                                            <option value="">
                                                {businessTypeOptions.length === 0
                                                    ? '— Đang tải ngành nghề —'
                                                    : '— Chọn loại hình doanh nghiệp —'}
                                            </option>
                                            {businessTypeOptions.map((opt) => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
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
                                                onClick={() => setAddressModalOpen(true)}
                                                disabled={locationLoading}
                                            >
                                                <MapPinIcon width={14} height={14} />
                                                {hasCommittedAddress
                                                    ? 'Chỉnh sửa địa chỉ'
                                                    : 'Cập nhật địa chỉ'}
                                            </button>
                                        </div>

                                        {locationLoading ? (
                                            <p className="account-settings__hint">
                                                Đang tải địa chỉ...
                                            </p>
                                        ) : hasCommittedAddress ? (
                                            <div className="recruiter-profile__address-committed">
                                                <div className="recruiter-profile__address-display">
                                                    <MapPinIcon width={16} height={16} />
                                                    <span>{addressDisplay}</span>
                                                </div>
                                                <ReadonlyMapPreview
                                                    latitude={coords.latitude}
                                                    longitude={coords.longitude}
                                                    className="recruiter-profile__address-map"
                                                />
                                            </div>
                                        ) : (
                                            <div className="recruiter-profile__address-empty">
                                                Bạn cần cập nhật địa chỉ trụ sở.
                                            </div>
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
                                                to={`${ROUTES.RECRUITER_SETTINGS}?from=profile`}
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

                                    </section>

                                    <button
                                        type="button"
                                        className="account-settings__btn account-settings__btn--primary recruiter-profile__save-btn"
                                        disabled={saving || !canSave || galleryLoading || logoLoading}
                                        title={
                                            galleryLoading || logoLoading
                                                ? 'Vui lòng đợi ảnh đang xử lý xong trước khi lưu.'
                                                : undefined
                                        }
                                        onClick={handleSaveAll}
                                    >
                                        {saving
                                            ? 'Đang lưu...'
                                            : galleryLoading || logoLoading
                                                ? 'Đang xử lý ảnh...'
                                                : noProfile
                                                    ? 'Tạo hồ sơ'
                                                    : 'Lưu thay đổi'}
                                    </button>
                                </div>
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
                                {noProfile || !profile.businessId ? (
                                    <p className="recruiter-profile__verify-gate-hint">
                                        Ảnh chọn trước sẽ được tải lên sau khi bạn tạo hồ sơ. Có thể
                                        sang Cài đặt rồi quay lại mà không mất ảnh đã chọn.
                                    </p>
                                ) : null}

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

                                    {pendingGallery.map((item) => (
                                        <div
                                            key={item.id}
                                            className="recruiter-profile__gallery-item recruiter-profile__gallery-item--deletable"
                                        >
                                            <img
                                                src={item.previewUrl}
                                                alt="Ảnh chưa tải lên"
                                            />
                                            <button
                                                type="button"
                                                className="account-settings__avatar-delete"
                                                disabled={galleryLoading}
                                                aria-label="Xóa ảnh chờ tải"
                                                onClick={() =>
                                                    handleDeletePendingGalleryImage(item.id)
                                                }
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

                    {activeTab === 'history' && !noProfile && (
                        <HiringHistoryTab businessId={profile?.businessId} />
                    )}

                    {activeTab === 'reviews' && !noProfile && (
                        <section className="recruiter-profile__panel">
                            <div className="recruiter-profile__panel-heading">
                                <h2 className="recruiter-profile__panel-title">
                                    <StarIcon width={18} height={18} />
                                    Đánh giá từ ứng viên
                                </h2>
                                {reviewsTotalElements > 0 && (
                                    <span className="recruiter-profile__badge recruiter-profile__badge--muted">
                                        {reviewsTotalElements} đánh giá
                                    </span>
                                )}
                            </div>

                            <div className="recruiter-profile__field">
                                <label htmlFor="rp-review-job">Tin tuyển dụng</label>
                                <select
                                    id="rp-review-job"
                                    value={selectedReviewJobId}
                                    onChange={handleReviewJobChange}
                                    disabled={reviewJobs.length === 0}
                                >
                                    <option value="">Tất cả tin tuyển dụng</option>
                                    {reviewJobs.map((job) => (
                                        <option key={job.id} value={String(job.id)}>
                                            {job.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {reviewsLoading && recruiterReviews.length === 0 && (
                                <p className="account-settings__hint">Đang tải đánh giá…</p>
                            )}

                            {reviewsError && (
                                <div className="account-settings__empty">
                                    <p>{reviewsError}</p>
                                    <button
                                        type="button"
                                        className="account-settings__btn account-settings__btn--secondary"
                                        disabled={reviewsLoading}
                                        onClick={() => loadRecruiterReviews(0)}
                                    >
                                        {reviewsLoading ? 'Đang tải…' : 'Thử lại'}
                                    </button>
                                </div>
                            )}

                            {!reviewsLoading &&
                                !reviewsError &&
                                recruiterReviews.length === 0 && (
                                    <p className="account-settings__hint">
                                        Chưa có đánh giá từ ứng viên cho lựa chọn hiện tại.
                                    </p>
                                )}

                            {recruiterReviews.length > 0 && (
                                <ul className="recruiter-profile__review-list">
                                    {recruiterReviews.map((review) => (
                                        <li
                                            key={review.reviewId}
                                            className="recruiter-profile__review-card"
                                        >
                                            <div className="recruiter-profile__review-top">
                                                {review.candidateAvatar ? (
                                                    <img
                                                        src={review.candidateAvatar}
                                                        alt=""
                                                        className="recruiter-profile__review-avatar"
                                                    />
                                                ) : (
                                                    <div
                                                        className="recruiter-profile__review-avatar recruiter-profile__review-avatar--placeholder"
                                                        aria-hidden="true"
                                                    >
                                                        {(review.candidateName || 'Ứng viên')
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>
                                                )}

                                                <div className="recruiter-profile__review-meta">
                                                    <div className="recruiter-profile__review-title-row">
                                                        <strong>
                                                            {review.candidateName || 'Ứng viên'}
                                                        </strong>
                                                        <span className="recruiter-profile__review-job-pill">
                                                            Tin tuyển dụng: {review.jobTitle || '—'}
                                                        </span>
                                                    </div>
                                                    <div className="recruiter-profile__review-rating-row">
                                                        <span className="recruiter-profile__review-stars">
                                                            {Array.from({ length: 5 }, (_, index) => (
                                                                <StarIcon
                                                                    key={index}
                                                                    width={14}
                                                                    height={14}
                                                                    className={
                                                                        index <
                                                                        Number(review.rating ?? 0)
                                                                            ? 'recruiter-profile__review-star recruiter-profile__review-star--filled'
                                                                            : 'recruiter-profile__review-star'
                                                                    }
                                                                />
                                                            ))}
                                                        </span>
                                                        <span>{review.rating ?? '—'} / 5</span>
                                                        <time dateTime={review.createdAt}>
                                                            {formatReviewDate(review.createdAt)}
                                                        </time>
                                                    </div>
                                                </div>
                                            </div>

                                            {review.comment ? (
                                                <p className="recruiter-profile__review-comment">
                                                    {review.comment}
                                                </p>
                                            ) : (
                                                <p className="recruiter-profile__review-comment recruiter-profile__review-comment--empty">
                                                    Ứng viên không để lại nhận xét.
                                                </p>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {reviewsTotalPages > 1 && (
                                <div className="recruiter-profile__review-pagination">
                                    <button
                                        type="button"
                                        className="account-settings__btn account-settings__btn--secondary"
                                        disabled={reviewsPage <= 0 || reviewsLoading}
                                        onClick={() => loadRecruiterReviews(reviewsPage - 1)}
                                    >
                                        Trước
                                    </button>
                                    <span>
                                        Trang {reviewsPage + 1} / {reviewsTotalPages}
                                    </span>
                                    <button
                                        type="button"
                                        className="account-settings__btn account-settings__btn--secondary"
                                        disabled={
                                            reviewsPage + 1 >= reviewsTotalPages || reviewsLoading
                                        }
                                        onClick={() => loadRecruiterReviews(reviewsPage + 1)}
                                    >
                                        Sau
                                    </button>
                                </div>
                            )}
                        </section>
                    )}
                </>
            )}

            <RecruiterAddressModal
                open={addressModalOpen}
                initialAddress={committedAddress}
                initialCoords={coords}
                onClose={() => setAddressModalOpen(false)}
                onConfirm={handleAddressModalConfirm}
            />
        </div>
    );
};

export default RecruiterProfilePage;
