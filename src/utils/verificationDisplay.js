export const VERIFICATION_STATUS = {
    BUSINESS_PASSED: 'BUSINESS_PASSED',
    BUSINESS_MANUALLY: 'BUSINESS_MANUALLY',
    BUSINESS_REJECTED: 'BUSINESS_REJECTED',
    /** Legacy — giữ để map profile cũ nếu BE còn trả. */
    CCCD_PASSED: 'CCCD_PASSED',
    CCCD_MANUALLY: 'CCCD_MANUALLY',
    CCCD_REJECTED: 'CCCD_REJECTED',
    CANCELLED_BY_RETRY: 'CANCELLED_BY_RETRY',
};

export const isVerificationPassed = (status) =>
    status === VERIFICATION_STATUS.BUSINESS_PASSED;

export const isVerificationPendingManual = (status) =>
    status === VERIFICATION_STATUS.BUSINESS_MANUALLY ||
    status === VERIFICATION_STATUS.CCCD_MANUALLY;

export const isVerificationRejected = (status) =>
    status === VERIFICATION_STATUS.BUSINESS_REJECTED ||
    status === VERIFICATION_STATUS.CCCD_REJECTED;

export const isBusinessVerifiedBadge = (badge) => badge === 'BUSINESS_VERIFIED';

export const isUnverifiedBadge = (badge) =>
    !badge || badge === 'UNVERIFIED';

/** INDIVIDUAL chỉ cần CCCD; FNB/RETAIL/SERVICES cần giấy/MST. */
export const isIndividualBusinessType = (businessType) => {
    const raw = String(businessType || '').trim();
    if (!raw) return false;
    const upper = raw.toUpperCase();
    if (upper === 'INDIVIDUAL') return true;
    const normalized = raw
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
    return normalized === 'ca nhan' || normalized.includes('ca nhan');
};

export const requiresBusinessLicenseVerification = (businessType) =>
    !isIndividualBusinessType(businessType);

/**
 * Outcome từ response submit/retry (+ optional profile sau refresh).
 * @returns {'success'|'pending'|'rejected'|'unknown'}
 */
export const getVerificationOutcome = (response, { profile = null } = {}) => {
    if (isBusinessVerifiedBadge(profile?.badge)) return 'success';

    if (!response && profile) {
        if (isVerificationPendingManual(profile.verificationStatus)) return 'pending';
        if (isVerificationRejected(profile.verificationStatus)) return 'rejected';
        if (isBusinessVerifiedBadge(profile.badge)) return 'success';
        if (profile.verificationStatus === VERIFICATION_STATUS.BUSINESS_PASSED) return 'success';
        return 'unknown';
    }

    if (!response) return 'unknown';

    const decision = String(response.decision || '').toUpperCase();
    if (
        response.manualReviewRequired === true ||
        decision === 'MANUAL_REVIEW' ||
        decision.includes('MANUAL')
    ) {
        return 'pending';
    }
    if (
        decision === 'REJECT' ||
        decision === 'REJECTED' ||
        decision === 'FAIL' ||
        decision === 'FAILED'
    ) {
        return 'rejected';
    }

    const status = response.verificationStatus || response.status || profile?.verificationStatus;

    if (isVerificationPendingManual(status)) return 'pending';
    if (isVerificationRejected(status)) return 'rejected';

    if (isBusinessVerifiedBadge(response.badge) || isBusinessVerifiedBadge(profile?.badge)) {
        return 'success';
    }

    if (
        decision === 'APPROVE' ||
        decision === 'APPROVED' ||
        decision === 'PASSED' ||
        status === VERIFICATION_STATUS.BUSINESS_PASSED
    ) {
        return 'success';
    }

    return 'unknown';
};

