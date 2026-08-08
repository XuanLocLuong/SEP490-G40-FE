import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const BASE = `${API_PREFIX}/verifications`;

const unwrap = (res) => res?.data?.data ?? res?.data ?? null;

export const getVerificationApiErrorMessage = (error, fallback = 'Có lỗi xảy ra') => {
    const code = error?.response?.data?.message || error?.response?.data?.error;
    if (typeof code === 'string' && code.trim() && !code.startsWith('{')) return code;
    return error?.message || fallback;
};

/** BE: /retry khi chưa có request → báo dùng /submit. */
export const isVerificationRetryWithoutRequestError = (error) => {
    const msg = String(getVerificationApiErrorMessage(error, '') || '').toLowerCase();
    return (
        msg.includes('/submit') ||
        msg.includes('chưa có yêu cầu') ||
        msg.includes('chua co yeu cau')
    );
};

const appendIfPresent = (formData, key, value) => {
    if (value == null || value === '') return;
    formData.append(key, value);
};

/**
 * Nộp xác minh gộp CCCD + MST/GPKD (lần đầu / retry kèm CCCD).
 * POST /verifications/submit | /retry
 *
 * @param {{
 *   businessId: number|string,
 *   frontImage: File,
 *   backImage: File,
 *   taxCode?: string,
 *   certificateImages?: File[],
 * }} payload
 * @param {{ retry?: boolean }} options
 */
export const submitVerification = (
    {
        businessId,
        frontImage,
        backImage,
        taxCode,
        certificateImages = [],
    },
    { retry = false } = {}
) => {
    const formData = new FormData();
    appendIfPresent(formData, 'businessId', businessId);
    if (frontImage) formData.append('frontImage', frontImage);
    if (backImage) formData.append('backImage', backImage);

    const trimmedTax = typeof taxCode === 'string' ? taxCode.trim() : taxCode;
    appendIfPresent(formData, 'taxCode', trimmedTax);

    (certificateImages || []).forEach((file) => {
        if (file) formData.append('certificateImages', file);
    });

    const path = retry ? `${BASE}/retry` : `${BASE}/submit`;
    return axiosClient
        .post(path, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        .then(unwrap);
};

/**
 * Nộp bổ sung chỉ GPKD/MST (đã CCCD_PASSED hoặc BUSINESS_REJECTED — không upload lại CCCD).
 * POST /verifications/business-license/submit | /retry
 *
 * @param {{
 *   businessId: number|string,
 *   taxCode?: string,
 *   certificateImages?: File[],
 * }} payload
 * @param {{ retry?: boolean }} options
 */
export const submitBusinessLicense = (
    { businessId, taxCode, certificateImages = [] },
    { retry = false } = {}
) => {
    const formData = new FormData();
    appendIfPresent(formData, 'businessId', businessId);

    const trimmedTax = typeof taxCode === 'string' ? taxCode.trim() : taxCode;
    appendIfPresent(formData, 'taxCode', trimmedTax);

    (certificateImages || []).forEach((file) => {
        if (file) formData.append('certificateImages', file);
    });

    const path = retry
        ? `${BASE}/business-license/retry`
        : `${BASE}/business-license/submit`;
    return axiosClient
        .post(path, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        .then(unwrap);
};

/** @deprecated Dùng submitVerification */
export const submitCccdVerification = (payload, options) =>
    submitVerification(payload, options);

/** @deprecated Dùng submitBusinessLicense */
export const submitBusinessLicenseVerification = (payload, options) =>
    submitBusinessLicense(payload, options);
