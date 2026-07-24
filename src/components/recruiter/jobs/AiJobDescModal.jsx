import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { INDUSTRY_OPTIONS, JOB_TYPES } from '../../../constants/jobPost.js';
import {
    fetchJobDescQuestions,
    fetchJobDescription,
    getRecruiterJobApiErrorMessage,
    hasAnyAnswer,
    validateAiDescBasics,
} from '../../../services/jobDescAiService.js';
import RichTextContent from '../../common/RichTextContent.jsx';
import AiJobDescWizard from './AiJobDescWizard.jsx';

const STEP = {
    BASICS: 'basics',
    WIZARD: 'wizard',
    PREVIEW: 'preview',
};

/**
 * Modal AI gợi ý mô tả tin tuyển dụng.
 * basics → questions wizard → preview HTML → apply vào form.
 */
const AiJobDescModal = ({
    open,
    jobTitle,
    jobType,
    businessName,
    businessType,
    onClose,
    onApply,
}) => {
    const [step, setStep] = useState(STEP.BASICS);
    const [title, setTitle] = useState(jobTitle || '');
    const [type, setType] = useState(jobType || 'PART_TIME');
    const [industry, setIndustry] = useState(businessType || '');
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [sections, setSections] = useState([]);
    const [sectionIndex, setSectionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [descriptionHtml, setDescriptionHtml] = useState('');

    useEffect(() => {
        if (!open) return;
        setStep(STEP.BASICS);
        setTitle(jobTitle || '');
        setType(jobType || 'PART_TIME');
        setIndustry(businessType || '');
        setSections([]);
        setSectionIndex(0);
        setAnswers({});
        setDescriptionHtml('');
        setLoadingQuestions(false);
        setGenerating(false);
    }, [open, jobTitle, jobType, businessType]);

    if (!open) return null;

    const basics = {
        jobTitle: title,
        businessName,
        jobType: type,
        industry,
    };

    const handleLoadQuestions = async () => {
        const error = validateAiDescBasics(basics);
        if (error) {
            toast.error(error);
            return;
        }

        setLoadingQuestions(true);
        try {
            const data = await fetchJobDescQuestions(basics);
            const nextSections = data?.sections || [];
            if (!nextSections.length) {
                toast.error('AI không trả về câu hỏi. Vui lòng thử lại.');
                return;
            }
            setSections(nextSections);
            setSectionIndex(0);
            setAnswers({});
            setStep(STEP.WIZARD);
        } catch (err) {
            toast.error(
                getRecruiterJobApiErrorMessage(err, err.message || 'Không thể tạo câu hỏi AI.')
            );
        } finally {
            setLoadingQuestions(false);
        }
    };

    const handleGenerate = async () => {
        if (!hasAnyAnswer(answers)) {
            toast.error('Vui lòng chọn hoặc nhập ít nhất một câu trả lời.');
            return;
        }

        setGenerating(true);
        try {
            const data = await fetchJobDescription({
                ...basics,
                sections,
                answersByQuestion: answers,
            });
            const html = data?.description?.trim();
            if (!html) {
                toast.error('AI không trả về mô tả. Vui lòng thử lại.');
                return;
            }
            setDescriptionHtml(html);
            setStep(STEP.PREVIEW);
        } catch (err) {
            toast.error(
                getRecruiterJobApiErrorMessage(err, err.message || 'Không thể sinh mô tả.')
            );
        } finally {
            setGenerating(false);
        }
    };

    const handleWizardNext = () => {
        if (sectionIndex >= sections.length - 1) {
            handleGenerate();
            return;
        }
        setSectionIndex((i) => i + 1);
    };

    const busy = loadingQuestions || generating;

    return (
        <div className="ai-job-desc-modal" role="dialog" aria-modal="true" aria-labelledby="ai-job-desc-title">
            <button
                type="button"
                className="ai-job-desc-modal__backdrop"
                aria-label="Đóng"
                onClick={onClose}
                disabled={busy}
            />

            <div className="ai-job-desc-modal__panel">
                <div className="ai-job-desc-modal__header">
                    <h2 id="ai-job-desc-title">Gợi ý mô tả bằng AI</h2>
                    <button
                        type="button"
                        className="ai-job-desc-modal__close"
                        onClick={onClose}
                        disabled={busy}
                        aria-label="Đóng"
                    >
                        ×
                    </button>
                </div>

                <div className="ai-job-desc-modal__body">
                    {step === STEP.BASICS && (
                        <div className="ai-job-desc-basics">
                            <p className="ai-job-desc-basics__hint">
                                AI sẽ hỏi thêm chi tiết dựa trên thông tin dưới đây.
                            </p>

                            <div className="job-post-form__field">
                                <label htmlFor="ai-job-title">Tiêu đề tin *</label>
                                <input
                                    id="ai-job-title"
                                    value={title}
                                    disabled={busy}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>

                            <div className="job-post-form__field">
                                <label>Doanh nghiệp</label>
                                <p className="job-post-form__location-readonly">
                                    {businessName || '—'}
                                </p>
                            </div>

                            <div className="job-post-form__row">
                                <div className="job-post-form__field">
                                    <label htmlFor="ai-job-type">Loại công việc *</label>
                                    <select
                                        id="ai-job-type"
                                        value={type}
                                        disabled={busy}
                                        onChange={(e) => setType(e.target.value)}
                                    >
                                        {JOB_TYPES.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="job-post-form__field">
                                    <label htmlFor="ai-industry">Ngành nghề</label>
                                    <select
                                        id="ai-industry"
                                        value={industry}
                                        disabled={busy}
                                        onChange={(e) => setIndustry(e.target.value)}
                                    >
                                        {INDUSTRY_OPTIONS.map((opt) => (
                                            <option key={opt.value || 'empty'} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="ai-job-desc-modal__footer">
                                <button
                                    type="button"
                                    className="ai-job-desc-modal__btn ai-job-desc-modal__btn--ghost"
                                    onClick={onClose}
                                    disabled={busy}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    className="ai-job-desc-modal__btn ai-job-desc-modal__btn--primary"
                                    onClick={handleLoadQuestions}
                                    disabled={busy}
                                >
                                    {loadingQuestions ? 'Đang tạo câu hỏi...' : 'Tiếp tục — Tạo câu hỏi'}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === STEP.WIZARD && (
                        <AiJobDescWizard
                            sections={sections}
                            sectionIndex={sectionIndex}
                            answers={answers}
                            onChangeAnswers={setAnswers}
                            onPrev={() => setSectionIndex((i) => Math.max(0, i - 1))}
                            onSkip={() => setSectionIndex((i) => Math.min(sections.length - 1, i + 1))}
                            onNext={handleWizardNext}
                            canFinish={hasAnyAnswer(answers)}
                            finishing={generating}
                        />
                    )}

                    {step === STEP.PREVIEW && (
                        <div className="ai-job-desc-preview">
                            <p className="ai-job-desc-basics__hint">Xem trước mô tả — bạn có thể chỉnh sau khi chèn.</p>
                            <div className="ai-job-desc-preview__content rich-text-body">
                                <RichTextContent content={descriptionHtml} />
                            </div>
                            <div className="ai-job-desc-modal__footer">
                                <button
                                    type="button"
                                    className="ai-job-desc-modal__btn ai-job-desc-modal__btn--ghost"
                                    onClick={() => setStep(STEP.WIZARD)}
                                    disabled={busy}
                                >
                                    Quay lại chỉnh
                                </button>
                                <button
                                    type="button"
                                    className="ai-job-desc-modal__btn ai-job-desc-modal__btn--ghost"
                                    onClick={handleGenerate}
                                    disabled={busy}
                                >
                                    {generating ? 'Đang tạo lại...' : 'Tạo lại'}
                                </button>
                                <button
                                    type="button"
                                    className="ai-job-desc-modal__btn ai-job-desc-modal__btn--primary"
                                    onClick={() => {
                                        onApply(descriptionHtml);
                                        onClose();
                                    }}
                                    disabled={busy}
                                >
                                    Chèn vào form
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
