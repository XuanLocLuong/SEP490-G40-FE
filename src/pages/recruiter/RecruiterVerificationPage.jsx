import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    getVerificationApiErrorMessage,
    submitBusinessLicenseVerification,
    submitCccdVerification,
} from '../../apis/VerificationApi.jsx';
import recruiterProfileApi from '../../apis/RecruiterProfileApi.jsx';
import { ROUTES } from '../../routes/path.js';
import {
    getVerificationOutcome,
    getVerificationRejectionReason,
    isBusinessVerifiedBadge,
    isIndividualBusinessType,
    isVerificationPendingManual,
    isVerificationRejected,
    pickCccdExtractedFields,
    requiresBusinessLicenseVerification,
} from '../../utils/verificationDisplay.js';
import '../../assets/styles/RecruiterVerificationPageStyle.css';

const STEPS_FULL = [
    { id: 'cccd', label: 'Xác minh' },
    { id: 'business', label: 'Giấy tờ' },
    { id: 'result', label: 'Kết quả' },
];

const STEPS_INDIVIDUAL = [
    { id: 'cccd', label: 'Xác minh' },
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

    return (
        <label
            htmlFor={inputId}
            className={`rv-dropzone${file ? ' has-file' : ''}${disabled ? ' is-disabled' : ''}`}
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
            <span>{file ? file.name : hint}</span>
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

const RecruiterVerificationPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const retryMode = searchParams.get('retry') === '1';

    const [stepIndex, setStepIndex] = useState(0);
    const [profile, setProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);

    const [frontImage, setFrontImage] = useState(null);
    const [backImage, setBackImage] = useState(null);
    const [cccdResult, setCccdResult] = useState(null);
    const [cccdDone, setCccdDone] = useState(false);
    const [cccdSubmitting, setCccdSubmitting] = useState(false);

    const [taxCode, setTaxCode] = useState('');
    const [certificateImage, setCertificateImage] = useState(null);
    const [businessImages, setBusinessImages] = useState([]);
    const [businessSubmitting, setBusinessSubmitting] = useState(false);

    const [resultKind, setResultKind] = useState(null); // success | pending | rejected
    const [resultPayload, setResultPayload] = useState(null);
    const [resultSource, setResultSource] = useState(null); // cccd | business

    const businessId = profile?.businessId;
    const businessName = profile?.businessName || 'Doanh nghiệp của bạn';
    const isIndividual = isIndividualBusinessType(profile?.businessType);
    const needsLicense = requiresBusinessLicenseVerification(profile?.businessType);
    const steps = isIndividual ? STEPS_INDIVIDUAL : STEPS_FULL;

    const isPendingLocked =
        isVerificationPendingManual(profile?.verificationStatus) && !retryMode;

    const applyUiFromProfile = useCallback((data, { preferRetry = false } = {}) => {
        setProfile(data);
        if (data?.taxCode && !preferRetry) {
            setTaxCode((prev) => prev || String(data.taxCode));
        }

        const individual = isIndividualBusinessType(data?.businessType);
        const outcome = getVerificationOutcome(null, { isIndividual: individual, profile: data });

        if (outcome === 'success' || isBusinessVerifiedBadge(data?.badge)) {
            setResultKind('success');
            setResultPayload(data);
            setResultSource('business');
            setStepIndex(individual ? 1 : 2);
            return;
        }

        if (outcome === 'pending' || isVerificationPendingManual(data?.verificationStatus)) {
            if (preferRetry || retryMode) {
                setResultKind(null);
                const status = data?.verificationStatus;
                if (String(status || '').includes('CCCD')) setStepIndex(0);
                else setStepIndex(individual ? 0 : 1);
                return;
            }
            setResultKind('pending');
            setResultPayload(data);
            setResultSource(String(data?.verificationStatus || '').includes('CCCD') ? 'cccd' : 'business');
            setStepIndex(individual ? 1 : 2);
            return;
        }

        if (outcome === 'rejected' || isVerificationRejected(data?.verificationStatus)) {
            if (preferRetry || retryMode) {
                setResultKind(null);
                setStepIndex(0);
                return;
            }
            setResultKind('rejected');
            setResultPayload(data);
            setResultSource('business');
            setStepIndex(individual ? 1 : 2);
            return;
        }

        if (outcome === 'cccd_ok' || data?.verificationStatus === 'CCCD_PASSED') {
            setCccdDone(true);
            setResultKind(null);
            setStepIndex(individual ? 1 : 1); // individual shouldn't land here if badge set; company → business step
            if (!individual) setStepIndex(1);
            else {
                // Individual nhưng chưa badge — coi như chờ / chưa xong
                setStepIndex(0);
            }
            return;
        }

        setStepIndex(0);
    }, [retryMode]);

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

    const extracted = useMemo(() => pickCccdExtractedFields(cccdResult), [cccdResult]);

    const showResult = (kind, payload, source, stepForResult) => {
        setResultKind(kind);
        setResultPayload(payload);
        setResultSource(source);
        setStepIndex(stepForResult);
        if (kind === 'pending') {
            toast.info('Hồ sơ đang chờ Manual Team duyệt. Bạn sẽ nhận thông báo trên app JobLink.');
        } else if (kind === 'success') {
            toast.success('Xác minh thành công.');
        } else if (kind === 'rejected') {
            toast.warning('Xác minh chưa thành công. Vui lòng thử lại.');
        }
    };

    const handleSubmitCccd = async () => {
        if (!businessId) {
            toast.error('Thiếu businessId. Vui lòng hoàn thiện hồ sơ trước.');
            return;
        }
        if (isBusinessVerifiedBadge(profile?.badge)) {
            toast.info('Doanh nghiệp đã xác minh. Không cần nộp lại CCCD.');
            showResult('success', profile, 'cccd', isIndividual ? 1 : 2);
            return;
        }
        if (!frontImage || !backImage) {
            toast.error('Vui lòng tải đủ mặt trước và mặt sau CCCD.');
            return;
        }

        const useRetry =
            retryMode ||
            isVerificationRejected(profile?.verificationStatus) ||
            isVerificationPendingManual(profile?.verificationStatus);

        setCccdSubmitting(true);
        try {
            const data = await submitCccdVerification(
                { businessId, frontImage, backImage },
                { retry: useRetry }
            );
            setCccdResult(data);
            const refreshed = await recruiterProfileApi.getProfile().catch(() => null);
            if (refreshed) setProfile(refreshed);

            const individual = isIndividualBusinessType(refreshed?.businessType || profile?.businessType);
            const outcome = getVerificationOutcome(data, {
                isIndividual: individual,
                profile: refreshed || profile,
            });

            if (outcome === 'success') {
                showResult('success', refreshed || data, 'cccd', individual ? 1 : 2);
                return;
            }
            if (outcome === 'pending') {
                showResult('pending', refreshed || data, 'cccd', individual ? 1 : 2);
                return;
            }
            if (outcome === 'rejected') {
                showResult('rejected', refreshed || data, 'cccd', individual ? 1 : 2);
                return;
            }

            // CCCD ok nhưng DN thường → bước giấy tờ
            setCccdDone(true);
            if (individual) {
                // Chưa đủ badge nhưng individual — refresh lại
                toast.success('Đã xử lý CCCD.');
                if (refreshed) applyUiFromProfile(refreshed);
            } else {
                toast.success('Đã xác minh CCCD. Tiếp tục nộp MST hoặc giấy phép kinh doanh.');
                setStepIndex(1);
            }
        } catch (err) {
            toast.error(getVerificationApiErrorMessage(err, 'Gửi CCCD thất bại.'));
        } finally {
            setCccdSubmitting(false);
        }
    };

    const handleContinueFromCccd = () => {
        if (!cccdDone) {
            handleSubmitCccd();
            return;
        }
        if (isIndividual) {
            loadProfile();
            return;
        }
        setStepIndex(1);
    };

    const handleSubmitBusiness = async () => {
        if (!businessId) {
            toast.error('Thiếu businessId.');
            return;
        }
        if (isPendingLocked) {
            toast.info('Hồ sơ đang chờ duyệt. Dùng “Nộp lại” nếu muốn gửi bản mới.');
            return;
        }
        const trimmedTax = taxCode.trim();
        if (!trimmedTax && !certificateImage) {
            toast.error('Nhập mã số thuế hoặc tải ảnh giấy phép (cần ít nhất một trong hai).');
            return;
        }

        const useRetry =
            retryMode ||
            isVerificationRejected(profile?.verificationStatus) ||
            isVerificationPendingManual(profile?.verificationStatus);

        setBusinessSubmitting(true);
        try {
            const data = await submitBusinessLicenseVerification(
                {
                    businessId,
                    taxCode: trimmedTax || undefined,
                    certificateImage: certificateImage || undefined,
                    businessImages,
                },
                { retry: useRetry }
            );
            const refreshed = await recruiterProfileApi.getProfile().catch(() => null);
            if (refreshed) setProfile(refreshed);

            const outcome = getVerificationOutcome(data, {
                isIndividual: false,
                profile: refreshed || profile,
            });

            if (outcome === 'success' || isBusinessVerifiedBadge(refreshed?.badge)) {
                showResult('success', refreshed || data, 'business', 2);
            } else if (outcome === 'pending') {
                showResult('pending', refreshed || data, 'business', 2);
            } else if (outcome === 'rejected') {
                showResult('rejected', refreshed || data, 'business', 2);
            } else {
                showResult('pending', refreshed || data, 'business', 2);
            }
        } catch (err) {
            toast.error(getVerificationApiErrorMessage(err, 'Gửi giấy tờ doanh nghiệp thất bại.'));
        } finally {
            setBusinessSubmitting(false);
        }
    };

    const handleRetry = () => {
        setResultKind(null);
        setResultPayload(null);
        setCccdResult(null);
        setCccdDone(profile?.verificationStatus === 'CCCD_PASSED');
        setFrontImage(null);
        setBackImage(null);
        setCertificateImage(null);
        setBusinessImages([]);
        setSearchParams({ retry: '1' }, { replace: true });
        if (resultSource === 'business' || profile?.verificationStatus === 'BUSINESS_REJECTED') {
            setStepIndex(needsLicense ? 1 : 0);
        } else {
            setStepIndex(0);
        }
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

    const resultStepIndex = isIndividual ? 1 : 2;
    const visualStepIndex =
        resultKind != null
            ? resultStepIndex
            : isIndividual && stepIndex > 0
              ? 1
              : stepIndex;

    return (
        <div className="rv-page">
            <header className="rv-page__top">
                <Link to={ROUTES.RECRUITER_PROFILE} className="rv-back">
                    ← Hồ sơ nhà tuyển dụng
                </Link>
                <h1>Xác minh doanh nghiệp</h1>
                <p>
                    {isIndividual
                        ? 'Loại Cá nhân (INDIVIDUAL): xác minh CCCD thành công là đủ.'
                        : 'Doanh nghiệp (FNB / Retail / Services): CCCD (nếu cần) + MST hoặc giấy phép kinh doanh.'}
                </p>
            </header>

            <ol
                className={`rv-stepper${isIndividual ? ' rv-stepper--two' : ''}`}
                aria-label="Các bước xác minh"
            >
                {steps.map((step, index) => {
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
                            <span>{step.label}</span>
                        </li>
                    );
                })}
            </ol>

            {resultKind == null && stepIndex === 0 && !isPendingLocked && (
                <section className="rv-card">
                    <h2>Tải lên giấy tờ tùy thân</h2>
                    <p className="rv-card__sub">
                        Vui lòng tải ảnh mặt trước và mặt sau CCCD để hệ thống tự động trích xuất thông tin.
                    </p>
                    <div className="rv-upload-grid">
                        <FileDropzone
                            label="Mặt trước CCCD"
                            hint="Kéo thả hoặc click để tải lên"
                            file={frontImage}
                            onFileChange={setFrontImage}
                            disabled={cccdSubmitting}
                        />
                        <FileDropzone
                            label="Mặt sau CCCD"
                            hint="Kéo thả hoặc click để tải lên"
                            file={backImage}
                            onFileChange={setBackImage}
                            disabled={cccdSubmitting}
                        />
                    </div>

                    {(extracted.fullName || extracted.idNumber) && (
                        <div className="rv-ocr">
                            <h3>Thông tin trích xuất tự động</h3>
                            <dl className="rv-ocr__grid">
                                <div>
                                    <dt>Họ và tên</dt>
                                    <dd>{extracted.fullName || '—'}</dd>
                                </div>
                                <div>
                                    <dt>Số CCCD</dt>
                                    <dd>{extracted.idNumber || '—'}</dd>
                                </div>
                                <div>
                                    <dt>Ngày sinh</dt>
                                    <dd>{extracted.dateOfBirth || '—'}</dd>
                                </div>
                                <div>
                                    <dt>Địa chỉ thường trú</dt>
                                    <dd>{extracted.address || '—'}</dd>
                                </div>
                            </dl>
                            <p className="rv-ocr__hint">
                                Vui lòng kiểm tra kỹ thông tin. Nếu có sai sót, hãy tải lại ảnh rõ nét hơn.
                            </p>
                        </div>
                    )}

                    <div className="rv-card__actions">
                        <button type="button" className="rv-btn rv-btn--ghost" onClick={goBackHome}>
                            Quay lại
                        </button>
                        <button
                            type="button"
                            className="rv-btn rv-btn--primary"
                            disabled={cccdSubmitting}
                            onClick={handleContinueFromCccd}
                        >
                            {cccdSubmitting
                                ? 'Đang gửi…'
                                : cccdDone
                                  ? isIndividual
                                      ? 'Làm mới kết quả'
                                      : 'Tiếp tục: Giấy tờ doanh nghiệp'
                                  : isIndividual
                                    ? 'Gửi CCCD'
                                    : 'Gửi CCCD & tiếp tục'}
                        </button>
                    </div>
                </section>
            )}

            {resultKind == null && stepIndex === 1 && needsLicense && !isPendingLocked && (
                <section className="rv-card">
                    <span className="rv-pill">Bắt buộc để xác minh doanh nghiệp</span>
                    <h2>MST hoặc giấy phép kinh doanh</h2>
                    <p className="rv-card__sub">
                        Nên nhập <strong>mã số thuế</strong> nếu có — BE sẽ tra cứu API thuế (nhanh, không OCR).
                        Nếu không có MST, tải ảnh giấy phép để AI OCR.
                    </p>

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
                            disabled={businessSubmitting}
                        />
                        <small className="rv-field__hint">
                            Có MST thì BE chỉ tra cứu thuế — kể cả khi kèm ảnh.
                        </small>
                    </label>

                    <div className="rv-field">
                        <span>Ảnh giấy phép (nếu không có MST)</span>
                        <FileDropzone
                            label="GPKD / đăng ký hộ KD"
                            hint="PDF, JPG, PNG — tối đa khuyến nghị 10MB"
                            accept="image/*,application/pdf"
                            file={certificateImage}
                            onFileChange={setCertificateImage}
                            disabled={businessSubmitting}
                        />
                    </div>

                    <div className="rv-field">
                        <span>Ảnh mặt bằng / cửa hàng (tuỳ chọn)</span>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            disabled={businessSubmitting}
                            onChange={(e) => setBusinessImages(Array.from(e.target.files || []))}
                        />
                        {businessImages.length > 0 ? (
                            <small className="rv-field__hint">{businessImages.length} ảnh đã chọn</small>
                        ) : null}
                    </div>

                    <div className="rv-card__actions">
                        <button
                            type="button"
                            className="rv-btn rv-btn--ghost"
                            disabled={businessSubmitting}
                            onClick={goBackHome}
                        >
                            Để sau
                        </button>
                        <button
                            type="button"
                            className="rv-btn rv-btn--primary"
                            disabled={businessSubmitting}
                            onClick={handleSubmitBusiness}
                        >
                            {businessSubmitting
                                ? 'Đang gửi…'
                                : retryMode
                                  ? 'Nộp lại hồ sơ'
                                  : 'Gửi hồ sơ xác minh'}
                        </button>
                    </div>
                </section>
            )}

            {resultKind === 'success' && (
                <section className="rv-card rv-card--center">
                    <div className="rv-result-icon rv-result-icon--success" aria-hidden>✓</div>
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
                    <div className="rv-result-icon rv-result-icon--pending" aria-hidden>…</div>
                    <h2>Hồ sơ đang chờ duyệt</h2>
                    <p>
                        Manual Team đang xem xét. Không gửi lại bằng API gốc — nếu cần sửa, dùng nút
                        nộp lại (retry).
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
                    <div className="rv-result-icon rv-result-icon--danger" aria-hidden>×</div>
                    <h2>Xác minh không thành công</h2>
                    {getVerificationRejectionReason(resultPayload) ? (
                        <p className="rv-reason-box">
                            Lý do: {getVerificationRejectionReason(resultPayload)}
                        </p>
                    ) : null}
                    <p>
                        Vui lòng chuẩn bị lại giấy tờ rõ nét rồi nộp lại bằng API retry.
                    </p>
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
