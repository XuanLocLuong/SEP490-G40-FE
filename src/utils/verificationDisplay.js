export const VERIFICATION_STATUS = {
    CCCD_PASSED: 'CCCD_PASSED',
    BUSINESS_PASSED: 'BUSINESS_PASSED',
    CCCD_MANUALLY: 'CCCD_MANUALLY',
    BUSINESS_MANUALLY: 'BUSINESS_MANUALLY',
    CCCD_REJECTED: 'CCCD_REJECTED',
    BUSINESS_REJECTED: 'BUSINESS_REJECTED',
    CANCELLED_BY_RETRY: 'CANCELLED_BY_RETRY',
};

export const isVerificationPassed = (status) =>
    status === VERIFICATION_STATUS.BUSINESS_PASSED ||
    status === VERIFICATION_STATUS.CCCD_PASSED;

export const isVerificationPendingManual = (status) =>
    status === VERIFICATION_STATUS.BUSINESS_MANUALLY ||
    status === VERIFICATION_STATUS.CCCD_MANUALLY;

export const isVerificationRejected = (status) =>
    status === VERIFICATION_STATUS.BUSINESS_REJECTED ||
    status === VERIFICATION_STATUS.CCCD_REJECTED;

export const isBusinessVerifiedBadge = (badge) => badge === 'BUSINESS_VERIFIED';

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
 * Outcome từ response API (+ optional profile sau refresh).
 * @returns {'success'|'pending'|'rejected'|'cccd_ok'|'unknown'}
 */
export const getVerificationOutcome = (response, { isIndividual = false, profile = null } = {}) => {
    if (isBusinessVerifiedBadge(profile?.badge)) return 'success';

    if (!response && profile) {
        if (isVerificationPendingManual(profile.verificationStatus)) return 'pending';
        if (isVerificationRejected(profile.verificationStatus)) return 'rejected';
        if (isBusinessVerifiedBadge(profile.badge)) return 'success';
        if (profile.verificationStatus === VERIFICATION_STATUS.CCCD_PASSED) {
            return isIndividual ? 'success' : 'cccd_ok';
        }
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

    if (status === VERIFICATION_STATUS.BUSINESS_PASSED) return 'success';

    if (
        decision === 'APPROVE' ||
        decision === 'APPROVED' ||
        decision === 'PASSED' ||
        status === VERIFICATION_STATUS.CCCD_PASSED
    ) {
        return isIndividual ? 'success' : 'cccd_ok';
    }

    return 'unknown';
};

export const getVerificationRejectionReason = (response) => {
    if (!response) return '';
    if (typeof response.reason === 'string' && response.reason.trim()) return response.reason.trim();
    if (typeof response.adminNote === 'string' && response.adminNote.trim()) {
        return response.adminNote.trim();
    }
    const reasons = response.reasons || response.failedCriteria || response.failedReasons;
    if (Array.isArray(reasons) && reasons.length) {
        return reasons
            .map((item) => (typeof item === 'string' ? item : item?.message || item?.code || ''))
            .filter(Boolean)
            .join('; ');
    }
    return '';
};

export const pickCccdExtractedFields = (response) => {
    const src =
        response?.extractedCitizenFields ||
        response?.extractedData ||
        response?.documentInfo ||
        response?.ocrResult ||
        {};
    if (!src || typeof src !== 'object') return {};

    return {
        fullName: src.fullName || src.name || src.hoTen || '',
        idNumber: src.idNumber || src.cccd || src.citizenId || src.soCCCD || '',
        dateOfBirth: src.dateOfBirth || src.dob || src.ngaySinh || '',
        address: src.address || src.permanentAddress || src.diaChi || '',
    };
};

export const formatVerificationType = (type) => {
    const key = String(type || '').toUpperCase();
    if (key.includes('CCCD')) return 'CCCD';
    if (key.includes('BUSINESS') || key.includes('HOUSEHOLD')) return 'Giấy tờ KD';
    return type || '—';
};

export const formatAiRiskLevel = (level) => {
    const key = String(level || '').toUpperCase();
    if (key === 'HIGH' || key === 'CAO') return 'Cao';
    if (key === 'MEDIUM' || key === 'TRUNG_BINH') return 'Trung bình';
    if (key === 'LOW' || key === 'THAP' || key === 'THẤP') return 'Thấp';
    return level || '—';
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
