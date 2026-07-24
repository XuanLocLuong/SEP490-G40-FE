/**
 * Render một section câu hỏi AI (SINGLE_SELECT / MULTI_SELECT / FREE_TEXT).
 * answers: { [questionKey]: string[] }
 */
const AiJobDescWizard = ({
    sections,
    sectionIndex,
    answers,
    onChangeAnswers,
    onPrev,
    onNext,
    onSkip,
    canFinish,
    finishing,
}) => {
    const section = sections[sectionIndex];
    const isLast = sectionIndex >= sections.length - 1;
    const total = sections.length;

    if (!section) return null;

    const setAnswers = (questionKey, nextList) => {
        onChangeAnswers({ ...answers, [questionKey]: nextList });
    };

    const toggleMulti = (questionKey, option) => {
        const current = answers[questionKey] || [];
        const next = current.includes(option)
            ? current.filter((x) => x !== option)
            : [...current, option];
        setAnswers(questionKey, next);
    };

    const selectSingle = (questionKey, option) => {
        setAnswers(questionKey, [option]);
    };

    const setFreeText = (questionKey, text) => {
        const trimmed = text.trim();
        setAnswers(questionKey, trimmed ? [text] : []);
    };

    const addCustomAnswer = (questionKey, text) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        const current = answers[questionKey] || [];
        if (current.includes(trimmed)) return;
        setAnswers(questionKey, [...current, trimmed]);
    };

    return (
        <div className="ai-job-desc-wizard">
            <div className="ai-job-desc-wizard__steps" aria-hidden="true">
                {sections.map((s, i) => (
                    <span
                        key={s.sectionKey || i}
                        className={`ai-job-desc-wizard__dot${
                            i === sectionIndex ? ' ai-job-desc-wizard__dot--active' : ''
                        }${i < sectionIndex ? ' ai-job-desc-wizard__dot--done' : ''}`}
                    />
                ))}
            </div>
            <p className="ai-job-desc-wizard__progress">
                Bước {sectionIndex + 1}/{total} · {section.sectionTitle || 'Thông tin'}
            </p>

            <div className="ai-job-desc-wizard__questions">
                {(section.questions || []).map((q) => {
                    const type = (q.answerType || 'MULTI_SELECT').toUpperCase();
                    const selected = answers[q.questionKey] || [];
                    const suggestions = q.suggestedAnswers || [];

                    return (
                        <div key={q.questionKey} className="ai-job-desc-wizard__question">
                            <p className="ai-job-desc-wizard__question-text">{q.questionText}</p>

                            {type === 'FREE_TEXT' ? (
                                <textarea
                                    className="ai-job-desc-wizard__textarea"
                                    rows={3}
                                    value={selected[0] || ''}
                                    placeholder="Nhập câu trả lời..."
                                    onChange={(e) => setFreeText(q.questionKey, e.target.value)}
                                />
                            ) : (
                                <>
                                    <div className="ai-job-desc-wizard__chips">
                                        {suggestions.map((opt) => {
                                            const active = selected.includes(opt);
                                            return (
                                                <button
                                                    key={opt}
                                                    type="button"
                                                    className={`ai-job-desc-wizard__chip${
                                                        active
                                                            ? ' ai-job-desc-wizard__chip--active'
                                                            : ''
                                                    }`}
                                                    onClick={() =>
                                                        type === 'SINGLE_SELECT'
                                                            ? selectSingle(q.questionKey, opt)
                                                            : toggleMulti(q.questionKey, opt)
                                                    }
                                                >
                                                    {opt}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {type === 'MULTI_SELECT' && (
                                        <CustomAnswerInput
                                            onAdd={(text) => addCustomAnswer(q.questionKey, text)}
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="ai-job-desc-wizard__nav">
                <button
                    type="button"
                    className="ai-job-desc-modal__btn ai-job-desc-modal__btn--ghost"
                    onClick={onPrev}
                    disabled={sectionIndex === 0 || finishing}
                >
                    ← Quay lại
                </button>
                <div className="ai-job-desc-wizard__nav-right">
                    {!isLast && (
                        <button
                            type="button"
                            className="ai-job-desc-modal__btn ai-job-desc-modal__btn--ghost"
                            onClick={onSkip}
                            disabled={finishing}
                        >
                            Bỏ qua phần này
                        </button>
                    )}
                    {isLast ? (
                        <button
                            type="button"
                            className="ai-job-desc-modal__btn ai-job-desc-modal__btn--primary"
                            onClick={onNext}
                            disabled={!canFinish || finishing}
                        >
                            {finishing ? 'Đang tạo mô tả...' : 'Tạo mô tả'}
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="ai-job-desc-modal__btn ai-job-desc-modal__btn--primary"
                            onClick={onNext}
                            disabled={finishing}
                        >
                            Tiếp →
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const CustomAnswerInput = ({ onAdd }) => {
    const handleKeyDown = (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const value = e.currentTarget.value;
        onAdd(value);
        e.currentTarget.value = '';
    };

    return (
        <input
            type="text"
            className="ai-job-desc-wizard__custom"
            placeholder="+ Thêm câu trả lời khác rồi Enter"
            onKeyDown={handleKeyDown}
        />
    );
};

export default AiJobDescWizard;
