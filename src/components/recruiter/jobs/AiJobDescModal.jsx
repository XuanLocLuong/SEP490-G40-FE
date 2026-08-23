import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import {
    fetchJobDescription,
    getRecruiterJobApiErrorMessage,
    normalizeVariants,
    validateAiDescBasics,
} from '../../../services/jobDescAiService.js';
import RichTextContent from '../../common/RichTextContent.jsx';

const STEP = {
    LOADING: 'loading',
    PREVIEW: 'preview',
};

/**
 * Modal AI gợi ý mô tả tin tuyển dụng.
 * Mở modal → loading + gen luôn → chọn tone → chèn / tạo lại.
 */
const AiJobDescModal = ({
    open,
    jobTitle,
    jobTypes,
    businessName,
    salaryMin,
    salaryMax,
    requiredCandidates,
    isUrgent,
    locationLabel,
    skillIds,
    skillsCatalog = [],
    minAge,
    maxAge,
    genderRequirement,
    educationRequirementMode,
    minEducationLevel,
    educationLevelOptions = [],
    onClose,
    onApply,
}) => {
    const [step, setStep] = useState(STEP.LOADING);
    const [generating, setGenerating] = useState(false);
    const [variants, setVariants] = useState([]);
    const [activeTone, setActiveTone] = useState(null);
    const requestIdRef = useRef(0);

    const context = useMemo(
        () => ({
            title: jobTitle,
            businessName,
            jobTypes,
            salaryMin,
            salaryMax,
            requiredCandidates,
            isUrgent,
            location: locationLabel,
            skillIds,
            skillsCatalog,
            minAge,
            maxAge,
            genderRequirement,
            educationRequirementMode,
            minEducationLevel,
            educationLevelOptions,
        }),
        [
            jobTitle,
            businessName,
            jobTypes,
            salaryMin,
            salaryMax,
            requiredCandidates,
            isUrgent,
            locationLabel,
            skillIds,
            skillsCatalog,
            minAge,
            maxAge,
            genderRequirement,
            educationRequirementMode,
            minEducationLevel,
            educationLevelOptions,
        ]
    );

    const runGenerate = async ({ closeOnValidateFail = false } = {}) => {
        const error = validateAiDescBasics(context);
        if (error) {
            toast.error(error);
            if (closeOnValidateFail) onClose();
            return;
        }

        const requestId = ++requestIdRef.current;
        setGenerating(true);
        setStep(STEP.LOADING);

        try {
            const data = await fetchJobDescription(context);
            if (requestId !== requestIdRef.current) return;

            const next = normalizeVariants(data);
            if (!next.length) {
                toast.error('AI không trả về mô tả. Vui lòng thử lại.');
                onClose();
                return;
            }
            setVariants(next);
            setActiveTone(
                next.find((v) => v.tone === 'concise')?.tone || next[0].tone
            );
            setStep(STEP.PREVIEW);
        } catch (err) {
            if (requestId !== requestIdRef.current) return;
            toast.error(
                getRecruiterJobApiErrorMessage(err, err.message || 'Không thể sinh mô tả.')
            );
            onClose();
        } finally {
            if (requestId === requestIdRef.current) {
                setGenerating(false);
            }
        }
    };

    /** Đóng mọi lúc (kể cả đang gen) — bỏ qua response đang chờ. */
    const handleClose = () => {
        requestIdRef.current += 1;
        setGenerating(false);
        onClose();
    };

    useEffect(() => {
        if (!open) return undefined;

        setVariants([]);
        setActiveTone(null);
        runGenerate({ closeOnValidateFail: true });

        return () => {
            requestIdRef.current += 1;
        };
        // Chỉ gen khi mở modal — payload lấy từ props lúc đó
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    if (!open) return null;

    const activeVariant = variants.find((v) => v.tone === activeTone) || variants[0] || null;
    const busy = generating;

    return (
        <div className="ai-job-desc-modal" role="dialog" aria-modal="true" aria-labelledby="ai-job-desc-title">
            <button
                type="button"
                className="ai-job-desc-modal__backdrop"
                aria-label="Đóng"
                onClick={handleClose}
            />

            <div className="ai-job-desc-modal__panel">
                <div className="ai-job-desc-modal__header">
                    <h2 id="ai-job-desc-title">
                        {step === STEP.PREVIEW ? 'Chọn phiên bản mô tả' : 'Gợi ý mô tả bằng AI'}
                    </h2>
                    <button
                        type="button"
                        className="ai-job-desc-modal__close"
                        onClick={handleClose}
                        aria-label="Đóng"
                    >
                        ×
                    </button>
                </div>

                <div className="ai-job-desc-modal__body">
                    {step === STEP.LOADING && (
                        <div className="ai-job-desc-loading" aria-live="polite">
                            <div className="ai-job-desc-loading__dots" aria-hidden="true">
                                <span />
                                <span />
                                <span />
                            </div>
                            <p className="ai-job-desc-loading__title">Đang soạn phiên bản mô tả…</p>
                            <p className="ai-job-desc-loading__sub">
                                Thường mất vài giây, vui lòng chờ
                            </p>
                        </div>
                    )}

                    {step === STEP.PREVIEW && activeVariant && (
                        <div className="ai-job-desc-preview">
                            <div className="ai-job-desc-tabs" role="tablist" aria-label="Phong cách mô tả">
                                {variants.map((v) => (
                                    <button
                                        key={v.tone || v.label}
                                        type="button"
                                        role="tab"
                                        aria-selected={v.tone === activeVariant.tone}
                                        className={`ai-job-desc-tabs__btn${
                                            v.tone === activeVariant.tone
                                                ? ' ai-job-desc-tabs__btn--active'
                                                : ''
                                        }`}
                                        onClick={() => setActiveTone(v.tone)}
                                        disabled={busy}
                                    >
                                        {v.label}
                                    </button>
                                ))}
                            </div>

                            <p className="ai-job-desc-basics__hint">
                                Xem trước — bạn có thể chỉnh sau khi chèn vào form.
                            </p>
                            <div className="ai-job-desc-preview__content rich-text-body">
                                <RichTextContent content={activeVariant.description} />
                            </div>
                            <div className="ai-job-desc-modal__footer">
                                <button
                                    type="button"
                                    className="ai-job-desc-modal__btn ai-job-desc-modal__btn--ghost"
                                    onClick={() => runGenerate()}
                                    disabled={busy}
                                >
                                    {busy ? 'Đang tạo lại...' : 'Tạo lại'}
                                </button>
                                <button
                                    type="button"
                                    className="ai-job-desc-modal__btn ai-job-desc-modal__btn--ghost"
                                    onClick={handleClose}
                                >
                                    Đóng
                                </button>
                                <button
                                    type="button"
                                    className="ai-job-desc-modal__btn ai-job-desc-modal__btn--primary"
                                    onClick={() => {
                                        onApply(activeVariant.description);
                                        onClose();
                                    }}
                                    disabled={busy}
                                >
                                    Chèn vào mô tả
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AiJobDescModal;