/** BE OCR field có thể là string hoặc { value, normalizedValue, confidence, ... }. */
const unwrapOcrField = (field) => {
    if (field == null || field === '') return '';
    if (typeof field === 'string' || typeof field === 'number') return String(field);
    if (typeof field === 'object') {
        const raw =
            field.normalizedValue ??
            field.value ??
            field.text ??
            field.fullName ??
            field.name ??
            '';
        if (raw != null && typeof raw === 'object') return '';
        return String(raw || '');
    }
    return '';
};

/** Lý do fail đã format từ BE (ưu tiên) — luôn trả mảng string. */
export const getFormattedFailedReasons = (response) => {
    if (!response) return [];
    const formatted = response.formattedFailedReasons;
    if (Array.isArray(formatted) && formatted.length) {
        return formatted.map((item) => String(item || '').trim()).filter(Boolean);
    }
    return [];
};

export const getVerificationRejectionReason = (response) => {
    if (!response) return '';

    const formatted = getFormattedFailedReasons(response);
    if (formatted.length) return formatted.join('; ');

    if (typeof response.reason === 'string' && response.reason.trim()) return response.reason.trim();
    if (typeof response.rejectReason === 'string' && response.rejectReason.trim()) {
        return response.rejectReason.trim();
    }
    if (typeof response.adminNote === 'string' && response.adminNote.trim()) {
        return response.adminNote.trim();
    }

    const failed = response.failedCriteria;
    if (failed && typeof failed === 'object' && !Array.isArray(failed)) {
        const parts = [];
        const pushMsg = (label, msg) => {
            const text = unwrapOcrField(msg);
            if (text) parts.push(label ? `${label}: ${text}` : text);
        };
        Object.entries(failed).forEach(([group, value]) => {
            if (!value) return;
            if (typeof value === 'string') {
                pushMsg(group, value);
                return;
            }
            if (typeof value === 'object') {
                Object.entries(value).forEach(([key, msg]) => {
                    pushMsg(key, msg);
                });
            }
        });
        if (parts.length) return parts.join('; ');
    }

    const reasons = response.reasons || response.failedReasons;
    if (Array.isArray(reasons) && reasons.length) {
        return reasons
            .map((item) =>
                typeof item === 'string'
                    ? item
                    : unwrapOcrField(item?.message ?? item?.code ?? item)
            )
            .filter(Boolean)
            .join('; ');
    }
    return '';
};

/**
 * Map label VN → value từ BE (formattedExtractedFields / extractedData mới).
 * @returns {{ label: string, value: string }[]}
 */
export const toLabelValueEntries = (data) => {
    if (!data) return [];
    if (typeof data === 'string') {
        const trimmed = data.trim();
        if (!trimmed) return [];
        try {
            const parsed = JSON.parse(trimmed);
            return toLabelValueEntries(parsed);
        } catch {
            return [{ label: 'Dữ liệu', value: trimmed }];
        }
    }
    if (Array.isArray(data)) {
        return data
            .map((item, index) => {
                if (typeof item === 'string') {
                    return { label: `Mục ${index + 1}`, value: item };
                }
                if (item && typeof item === 'object') {
                    const label = item.label ?? item.key ?? item.name ?? `Mục ${index + 1}`;
                    const value = unwrapOcrField(item.value ?? item.text ?? item);
                    return value ? { label: String(label), value } : null;
                }
                return null;
            })
            .filter(Boolean);
    }
    if (typeof data === 'object') {
        return Object.entries(data)
            .map(([label, raw]) => {
                const value = unwrapOcrField(raw);
                return value ? { label: String(label), value } : null;
            })
            .filter(Boolean);
    }
    return [];
};

/** Lý do fail dạng list (Manual / toast) — hỗ trợ array mới + string JSON cũ. */
export const toReasonList = (reasons) => {
    if (!reasons) return [];
    if (Array.isArray(reasons)) {
        return reasons
            .map((item) =>
                typeof item === 'string'
                    ? item.trim()
                    : unwrapOcrField(item?.message ?? item?.code ?? item)
            )
            .filter(Boolean);
    }
    if (typeof reasons === 'string') {
        const trimmed = reasons.trim();
        if (!trimmed) return [];
        try {
            const parsed = JSON.parse(trimmed);
            return toReasonList(parsed);
        } catch {
            return [trimmed];
        }
    }
    if (typeof reasons === 'object') {
        return Object.entries(reasons)
            .map(([key, value]) => {
                const text = unwrapOcrField(value);
                return text ? `${key}: ${text}` : '';
            })
            .filter(Boolean);
    }
    return [];
};

