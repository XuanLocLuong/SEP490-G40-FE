import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    getVerificationApiErrorMessage,
    isVerificationRetryWithoutRequestError,
    submitVerification,
} from '../../apis/VerificationApi.jsx';
import recruiterProfileApi from '../../apis/RecruiterProfileApi.jsx';
import { ROUTES } from '../../routes/path.js';
import {
    getDisplayExtractedEntries,
    getFormattedFailedReasons,
    getVerificationOutcome,
    getVerificationRejectionReason,
    isBusinessVerifiedBadge,
    isIndividualBusinessType,
    isUnverifiedBadge,
    isVerificationPendingManual,
    isVerificationRejected,
    requiresBusinessLicenseVerification,
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
    const [loadingProfile, setLoadingProfile] = useState(true);

    const [frontImage, setFrontImage] = useState(null);
    const [backImage, setBackImage] = useState(null);
    const [taxCode, setTaxCode] = useState('');
    const [certificateImages, setCertificateImages] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [lastResponse, setLastResponse] = useState(null);

    const [resultKind, setResultKind] = useState(null); // success | pending | rejected
    const [resultPayload, setResultPayload] = useState(null);

    const businessId = profile?.businessId;
    const businessName = profile?.businessName || 'Doanh nghiệp của bạn';
    const isIndividual = isIndividualBusinessType(profile?.businessType);
    const needsLicense = requiresBusinessLicenseVerification(profile?.businessType);

    // ?retry=1 chỉ mở form khi đang chờ duyệt — KHÔNG tự chọn API.
    // /retry chỉ khi BE đã có request (reject / manual).
    const hasExistingVerificationRequest =
        isVerificationRejected(profile?.verificationStatus) ||
        isVerificationPendingManual(profile?.verificationStatus);

    const useRetryApi = hasExistingVerificationRequest;

    const isPendingLocked =
        isVerificationPendingManual(profile?.verificationStatus) && !retryMode;

    // URL ?retry=1 nhưng chưa từng nộp → bỏ query để khớp /submit.
    useEffect(() => {
        if (loadingProfile || !profile) return;
        if (retryMode && !hasExistingVerificationRequest) {
            setSearchParams({}, { replace: true });
        }
    }, [
        loadingProfile,
        profile,
        retryMode,
        hasExistingVerificationRequest,
        setSearchParams,
    ]);

    const applyUiFromProfile = useCallback(
        (data) => {
            setProfile(data);
            if (data?.taxCode) {
                setTaxCode((prev) => prev || String(data.taxCode));
            }

            const outcome = getVerificationOutcome(null, { profile: data });

            if (outcome === 'success' || isBusinessVerifiedBadge(data?.badge)) {
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
                if (retryMode) {
                    setResultKind(null);
                    return;
                }
                setResultKind('rejected');
                setResultPayload(data);
                return;
            }

            setResultKind(null);
        },
        [retryMode]
    );

    const loadProfile = useCallback(async () => {
        setLoadingProfile(true);
        try {
            const data = await recruiterProfileApi.getProfile();
            applyUiFromProfile(data);
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
        if (isBusinessVerifiedBadge(profile?.badge)) {
            toast.info('Doanh nghiệp đã xác minh.');
            showResult('success', profile);
            return;
        }
        if (isPendingLocked) {
            toast.info('Hồ sơ đang chờ duyệt. Dùng “Nộp lại” nếu muốn gửi bản mới.');
            return;
        }
        if (!isUnverifiedBadge(profile?.badge) && !useRetryApi) {
            toast.info('Không thể nộp mới khi badge không còn UNVERIFIED. Dùng nộp lại nếu được phép.');
            return;
        }
        if (!frontImage || !backImage) {
            toast.error('Vui lòng tải đủ mặt trước và mặt sau CCCD.');
            return;
        }

        const trimmedTax = taxCode.trim();
        if (needsLicense && !trimmedTax && certificateImages.length === 0) {
            toast.error('Doanh nghiệp thường cần mã số thuế hoặc ảnh giấy phép (ít nhất một trong hai).');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                businessId,
                frontImage,
                backImage,
                taxCode: needsLicense ? trimmedTax || undefined : undefined,
                certificateImages: needsLicense ? certificateImages : [],
            };

            let usedRetry = useRetryApi;
            let data;
            try {
                data = await submitVerification(payload, { retry: usedRetry });
            } catch (firstErr) {
                // Race / status lệch: BE chưa có request → fallback /submit một lần.
                if (usedRetry && isVerificationRetryWithoutRequestError(firstErr)) {
                    usedRetry = false;
                    data = await submitVerification(payload, { retry: false });
                } else {
                    throw firstErr;
                }
            }

            setLastResponse(data);

            const refreshed = await recruiterProfileApi.getProfile().catch(() => null);
            if (refreshed) setProfile(refreshed);

            const outcome = getVerificationOutcome(data, { profile: refreshed || profile });

            // Giữ submit/retry body (formatted*) làm payload kết quả; profile chỉ để map outcome.
            if (outcome === 'success' || isBusinessVerifiedBadge(refreshed?.badge)) {
                showResult('success', data);
            } else if (outcome === 'pending') {
                showResult('pending', data);
            } else if (outcome === 'rejected') {
                showResult('rejected', data);
            } else {
                const fromProfile = getVerificationOutcome(null, { profile: refreshed || profile });
                if (fromProfile === 'success') showResult('success', data);
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
                    {isIndividual
                        ? 'Loại Cá nhân (INDIVIDUAL): nộp CCCD mặt trước và mặt sau trong một lần.'
                        : 'Doanh nghiệp (FNB / Retail / Services): nộp CCCD + MST hoặc giấy phép trong một lần.'}
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
                    <h2>Nộp hồ sơ xác minh</h2>
                    <p className="rv-card__sub">
                        Hệ thống xử lý CCCD
                        {needsLicense ? ' và MST/giấy phép' : ''} trong cùng một lần nộp.
                        {useRetryApi ? ' Bạn đang ở chế độ nộp lại (retry).' : ''}
                    </p>

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

                    {needsLicense ? (
                        <>
                            <span className="rv-pill">Bắt buộc với doanh nghiệp thường</span>
                            <label className="rv-field">
                                <span>Tên doanh nghiệp</span>
                                <input type="text" value={businessName} readOnly />
                            </label>

                            <label className="rv-field">
                                <span>Mã số thuế (khuyến nghị)</span>
                                <input
                                    type="text"
                                    value={taxCode}
                                    onChange={(e) => setTaxCode(e.target.value)}
                                    placeholder="Mã số thuế 10 hoặc 13 số"
                                    disabled={submitting}
                                />
                                <small className="rv-field__hint">
                                    Có MST thì BE ưu tiên tra cứu thuế — kể cả khi kèm ảnh GPKD.
                                </small>
                            </label>

                            <div className="rv-field">
                                <span>Ảnh giấy phép (nhiều trang — nếu không có MST)</span>
                                <CertificateImagesField
                                    files={certificateImages}
                                    onChange={setCertificateImages}
                                    disabled={submitting}
                                />
                                <small className="rv-field__hint">
                                    Có thể chọn nhiều trang giấy phép. Có MST thì không bắt buộc kèm ảnh.
                                </small>
                            </div>
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
                                : useRetryApi
                                  ? 'Nộp lại hồ sơ'
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
                        {isIndividual
                            ? 'Tài khoản cá nhân đã được xác minh qua CCCD.'
                            : 'Doanh nghiệp đã được xác minh. Bạn có thể đăng tin tuyển dụng.'}
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
                        Manual Team đang xem xét. Không gửi lại bằng API nộp mới — nếu cần sửa, dùng
                        nút nộp lại (retry).
                    </p>
                    <div className="rv-card__actions rv-card__actions--center">
                        <Link to={ROUTES.RECRUITER_HOME} className="rv-btn rv-btn--primary">
                            Về trang chủ
                        </Link>
                        <button type="button" className="rv-btn rv-btn--ghost" onClick={handleRetry}>
                            Nộp lại (retry)
                        </button>
                    </div>
                    <p className="rv-info-bar">
                        Bạn sẽ nhận được thông báo trên app JobLink ngay khi hoàn tất.
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
                    <p>Vui lòng chuẩn bị lại giấy tờ rõ nét rồi nộp lại bằng API retry.</p>
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
        </div>
    );
};

export default RecruiterVerificationPage;
