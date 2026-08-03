import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const BASE = `${API_PREFIX}/verifications`;

const unwrap = (res) => res?.data?.data ?? res?.data ?? null;

export const getVerificationApiErrorMessage = (error, fallback = 'Có lỗi xảy ra') => {
    const code = error?.response?.data?.message || error?.response?.data?.error;
    if (typeof code === 'string' && code.trim() && !code.startsWith('{')) return code;
    return error?.message || fallback;
};

const appendIfPresent = (formData, key, value) => {
    if (value == null || value === '') return;
    formData.append(key, value);
};

/**
 * Nộp xác minh gộp CCCD + MST/GPKD.
 * POST /verifications/submit | /retry
 *
 * @param {{
 *   businessId: number|string,
 *   frontImage: File,
 *   backImage: File,
 *   taxCode?: string,
 *   certificateImage?: File,
 *   businessImages?: File[],
 * }} payload
 * @param {{ retry?: boolean }} options
 */
export const submitVerification = (
    {
        businessId,
        frontImage,
        backImage,
        taxCode,
        certificateImage,
        businessImages = [],
    },
    { retry = false } = {}
) => {
    const formData = new FormData();
    appendIfPresent(formData, 'businessId', businessId);
    if (frontImage) formData.append('frontImage', frontImage);
    if (backImage) formData.append('backImage', backImage);

    const trimmedTax = typeof taxCode === 'string' ? taxCode.trim() : taxCode;
    appendIfPresent(formData, 'taxCode', trimmedTax);

    if (certificateImage) formData.append('certificateImage', certificateImage);
    (businessImages || []).forEach((file) => {
        if (file) formData.append('businessImages', file);
    });

    const path = retry ? `${BASE}/retry` : `${BASE}/submit`;
    return axiosClient
        .post(path, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        .then(unwrap);
};

/** @deprecated Dùng submitVerification — giữ alias tạm nếu còn chỗ import cũ. */
export const submitCccdVerification = (payload, options) =>
    submitVerification(payload, options);

/** @deprecated Dùng submitVerification */
export const submitBusinessLicenseVerification = (payload, options) =>
    submitVerification(payload, options);
