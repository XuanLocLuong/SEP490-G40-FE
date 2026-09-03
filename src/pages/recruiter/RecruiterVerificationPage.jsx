import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    getVerificationApiErrorMessage,
    isVerificationRetryWithoutRequestError,
    isVerificationSubmitInsteadOfRetryError,
    submitBusinessLicense,
    submitVerification,
} from '../../apis/VerificationApi.jsx';
import recruiterProfileApi from '../../apis/RecruiterProfileApi.jsx';
import { ROUTES } from '../../routes/path.js';
import { mapBusinessTypeOptions } from '../../utils/businessTypeDisplay.js';
import RequiredMark from '../../components/common/RequiredMark.jsx';
import {
    VERIFICATION_STATUS,
    getDisplayExtractedEntries,
    getFormattedFailedReasons,
    getVerificationOutcome,
    getVerificationRejectionReason,
    isBusinessLicenseOnlyFlow,
    isBusinessVerifiedBadge,
    isFullyBusinessVerified,
    isUnverifiedBadge,
    isVerificationExpired,
    isVerificationPendingManual,
    isVerificationRejected,
    resolveRequiresBusinessLicense,
} from '../../utils/verificationDisplay.js';
import '../../assets/styles/RecruiterVerificationPageStyle.css';

const STEPS = [
    { id: 'form', label: 'Hồ sơ' },
    { id: 'result', label: 'Kết quả' },
];

