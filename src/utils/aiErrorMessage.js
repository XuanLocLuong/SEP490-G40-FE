export const AI_GENERIC_ERROR_MESSAGE = 'Có lỗi đến từ AI, vui lòng thử lại sau.';
export const RECOMMENDATION_LOAD_ERROR_MESSAGE =
    'Không thể tải gợi ý việc làm. Vui lòng thử lại sau.';

const AI_ENDPOINT_HINTS = [
    '/ai/',
    'ai-analyze',
    'generate-description',
    '/schedule/scan',
    '/recommendation',
    '/verifications/submit',
    '/verifications/retry',
    '/verifications/business-license',
];

const AI_TECHNICAL_PATTERNS = [
    /lỗi xử lý phản hồi từ ai/i,
    /unexpected character/i,
    /was expecting comma/i,
    /streamreadfeature/i,
    /through reference chain/i,
    /jobdescgenerateresponse/i,
    /jsonparseexception/i,
    /mismatchedinputexception/i,
    /jsonmappingexception/i,
    /generativelanguage/i,
    /\bgemini\b/i,
    /failed_precondition/i,
    /include_source_in_location/i,
];

const errorUrlOf = (error) =>
    String(error?.config?.url || error?.response?.config?.url || '');

const rawAiErrorText = (error, mappedMessage = '') =>
    [
        error?.response?.data?.message,
        error?.response?.data?.error,
        error?.message,
        mappedMessage,
    ]
        .filter((part) => typeof part === 'string' && part.trim())
        .join('\n');

export const looksLikeAiTechnicalError = (text) => {
    const value = String(text || '');
    if (!value.trim()) return false;
    return AI_TECHNICAL_PATTERNS.some((pattern) => pattern.test(value));
};

export const isAiApiError = (error, mappedMessage = '') => {
    const url = errorUrlOf(error);
    const status = error?.response?.status;
    const text = rawAiErrorText(error, mappedMessage);

    if (looksLikeAiTechnicalError(text)) return true;
    if (!AI_ENDPOINT_HINTS.some((hint) => url.includes(hint))) return false;
    return status === 429 || status >= 500;
};

/** Toast/UI: không lộ Jackson / dump AI. */
export const resolveAiUserErrorMessage = (error, mappedMessage) => {
    if (isAiApiError(error, mappedMessage)) {
        return AI_GENERIC_ERROR_MESSAGE;
    }
    return mappedMessage;
};
