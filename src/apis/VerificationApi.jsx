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
 * POST /verifications/cccd | /cccd/retry
 * @param {{ businessId: number|string, frontImage: File, backImage: File }} payload
 */
export const submitCccdVerification = ({ businessId, frontImage, backImage }, { retry = false } = {}) => {
    const formData = new FormData();
    appendIfPresent(formData, 'businessId', businessId);
    if (frontImage) formData.append('frontImage', frontImage);
    if (backImage) formData.append('backImage', backImage);

    const path = retry ? `${BASE}/cccd/retry` : `${BASE}/cccd`;
    return axiosClient
        .post(path, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        .then(unwrap);
};

/**
 * POST /verifications/business-license | /business-license/retry
 * @param {{
 *   businessId: number|string,
 *   taxCode?: string,
 *   certificateImage?: File,
 *   businessImages?: File[],
 * }} payload
 */
export const submitBusinessLicenseVerification = (
    { businessId, taxCode, certificateImage, businessImages = [] },
    { retry = false } = {}
) => {
    const formData = new FormData();
    appendIfPresent(formData, 'businessId', businessId);
    appendIfPresent(formData, 'taxCode', taxCode?.trim?.() ? taxCode.trim() : taxCode);
    if (certificateImage) formData.append('certificateImage', certificateImage);
    (businessImages || []).forEach((file) => {
        if (file) formData.append('businessImages', file);
    });

    const path = retry ? `${BASE}/business-license/retry` : `${BASE}/business-license`;
    return axiosClient
        .post(path, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        .then(unwrap);
};