const FileDropzone = ({
    label,
    hint,
    accept = 'image/*,application/pdf',
    file,
    onFileChange,
    disabled = false,
}) => {
    const inputId = `drop-${label.replace(/\s+/g, '-').toLowerCase()}`;
    const [previewUrl, setPreviewUrl] = useState('');

    useEffect(() => {
        if (!file || !String(file.type || '').startsWith('image/')) {
            setPreviewUrl('');
            return undefined;
        }
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    return (
        <label
            htmlFor={inputId}
            className={`rv-dropzone${file ? ' has-file' : ''}${disabled ? ' is-disabled' : ''}${
                previewUrl ? ' has-preview' : ''
            }`}
        >
            <input
                id={inputId}
                type="file"
                accept={accept}
                hidden
                disabled={disabled}
                onChange={(e) => onFileChange(e.target.files?.[0] || null)}
            />
            <strong>{label}</strong>
            {previewUrl ? (
                <span className="rv-dropzone__preview">
                    <img src={previewUrl} alt={`Xem trước ${label}`} />
                </span>
            ) : null}
            <span className="rv-dropzone__meta">
                {file ? file.name : hint}
                {file && previewUrl ? (
                    <em className="rv-dropzone__preview-hint">Kiểm tra ảnh trước khi nộp</em>
                ) : null}
                {file && !previewUrl ? (
                    <em className="rv-dropzone__preview-hint">PDF — không xem trước được</em>
                ) : null}
            </span>
            {file ? (
                <button
                    type="button"
                    className="rv-dropzone__clear"
                    onClick={(e) => {
                        e.preventDefault();
                        onFileChange(null);
                    }}
                >
                    Xóa
                </button>
            ) : null}
        </label>
    );
};

const CertificateImagesField = ({
    files = [],
    onChange,
    disabled = false,
}) => {
    const inputId = 'drop-certificate-images';
    const [previews, setPreviews] = useState([]);

    useEffect(() => {
        const next = (files || []).map((file) => {
            if (file && String(file.type || '').startsWith('image/')) {
                return { name: file.name, url: URL.createObjectURL(file), isImage: true };
            }
            return { name: file?.name || 'file', url: '', isImage: false };
        });
        setPreviews(next);
        return () => {
            next.forEach((item) => {
                if (item.url) URL.revokeObjectURL(item.url);
            });
        };
    }, [files]);

    const appendFiles = (list) => {
        const incoming = Array.from(list || []).filter(Boolean);
        if (!incoming.length) return;
        onChange([...(files || []), ...incoming]);
    };

    const removeAt = (index) => {
        onChange((files || []).filter((_, i) => i !== index));
    };

    return (
        <div className={`rv-multi-upload${disabled ? ' is-disabled' : ''}`}>
            <label htmlFor={inputId} className="rv-dropzone rv-dropzone--multi">
                <input
                    id={inputId}
                    type="file"
                    accept="image/*,application/pdf"
                    multiple
                    hidden
                    disabled={disabled}
                    onChange={(e) => {
                        appendFiles(e.target.files);
                        e.target.value = '';
                    }}
                />
                <strong>GPKD / đăng ký hộ KD</strong>
                <span className="rv-dropzone__meta">
                    {files.length > 0
                        ? `${files.length} trang đã chọn — click để thêm`
                        : 'Chọn nhiều ảnh/PDF các trang giấy phép'}
                </span>
            </label>

            {previews.length > 0 ? (
                <ul className="rv-multi-upload__list">
                    {previews.map((item, index) => (
                        <li key={`${item.name}-${index}`} className="rv-multi-upload__item">
                            {item.isImage && item.url ? (
                                <img src={item.url} alt={`Xem trước ${item.name}`} />
                            ) : (
                                <span className="rv-multi-upload__pdf">PDF</span>
                            )}
                            <span className="rv-multi-upload__name" title={item.name}>
                                {item.name}
                            </span>
                            <button
                                type="button"
                                className="rv-multi-upload__remove"
                                disabled={disabled}
                                onClick={() => removeAt(index)}
                            >
                                Xóa
                            </button>
                        </li>
                    ))}
                </ul>
            ) : null}
        </div>
    );
};

const RecruiterVerificationPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const retryMode = searchParams.get('retry') === '1';

    const [profile, setProfile] = useState(null);
    const [businessTypeOptions, setBusinessTypeOptions] = useState([]);
    const [loadingProfile, setLoadingProfile] = useState(true);

    const [frontImage, setFrontImage] = useState(null);
    const [backImage, setBackImage] = useState(null);
    const [taxCode, setTaxCode] = useState('');
    const [certificateImages, setCertificateImages] = useState([]);
    /** Một trong hai: MST hoặc ảnh GPKD (khớp BE). */
    const [licenseProofMode, setLicenseProofMode] = useState('tax'); // 'tax' | 'certificate'
    const [submitting, setSubmitting] = useState(false);
    const [lastResponse, setLastResponse] = useState(null);

    const [resultKind, setResultKind] = useState(null); // success | pending | rejected
    const [resultPayload, setResultPayload] = useState(null);

    const businessId = profile?.businessId;
    const businessName = profile?.businessName || 'Doanh nghiệp của bạn';
    const needsLicense = resolveRequiresBusinessLicense({
        businessType: profile?.businessType,
        typeOptions: businessTypeOptions,
        profileRequiresBusinessLicense: profile?.requiresBusinessLicense,
    });
    const licenseOnlyFlow = isBusinessLicenseOnlyFlow({
        verificationStatus: profile?.verificationStatus,
        needsLicense,
        badge: profile?.badge,
    });

    // ?retry=1 chỉ mở form khi đang chờ duyệt — KHÔNG tự chọn API.
    // /retry chỉ khi BE đã có request (reject / manual).
    const hasExistingVerificationRequest =
        isVerificationRejected(profile?.verificationStatus) ||
        isVerificationPendingManual(profile?.verificationStatus) ||
        isVerificationExpired(profile?.verificationStatus);

    const useRetryApi = hasExistingVerificationRequest;
    const useLicenseRetryApi =
        licenseOnlyFlow &&
        (profile?.verificationStatus === VERIFICATION_STATUS.BUSINESS_REJECTED ||
            profile?.verificationStatus === VERIFICATION_STATUS.BUSINESS_MANUALLY);

    const isPendingLocked =
        isVerificationPendingManual(profile?.verificationStatus) && !retryMode;

    // URL ?retry=1 nhưng chưa từng nộp → bỏ query để khớp /submit.
    useEffect(() => {
        if (loadingProfile || !profile) return;
        if (retryMode && !hasExistingVerificationRequest && !licenseOnlyFlow) {
            setSearchParams({}, { replace: true });
        }
    }, [
        loadingProfile,
        profile,
        retryMode,
        hasExistingVerificationRequest,
        licenseOnlyFlow,
        setSearchParams,
    ]);

    const applyUiFromProfile = useCallback((data, typeOptions = []) => {
        setProfile(data);
        if (data?.taxCode) {
            setTaxCode((prev) => prev || String(data.taxCode));
            setLicenseProofMode('tax');
        }

        const needsGpkd = resolveRequiresBusinessLicense({
            businessType: data?.businessType,
            typeOptions,
            profileRequiresBusinessLicense: data?.requiresBusinessLicense,
        });
        const licenseOnly = isBusinessLicenseOnlyFlow({
            verificationStatus: data?.verificationStatus,
            needsLicense: needsGpkd,
            badge: data?.badge,
        });

        // Đã CCCD_PASSED nhưng loại cần GPKD → mở form bổ sung (kể cả BE còn badge).
        if (licenseOnly && data?.verificationStatus === VERIFICATION_STATUS.CCCD_PASSED) {
            setResultKind(null);
            return;
        }

        if (isFullyBusinessVerified({
            badge: data?.badge,
            verificationStatus: data?.verificationStatus,
            needsLicense: needsGpkd,
        })) {
            setResultKind('success');
            setResultPayload(data);
            return;
        }

        const outcome = getVerificationOutcome(null, { profile: data });

        if (outcome === 'success') {
            setResultKind('success');
            setResultPayload(data);
            return;
        }

        if (outcome === 'pending' || isVerificationPendingManual(data?.verificationStatus)) {
            if (retryMode) {
                setResultKind(null);
                return;
            }
            setResultKind('pending');
            setResultPayload(data);
            return;
        }

        if (outcome === 'rejected' || isVerificationRejected(data?.verificationStatus)) {
            if (retryMode || licenseOnly) {
                setResultKind(null);
                return;
            }
            setResultKind('rejected');
            setResultPayload(data);
            return;
        }

        if (isVerificationExpired(data?.verificationStatus)) {
            if (retryMode) {
                setResultKind(null);
                return;
            }
            setResultKind('expired');
            setResultPayload(data);
            return;
        }

        setResultKind(null);
    }, [retryMode]);

    const loadProfile = useCallback(async () => {
        setLoadingProfile(true);
        try {
            const [data, types] = await Promise.all([
                recruiterProfileApi.getProfile(),
                recruiterProfileApi.getBusinessTypes().catch(() => []),
            ]);
            const options = mapBusinessTypeOptions(types);
            setBusinessTypeOptions(options);
            applyUiFromProfile(data, options);
            return data;
        } catch (err) {
            toast.error(getVerificationApiErrorMessage(err, 'Không tải được hồ sơ doanh nghiệp.'));
            navigate(ROUTES.RECRUITER_PROFILE);
            return null;
        } finally {
            setLoadingProfile(false);
        }
    }, [applyUiFromProfile, navigate]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const extractedEntries = useMemo(
        () => getDisplayExtractedEntries(lastResponse),
        [lastResponse]
    );
    const rejectReasons = useMemo(() => {
        const fromSubmit = getFormattedFailedReasons(lastResponse);
        if (fromSubmit.length) return fromSubmit;
        const joined = getVerificationRejectionReason(lastResponse || resultPayload);
        return joined ? [joined] : [];
    }, [lastResponse, resultPayload]);

    const showResult = (kind, payload) => {
        setResultKind(kind);
        setResultPayload(payload);
        if (kind === 'pending') {
            toast.info('Hồ sơ đang chờ Manual Team duyệt. Bạn sẽ nhận thông báo trên app JobLink.');
        } else if (kind === 'success') {
            toast.success('Xác minh thành công.');
        } else if (kind === 'rejected') {
            const reasons = getFormattedFailedReasons(payload) || [];
            const fallback = getVerificationRejectionReason(payload);
            const detail = reasons.length ? reasons.join('; ') : fallback;
            toast.warning(
                detail
                    ? `Xác minh chưa thành công: ${detail}`
                    : 'Xác minh chưa thành công. Vui lòng thử lại.'
            );
        }
    };

    const handleSubmit = async () => {
        if (!businessId) {
            toast.error('Thiếu businessId. Vui lòng hoàn thiện hồ sơ trước.');
            return;
        }
        if (
            isFullyBusinessVerified({
                badge: profile?.badge,
                verificationStatus: profile?.verificationStatus,
                needsLicense,
            })
        ) {
            toast.info('Doanh nghiệp đã xác minh.');
            showResult('success', profile);
            return;
        }
        if (isPendingLocked) {
            toast.info('Hồ sơ đang chờ duyệt. Dùng “Nộp lại” nếu muốn gửi bản mới.');
            return;
        }
        if (
            !licenseOnlyFlow &&
            !isUnverifiedBadge(profile?.badge) &&
            !useRetryApi
        ) {
            toast.info('Không thể nộp mới khi badge không còn UNVERIFIED. Dùng nộp lại nếu được phép.');
            return;
        }

        const trimmedTax = taxCode.trim();
        if (needsLicense || licenseOnlyFlow) {
            if (licenseProofMode === 'tax') {
                if (!trimmedTax) {
                    toast.error('Vui lòng nhập mã số thuế.');
                    return;
                }
            } else if (certificateImages.length === 0) {
                toast.error('Vui lòng tải ít nhất một ảnh giấy phép kinh doanh.');
                return;
            }
        }

        if (!licenseOnlyFlow && (!frontImage || !backImage)) {
            toast.error('Vui lòng tải đủ mặt trước và mặt sau CCCD.');
            return;
        }

        const licenseTax =
            (needsLicense || licenseOnlyFlow) && licenseProofMode === 'tax'
                ? trimmedTax
                : undefined;
        const licenseCertificates =
            (needsLicense || licenseOnlyFlow) && licenseProofMode === 'certificate'
                ? certificateImages
                : [];

        setSubmitting(true);
        try {
            let usedRetry = licenseOnlyFlow ? useLicenseRetryApi : useRetryApi;
            let data;

            if (licenseOnlyFlow) {
                const licensePayload = {
                    businessId,
                    taxCode: licenseTax,
                    certificateImages: licenseCertificates,
                };
                try {
                    data = await submitBusinessLicense(licensePayload, { retry: usedRetry });
                } catch (firstErr) {
                    if (usedRetry && isVerificationRetryWithoutRequestError(firstErr)) {
                        usedRetry = false;
                        data = await submitBusinessLicense(licensePayload, { retry: false });
                    } else if (!usedRetry && isVerificationSubmitInsteadOfRetryError(firstErr)) {
                        usedRetry = true;
                        data = await submitBusinessLicense(licensePayload, { retry: true });
                    } else {
                        throw firstErr;
                    }
                }
            } else {
                const payload = {
                    businessId,
                    frontImage,
                    backImage,
                    taxCode: needsLicense ? licenseTax : undefined,
                    certificateImages: needsLicense ? licenseCertificates : [],
                };
                try {
                    data = await submitVerification(payload, { retry: usedRetry });
                } catch (firstErr) {
                    if (usedRetry && isVerificationRetryWithoutRequestError(firstErr)) {
                        usedRetry = false;
                        data = await submitVerification(payload, { retry: false });
                    } else if (!usedRetry && isVerificationSubmitInsteadOfRetryError(firstErr)) {
                        usedRetry = true;
                        data = await submitVerification(payload, { retry: true });
                    } else {
                        throw firstErr;
                    }
                }
            }

            setLastResponse(data);

            const refreshed = await recruiterProfileApi.getProfile().catch(() => null);
            if (refreshed) setProfile(refreshed);

            const outcome = getVerificationOutcome(data, { profile: refreshed || profile });

            const refreshedNeedsLicense = resolveRequiresBusinessLicense({
                businessType: refreshed?.businessType || profile?.businessType,
                typeOptions: businessTypeOptions,
                profileRequiresBusinessLicense: refreshed?.requiresBusinessLicense,
            });
            const fullyVerified = isFullyBusinessVerified({
                badge: refreshed?.badge,
                verificationStatus: refreshed?.verificationStatus,
                needsLicense: refreshedNeedsLicense,
            });

            if (outcome === 'success' || fullyVerified) {
                showResult('success', data);
            } else if (outcome === 'pending') {
                showResult('pending', data);
            } else if (outcome === 'rejected') {
                showResult('rejected', data);
            } else {
                const fromProfile = getVerificationOutcome(null, { profile: refreshed || profile });
                if (fromProfile === 'success' && fullyVerified) showResult('success', data);
                else if (fromProfile === 'pending') showResult('pending', data);
                else if (fromProfile === 'rejected') showResult('rejected', data);
                else showResult('pending', data);
            }
        } catch (err) {
            toast.error(getVerificationApiErrorMessage(err, 'Gửi hồ sơ xác minh thất bại.'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleRetry = () => {
        setResultKind(null);
        setResultPayload(null);
        setLastResponse(null);
        setFrontImage(null);
        setBackImage(null);
        setCertificateImages([]);
        setLicenseProofMode('tax');
        setSearchParams({ retry: '1' }, { replace: true });
    };

    const goBackHome = () => navigate(ROUTES.RECRUITER_PROFILE);

    if (loadingProfile) {
        return (
            <div className="rv-page">
                <p className="rv-page__empty">Đang tải thông tin xác minh…</p>
            </div>
        );
    }

    if (!businessId) {
        return (
            <div className="rv-page">
                <div className="rv-card rv-card--center">
                    <h1>Chưa có hồ sơ doanh nghiệp</h1>
                    <p>Vui lòng tạo hồ sơ trước khi xác minh giấy tờ.</p>
                    <Link className="rv-btn rv-btn--primary" to={ROUTES.RECRUITER_PROFILE}>
                        Đi tới hồ sơ
                    </Link>
                </div>
            </div>
        );
    }

    const visualStepIndex = resultKind != null ? 1 : 0;

    return (
        <div className="rv-page">
            <header className="rv-page__top">
                <Link to={ROUTES.RECRUITER_PROFILE} className="rv-back">
                    ← Hồ sơ nhà tuyển dụng
                </Link>
                <h1>Xác minh doanh nghiệp</h1>
                <p>
                    {licenseOnlyFlow
                        ? 'Bạn đã xác minh CCCD. Bổ sung mã số thuế hoặc ảnh GPKD cho loại hình hiện tại.'
                        : needsLicense
                          ? 'Loại hình này cần CCCD cùng MST hoặc giấy phép kinh doanh trong một lần nộp.'
                          : 'Loại hình này chỉ cần nộp CCCD mặt trước và mặt sau.'}
                </p>
            </header>

            <ol
                className={`rv-stepper rv-stepper--two${visualStepIndex > 0 ? ' rv-stepper--line-done' : ''}`}
                aria-label="Các bước xác minh"
            >
                {STEPS.map((step, index) => {
                    const done = index < visualStepIndex;
                    const active = index === visualStepIndex;
                    return (
                        <li
                            key={step.id}
                            className={`rv-stepper__item${done ? ' is-done' : ''}${active ? ' is-active' : ''}`}
                        >
                            <span className="rv-stepper__dot" aria-hidden>
                                {done ? '✓' : index + 1}
                            </span>
                            <span className="rv-stepper__label">{step.label}</span>
                        </li>
                    );
                })}
            </ol>

            {resultKind == null && !isPendingLocked && (
                <section className="rv-card">
                    <h2>{licenseOnlyFlow ? 'Bổ sung giấy phép / MST' : 'Nộp hồ sơ xác minh'}</h2>
                    <p className="rv-card__sub">
                        {licenseOnlyFlow
                            ? 'Không cần upload lại CCCD. Chọn MST hoặc upload ảnh GPKD (một trong hai).'
                            : `Hệ thống xử lý CCCD${needsLicense ? ' và MST hoặc giấy phép' : ''} trong cùng một lần nộp.`}
                        {useRetryApi || useLicenseRetryApi ? ' Bạn đang ở chế độ nộp lại (retry).' : ''}
                    </p>

                    {!licenseOnlyFlow ? (
                        <div className="rv-upload-grid">
                            <FileDropzone
                                label="Mặt trước CCCD"
                                hint="Kéo thả hoặc click để tải lên"
                                file={frontImage}
                                onFileChange={setFrontImage}
                                disabled={submitting}
                            />
                            <FileDropzone
                                label="Mặt sau CCCD"
                                hint="Kéo thả hoặc click để tải lên"
                                file={backImage}
                                onFileChange={setBackImage}
                                disabled={submitting}
                            />
                        </div>
                    ) : null}

                    {extractedEntries.length > 0 && (
                        <div className="rv-ocr">
                            <h3>Thông tin trích xuất (nếu có)</h3>
                            <dl className="rv-ocr__grid">
                                {extractedEntries.map((item) => (
                                    <div key={item.label}>
                                        <dt>{item.label}</dt>
                                        <dd>{item.value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    )}

                    {needsLicense || licenseOnlyFlow ? (
                        <>
                            <span className="rv-pill">
                                {licenseOnlyFlow
                                    ? 'Bổ sung theo loại hình hiện tại'
                                    : 'Bắt buộc với loại hình cần GPKD'}
                            </span>
                            <label className="rv-field">
                                <span>Tên doanh nghiệp</span>
                                <input type="text" value={businessName} readOnly />
                            </label>

                            <div className="rv-field">
                                <span>Phương thức xác thực giấy phép</span>
                                <div
                                    className="rv-segment"
                                    role="radiogroup"
                                    aria-label="Chọn MST hoặc ảnh GPKD"
                                >
                                    <button
                                        type="button"
                                        role="radio"
                                        aria-checked={licenseProofMode === 'tax'}
                                        className={`rv-segment__btn${
                                            licenseProofMode === 'tax' ? ' is-active' : ''
                                        }`}
                                        disabled={submitting}
                                        onClick={() => {
                                            setLicenseProofMode('tax');
                                            setCertificateImages([]);
                                        }}
                                    >
                                        Có mã số thuế
                                    </button>
                                    <button
                                        type="button"
                                        role="radio"
                                        aria-checked={licenseProofMode === 'certificate'}
                                        className={`rv-segment__btn${
                                            licenseProofMode === 'certificate' ? ' is-active' : ''
                                        }`}
                                        disabled={submitting}
                                        onClick={() => {
                                            setLicenseProofMode('certificate');
                                            setTaxCode('');
                                        }}
                                    >
                                        Upload giấy phép
                                    </button>
                                </div>
                                <small className="rv-field__hint">
                                    Chỉ cần một trong hai. Ưu tiên MST nếu doanh nghiệp đã có.
                                </small>
                            </div>

                            {licenseProofMode === 'tax' ? (
                                <label className="rv-field">
                                    <span>
                                        Mã số thuế <RequiredMark />
                                    </span>
                                    <input
                                        type="text"
                                        value={taxCode}
                                        onChange={(e) => setTaxCode(e.target.value)}
                                        placeholder="Mã số thuế 10 hoặc 13 số"
                                        disabled={submitting}
                                    />
                                    <small className="rv-field__hint">
                                        Hệ thống sẽ tra cứu thuế theo MST.
                                    </small>
                                </label>
                            ) : (
                                <div className="rv-field">
                                    <span>
                                        Ảnh giấy phép (nhiều trang) <RequiredMark />
                                    </span>
                                    <CertificateImagesField
                                        files={certificateImages}
                                        onChange={setCertificateImages}
                                        disabled={submitting}
                                    />
                                    <small className="rv-field__hint">
                                        Dùng khi không có MST. Có thể chọn nhiều trang giấy phép.
                                    </small>
                                </div>
                            )}
                        </>
                    ) : null}

                    <div className="rv-card__actions">
                        <button type="button" className="rv-btn rv-btn--ghost" onClick={goBackHome}>
                            Quay lại
                        </button>
                        <button
                            type="button"
                            className="rv-btn rv-btn--primary"
                            disabled={submitting}
                            onClick={handleSubmit}
                        >
                            {submitting
                                ? 'Đang gửi…'
                                : useRetryApi || useLicenseRetryApi
                                  ? 'Nộp lại hồ sơ'
                                  : licenseOnlyFlow
                                    ? 'Gửi xác thực Giấy phép kinh doanh'
                                    : 'Gửi hồ sơ xác minh'}
                        </button>
                    </div>
                </section>
            )}

            {resultKind === 'success' && (
                <section className="rv-card rv-card--center">
                    <div className="rv-result-icon rv-result-icon--success" aria-hidden>
                        ✓
                    </div>
                    <h2>Xác minh thành công!</h2>
                    <p>
                        {needsLicense
                            ? 'Doanh nghiệp đã được xác minh. Bạn có thể đăng tin tuyển dụng.'
                            : 'Hồ sơ đã được xác minh qua CCCD. Bạn có thể đăng tin tuyển dụng.'}
                    </p>
                    <div className="rv-card__actions rv-card__actions--center">
                        <Link to={ROUTES.RECRUITER_CREATE_JOB} className="rv-btn rv-btn--primary">
                            Đăng tin ngay
                        </Link>
                        <Link to={ROUTES.RECRUITER_HOME} className="rv-btn rv-btn--ghost">
                            Về trang chủ
                        </Link>
                    </div>
                </section>
            )}

            {(resultKind === 'pending' || isPendingLocked) && (
                <section className="rv-card rv-card--center">
                    <div className="rv-result-icon rv-result-icon--pending" aria-hidden>
                        …
                    </div>
                    <h2>Hồ sơ đang chờ duyệt</h2>
                    <p>
                        {licenseOnlyFlow
                            ? 'Manual Team đang xem xét giấy phép / MST. Nếu cần sửa, dùng nút nộp lại - không cần upload lại CCCD.'
                            : 'Manual Team đang xem xét. Nếu cần sửa, dùng nút nộp lại.'}
                    </p>
                    <div className="rv-card__actions rv-card__actions--center">
                        <Link to={ROUTES.RECRUITER_HOME} className="rv-btn rv-btn--primary">
                            Về trang chủ
                        </Link>
                        <button type="button" className="rv-btn rv-btn--ghost" onClick={handleRetry}>
                            Nộp lại
                        </button>
                    </div>
                    <p className="rv-info-bar">
                        Bạn sẽ nhận được thông báo trên JobLink ngay khi hoàn tất.
                    </p>
                </section>
            )}

            {resultKind === 'rejected' && (
                <section className="rv-card rv-card--center">
                    <div className="rv-result-icon rv-result-icon--danger" aria-hidden>
                        ×
                    </div>
                    <h2>Xác minh không thành công</h2>
                    {rejectReasons.length > 0 ? (
                        <ul className="rv-reason-list">
                            {rejectReasons.map((reason) => (
                                <li key={reason}>{reason}</li>
                            ))}
                        </ul>
                    ) : null}
                    {extractedEntries.length > 0 ? (
                        <div className="rv-ocr rv-ocr--result">
                            <h3>Thông tin OCR đã đọc</h3>
                            <dl className="rv-ocr__grid">
                                {extractedEntries.map((item) => (
                                    <div key={item.label}>
                                        <dt>{item.label}</dt>
                                        <dd>{item.value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    ) : null}
                    <p>Vui lòng chuẩn bị lại giấy tờ rõ nét rồi nộp lại.</p>
                    <div className="rv-card__actions rv-card__actions--center">
                        <button type="button" className="rv-btn rv-btn--primary" onClick={handleRetry}>
                            Thử lại
                        </button>
                        <Link to={ROUTES.RECRUITER_PROFILE} className="rv-btn rv-btn--ghost">
                            Về hồ sơ
                        </Link>
                    </div>
                </section>
            )}

            {resultKind === 'expired' && (
                <section className="rv-card rv-card--center">
                    <div className="rv-result-icon rv-result-icon--danger" aria-hidden>
                        !
                    </div>
                    <h2>Hồ sơ xác minh đã hết hạn</h2>
                    <p>
                        Yêu cầu xác minh trước đó đã hết hạn lưu trữ. Vui lòng nộp lại giấy tờ để tiếp
                        tục.
                    </p>
                    <div className="rv-card__actions rv-card__actions--center">
                        <button type="button" className="rv-btn rv-btn--primary" onClick={handleRetry}>
                            Nộp lại xác minh
                        </button>
                        <Link to={ROUTES.RECRUITER_PROFILE} className="rv-btn rv-btn--ghost">
                            Về hồ sơ
                        </Link>
                    </div>
                </section>
            )}
        </div>
    );
};

export default RecruiterVerificationPage;
