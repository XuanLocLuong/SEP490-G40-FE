import recruiterJobApi, { getRecruiterJobApiErrorMessage } from '../apis/RecruiterJobApi.jsx';

/**
 * Adapter AI gợi ý mô tả tin tuyển dụng.
 * BE: POST /jobs/ai/generate-questions | generate-description
 */

export const validateAiDescBasics = ({ jobTitle, businessName, jobType }) => {
    if (!jobTitle?.trim()) return 'Vui lòng nhập tiêu đề tin tuyển dụng trước.';
    if (!businessName?.trim()) return 'Thiếu tên doanh nghiệp. Hãy hoàn thiện hồ sơ trước.';
    if (!jobType?.trim()) return 'Vui lòng chọn loại công việc trước.';
    return null;
};

export const buildQuestionsPayload = ({ jobTitle, businessName, jobType, industry }) => ({
    jobTitle: jobTitle.trim(),
    businessName: businessName.trim(),
    jobType: jobType.trim(),
    industry: industry?.trim() || null,
});

/**
 * answersByQuestion: { [questionKey]: string[] }
 * sections from API 1 → payload API 2
 */
export const buildGeneratePayload = ({ jobTitle, businessName, jobType, industry, sections, answersByQuestion }) => ({
    jobTitle: jobTitle.trim(),
    businessName: businessName.trim(),
    jobType: jobType.trim(),
    industry: industry?.trim() || null,
    sections: (sections || []).map((section) => ({
        sectionKey: section.sectionKey,
        sectionTitle: section.sectionTitle,
        items: (section.questions || []).map((q) => ({
            questionKey: q.questionKey,
            questionText: q.questionText,
            selectedAnswers: answersByQuestion[q.questionKey] || [],
        })),
    })),
});

export const hasAnyAnswer = (answersByQuestion) =>
    Object.values(answersByQuestion || {}).some((list) => Array.isArray(list) && list.some((s) => String(s).trim()));

export const fetchJobDescQuestions = async (basics) => {
    const error = validateAiDescBasics(basics);
    if (error) throw new Error(error);
    return recruiterJobApi.generateJobDescQuestions(buildQuestionsPayload(basics));
};

export const fetchJobDescription = async (payload) => {
    const error = validateAiDescBasics(payload);
    if (error) throw new Error(error);
    if (!payload.sections?.length) throw new Error('Thiếu bộ câu hỏi để sinh mô tả.');
    if (!hasAnyAnswer(payload.answersByQuestion)) {
        throw new Error('Vui lòng chọn hoặc nhập ít nhất một câu trả lời.');
    }
    return recruiterJobApi.generateJobDescription(
        buildGeneratePayload(payload)
    );
};

export { getRecruiterJobApiErrorMessage };