/** Ưu tiên formattedExtractedFields; fallback raw OCR keys. */
export const getDisplayExtractedEntries = (response) => {
    if (!response) return [];
    const formatted = toLabelValueEntries(response.formattedExtractedFields);
    if (formatted.length) return formatted;

    const picked = pickCccdExtractedFields(response);
    return [
        picked.fullName ? { label: 'Họ và tên', value: picked.fullName } : null,
        picked.idNumber ? { label: 'Số CCCD', value: picked.idNumber } : null,
        picked.dateOfBirth ? { label: 'Ngày sinh', value: picked.dateOfBirth } : null,
        picked.address ? { label: 'Địa chỉ thường trú', value: picked.address } : null,
    ].filter(Boolean);
};

export const pickCccdExtractedFields = (response) => {
    const extracted = response?.extractedFields;
    const src =
        extracted?.cccd ||
        response?.extractedCitizenFields ||
        response?.extractedData ||
        response?.documentInfo ||
        response?.ocrResult ||
        {};
    if (!src || typeof src !== 'object' || Array.isArray(src)) return {};

    return {
        fullName: unwrapOcrField(
            src.fullName ?? src.name ?? src.hoTen ?? src['Họ và tên']
        ),
        idNumber: unwrapOcrField(
            src.idNumber ?? src.cccd ?? src.citizenId ?? src.soCCCD ?? src['Số CCCD']
        ),
        dateOfBirth: unwrapOcrField(
            src.dateOfBirth ?? src.dob ?? src.ngaySinh ?? src['Ngày sinh']
        ),
        address: unwrapOcrField(
            src.address ?? src.permanentAddress ?? src.diaChi ?? src['Địa chỉ thường trú']
        ),
    };
};

export const formatVerificationType = (type) => {
    const key = String(type || '').toUpperCase();
    if (key.includes('CCCD')) return 'CCCD';
    if (key.includes('BUSINESS') || key.includes('HOUSEHOLD')) return 'Giấy tờ KD';
    return type || '—';
};

export const formatAiRiskLevel = (level) => {
    if (level == null || level === '') return '—';
    const raw = String(level).trim();
    const key = raw.toUpperCase().replace(/\s+/g, '_');
    if (key === 'HIGH' || key === 'CAO') return 'Cao';
    if (key === 'MEDIUM' || key === 'TRUNG_BINH' || key === 'TRUNG BINH') return 'Trung bình';
    if (key === 'LOW' || key === 'THAP' || key === 'THẤP') return 'Thấp';
    // BE đã format sẵn (tiếng Việt / câu dài) → hiện nguyên.
    return raw;
};

export const mediaFilesToEntries = (mediaFiles) => {
    if (!mediaFiles) return [];
    if (Array.isArray(mediaFiles)) {
        return mediaFiles
            .map((item, index) => {
                if (typeof item === 'string') {
                    return { key: `file-${index}`, url: item, label: `Ảnh ${index + 1}` };
                }
                return {
                    key: item?.type || item?.mediaFileType || `file-${index}`,
                    url: item?.url || item?.fileUrl || '',
                    label: item?.type || item?.mediaFileType || `Ảnh ${index + 1}`,
                };
            })
            .filter((item) => item.url);
    }
    if (typeof mediaFiles === 'object') {
        return Object.entries(mediaFiles)
            .map(([key, value]) => ({
                key,
                url: typeof value === 'string' ? value : value?.url || '',
                label: key,
            }))
            .filter((item) => item.url);
    }
    return [];
};
