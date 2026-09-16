import axiosClient, { API_PREFIX } from './AxiosClient.jsx';
import { resolveAiUserErrorMessage } from '../utils/aiErrorMessage.js';
import { formatTaxCode, normalizeTaxCode } from '../utils/taxCode.js';

const BASE = `${API_PREFIX}/verifications`;

const unwrap = (res) => res?.data?.data ?? res?.data ?? null;

export const getVerificationApiErrorMessage = (error, fallback = 'Có lỗi xảy ra') => {
    const code = error?.response?.data?.message || error?.response?.data?.error;
    const mapped =
        typeof code === 'string' && code.trim() && !code.startsWith('{')
            ? code
            : error?.message || fallback;
    return resolveAiUserErrorMessage(error, mapped);
};

/** BE: /retry khi chưa có request → báo dùng /submit. */
export const isVerificationRetryWithoutRequestError = (error) => {
    const msg = String(
        error?.response?.data?.message || error?.response?.data?.error || error?.message || ''
    ).toLowerCase();
    return (
        msg.includes('/submit') ||
        msg.includes('chưa có yêu cầu') ||
        msg.includes('chua co yeu cau')
    );
};

/** BE: /submit khi đã có request trong DB → báo dùng /retry. */
export const isVerificationSubmitInsteadOfRetryError = (error) => {
    const msg = String(
        error?.response?.data?.message || error?.response?.data?.error || error?.message || ''
    ).toLowerCase();
    return (
        msg.includes('/retry') ||
        msg.includes('thay vì /submit') ||
        msg.includes('thay vi /submit') ||
        msg.includes('đã có yêu cầu') ||
        msg.includes('da co yeu cau') ||
        msg.includes('đã tồn tại') ||
        msg.includes('da ton tai')
    );
};

const appendIfPresent = (formData, key, value) => {
    if (value == null || value === '') return;
    formData.append(key, value);
};

const assertSingleBusinessProof = (taxCode, certificateImages) => {
    const hasTaxCode = Boolean(normalizeTaxCode(taxCode));
    const hasCertificate = (certificateImages || []).some(Boolean);
    if (hasTaxCode && hasCertificate) {
        throw new Error(
            'Chỉ được chọn một phương thức xác thực: mã số thuế hoặc giấy phép kinh doanh'
        );
    }
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
    assertSingleBusinessProof(taxCode, certificateImages);
    const formData = new FormData();
    appendIfPresent(formData, 'businessId', businessId);
    if (frontImage) formData.append('frontImage', frontImage);
    if (backImage) formData.append('backImage', backImage);

    appendIfPresent(formData, 'taxCode', formatTaxCode(taxCode));

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
    assertSingleBusinessProof(taxCode, certificateImages);
    const formData = new FormData();
    appendIfPresent(formData, 'businessId', businessId);

    appendIfPresent(formData, 'taxCode', formatTaxCode(taxCode));

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
