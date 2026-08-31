export const VERIFICATION_STATUS = {
    BUSINESS_PASSED: 'BUSINESS_PASSED',
    BUSINESS_MANUALLY: 'BUSINESS_MANUALLY',
    BUSINESS_REJECTED: 'BUSINESS_REJECTED',
    /** Legacy — giữ để map profile cũ nếu BE còn trả. */
    CCCD_PASSED: 'CCCD_PASSED',
    CCCD_MANUALLY: 'CCCD_MANUALLY',
    CCCD_REJECTED: 'CCCD_REJECTED',
    CANCELLED_BY_RETRY: 'CANCELLED_BY_RETRY',
    EXPIRED: 'EXPIRED',
};

/** Đủ verify đầy đủ (DN cần GPKD). CCCD_PASSED chỉ pass khi loại không cần GPKD + badge. */
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

/**
 * Đủ để hiện “Đã xác thực” trên UI.
 * Defensive: loại cần GPKD mà mới CCCD_PASSED → chưa đủ dù BE vẫn trả BUSINESS_VERIFIED.
 */
export const isFullyBusinessVerified = ({
    badge,
    verificationStatus,
    needsLicense,
} = {}) => {
    if (!isBusinessVerifiedBadge(badge)) return false;
    if (
        needsLicense &&
        String(verificationStatus || '').toUpperCase() === VERIFICATION_STATUS.CCCD_PASSED
    ) {
        return false;
    }
    return true;
};

/**
 * Cần CTA / form bổ sung GPKD (đã CCCD, loại đang yêu cầu giấy phép).
 */
export const needsBusinessLicenseTopUp = ({
    verificationStatus,
    needsLicense,
    badge,
} = {}) => {
    if (!needsLicense) return false;
    if (String(verificationStatus || '').toUpperCase() !== VERIFICATION_STATUS.CCCD_PASSED) {
        return false;
    }
    // Chưa fully verified (kể cả khi BE chưa gỡ badge).
    return !isFullyBusinessVerified({ badge, verificationStatus, needsLicense });
};

/**
 * Có cần MST/GPKD không — theo `requiresBusinessLicense` của business type (BE).
 * Không hard-code code (vd. INDIVIDUAL). Ưu tiên: profile flag → option catalog →
 * default true (BE entity default).
 */
export const resolveRequiresBusinessLicense = ({
    businessType,
    typeOptions = [],
    profileRequiresBusinessLicense,
} = {}) => {
    if (typeof profileRequiresBusinessLicense === 'boolean') {
        return profileRequiresBusinessLicense;
    }

    const code = String(businessType || '').trim().toUpperCase();
    if (code && Array.isArray(typeOptions) && typeOptions.length > 0) {
        const match = typeOptions.find(
            (item) => String(item?.value || item?.code || '').toUpperCase() === code
        );
        if (match && typeof match.requiresBusinessLicense === 'boolean') {
            return match.requiresBusinessLicense;
        }
    }

    // Fallback: Cá nhân (INDIVIDUAL) không yêu cầu Giấy phép kinh doanh
    if (code === 'INDIVIDUAL' || code === 'CA_NHAN') {
        return false;
    }

    return true;
};

/** @deprecated Dùng resolveRequiresBusinessLicense */
export const requiresBusinessLicenseVerification = (businessType, typeOptions = []) =>
    resolveRequiresBusinessLicense({ businessType, typeOptions });

/**
 * Luồng chỉ nộp GPKD/MST (không upload lại CCCD).
 * - CCCD_PASSED: bổ sung lần đầu sau đổi type / thiếu GPKD
 * - BUSINESS_REJECTED | BUSINESS_MANUALLY: sửa/retry nhánh giấy phép
 */
export const isBusinessLicenseOnlyFlow = ({
    verificationStatus,
    needsLicense,
    badge,
} = {}) => {
    if (!needsLicense) return false;
    const status = String(verificationStatus || '').toUpperCase();
    if (status === VERIFICATION_STATUS.CCCD_PASSED) {
        return !isFullyBusinessVerified({ badge, verificationStatus: status, needsLicense });
    }
    return (
        status === VERIFICATION_STATUS.BUSINESS_REJECTED ||
        status === VERIFICATION_STATUS.BUSINESS_MANUALLY
    );
};

export const isVerificationExpired = (status) =>
    String(status || '').toUpperCase() === VERIFICATION_STATUS.EXPIRED;

/**
 * Notify đổi type reuse VERIFICATION_REJECTED + “từ chối” dù thực chất là gỡ badge.
 */
export const isBusinessTypeChangeVerificationNotice = (notification) => {
    const action = String(notification?.action || '');
    const type = String(notification?.type || notification?.notificationType || '');
    if (action !== 'VIEW_VERIFICATION') return false;
    if (type && type !== 'VERIFICATION_REJECTED') return false;

    const blob = `${notification?.title || ''} ${notification?.content || ''}`.toLowerCase();
    return (
        blob.includes('đổi sang loại hình') ||
        blob.includes('doi sang loai hinh') ||
        blob.includes('huy hiệu xác thực tạm thời bị gỡ') ||
        blob.includes('xác thực bổ sung') ||
        blob.includes('xac thuc bo sung')
    );
};

/** Title/content hiển thị — tách notify gỡ badge đổi type khỏi reject thật. */
export const getVerificationNotificationDisplay = (notification) => {
    if (!notification) {
        return { title: '', content: '' };
    }
    if (isBusinessTypeChangeVerificationNotice(notification)) {
        return {
            title: 'Cần xác thực bổ sung',
            content:
                'Bạn đã đổi sang loại hình cần Giấy phép kinh doanh. Huy hiệu tạm gỡ — hãy nộp MST hoặc ảnh GPKD để lấy lại huy hiệu (không cần nộp lại CCCD).',
        };
    }
    return {
        title: notification.title?.trim() || '',
        content: notification.content?.trim() || '',
    };
};

/**
 * Phản hồi UI sau khi đổi businessType (BE chỉ recalc badge khi requiresBusinessLicense cũ≠mới).
 * @returns {{ kind: 'license_required'|'badge_restored', message: string } | null}
 */
export const getBusinessTypeChangeVerifyFeedback = ({
    prevRequiresLicense,
    nextRequiresLicense,
    prevBadge,
    nextBadge,
    nextVerificationStatus,
} = {}) => {
    if (typeof prevRequiresLicense !== 'boolean' || typeof nextRequiresLicense !== 'boolean') {
        return null;
    }
    if (prevRequiresLicense === nextRequiresLicense) return null;

    const hadVerifiedBadge = isBusinessVerifiedBadge(prevBadge);
    const hasVerifiedBadge = isBusinessVerifiedBadge(nextBadge);
    const status = String(nextVerificationStatus || '').toUpperCase();
    const hasCccdOrBusinessPassed =
        status === VERIFICATION_STATUS.CCCD_PASSED ||
        status === VERIFICATION_STATUS.BUSINESS_PASSED;

    // Loại không cần GPKD → loại cần GPKD
    if (!prevRequiresLicense && nextRequiresLicense) {
        if (status === VERIFICATION_STATUS.CCCD_PASSED) {
            return {
                kind: 'license_required',
                message: hasVerifiedBadge
                    ? 'Bạn đã đổi sang loại hình cần GPKD. Vui lòng bổ sung MST hoặc ảnh giấy phép để giữ huy hiệu xác thực (không cần nộp lại CCCD).'
                    : 'Loại hình mới cần giấy phép kinh doanh. Huy hiệu xác thực đã tạm gỡ — hãy bổ sung MST hoặc ảnh GPKD để lấy lại huy hiệu (không cần nộp lại CCCD).',
            };
        }
        return null;
    }

    // Loại cần GPKD → loại không cần: gắn lại badge khi đã có CCCD trở lên và trước đó chưa có badge
    if (prevRequiresLicense && !nextRequiresLicense) {
        if (hasCccdOrBusinessPassed && hasVerifiedBadge && !hadVerifiedBadge) {
            return {
                kind: 'badge_restored',
                message:
                    'Loại hình mới không cần GPKD. Huy hiệu xác thực đã được khôi phục dựa trên CCCD đã duyệt.',
            };
        }
        return null;
    }

    return null;
};

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
        status === VERIFICATION_STATUS.BUSINESS_PASSED ||
        // Cá nhân / loại không cần GPKD: CCCD_PASSED + badge đã map ở trên; body có thể chỉ trả status.
        (status === VERIFICATION_STATUS.CCCD_PASSED &&
            isBusinessVerifiedBadge(response.badge || profile?.badge))
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
        return formatted
            .map((item) => formatFailedReasonCode(String(item || '').trim()))
            .filter(Boolean);
    }
    return [];
};

export const getVerificationRejectionReason = (response) => {
    if (!response) return '';

    const formatted = getFormattedFailedReasons(response);
    if (formatted.length) return formatted.join('; ');

    if (typeof response.reason === 'string' && response.reason.trim()) {
        return formatFailedReasonCode(response.reason.trim());
    }
    if (typeof response.rejectReason === 'string' && response.rejectReason.trim()) {
        return formatFailedReasonCode(response.rejectReason.trim());
    }
    if (typeof response.adminNote === 'string' && response.adminNote.trim()) {
        return response.adminNote.trim();
    }

    const failed = response.failedCriteria;
    if (failed && typeof failed === 'object' && !Array.isArray(failed)) {
        const parts = [];
        const pushMsg = (label, msg) => {
            const text = formatFailedReasonCode(unwrapOcrField(msg));
            if (text) parts.push(label ? `${label}: ${text}` : text);
        };
        Object.entries(failed).forEach(([group, value]) => {
            if (!value) return;
            if (typeof value === 'string') {
                // value thường là code DecisionEngine — dịch, không cần prefix group EN.
                const translated = formatFailedReasonCode(value);
                if (translated) parts.push(translated);
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

    const fromList = toReasonList(response.reasons || response.failedReasons);
    if (fromList.length) return fromList.join('; ');
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

/** Label field OCR trong code kiểu MISSING_IMPORTANT_FIELDS:idNumber,fullName */
const OCR_FIELD_LABELS_VN = {
    idNumber: 'Số CCCD',
    cccd: 'Số CCCD',
    citizenId: 'Số CCCD',
    soCCCD: 'Số CCCD',
    fullName: 'Họ và tên',
    name: 'Họ và tên',
    hoTen: 'Họ và tên',
    dateOfBirth: 'Ngày sinh',
    dob: 'Ngày sinh',
    ngaySinh: 'Ngày sinh',
    address: 'Địa chỉ',
    permanentAddress: 'Địa chỉ thường trú',
    diaChi: 'Địa chỉ',
    dateOfExpiry: 'Ngày hết hạn',
    expiryDate: 'Ngày hết hạn',
    ngayHetHan: 'Ngày hết hạn',
    issueDate: 'Ngày cấp',
    ngayCap: 'Ngày cấp',
    nationality: 'Quốc tịch',
    sex: 'Giới tính',
    gender: 'Giới tính',
    placeOfOrigin: 'Quê quán',
    placeOfResidence: 'Nơi thường trú',
    taxCode: 'Mã số thuế',
    businessName: 'Tên doanh nghiệp',
    companyName: 'Tên doanh nghiệp',
};

/** Code DecisionEngine → tiếng Việt (Manual + fallback recruiter). */
const FAILED_CRITERIA_LABELS_VN = {
    MISSING_FRONT_OR_BACK: 'Thiếu ảnh mặt trước hoặc mặt sau CCCD',
    NOT_VIETNAM_CITIZEN_ID: 'Không phải CCCD/CMND Việt Nam',
    AGE_UNDER_MINIMUM: 'Tuổi dưới mức tối thiểu cho phép',
    CCCD_EXPIRED: 'CCCD đã hết hạn',
    EXPIRY_DATE_UNREADABLE: 'Không đọc được ngày hết hạn CCCD',
    HIGH_TAMPERING_RISK: 'Nguy cơ chỉnh sửa / giả mạo ảnh cao',
    LOW_IMAGE_QUALITY: 'Chất lượng ảnh thấp (mờ, tối, chói…)',
    LOW_OVERALL_SCORE: 'Điểm kiểm tra tổng thể thấp',
    DOCUMENT_NOT_DETECTED: 'Không nhận diện được giấy phép / giấy tờ DN',
};

const translateOcrFieldList = (fieldsCsv) => {
    if (!fieldsCsv) return '';
    return String(fieldsCsv)
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
        .map((field) => OCR_FIELD_LABELS_VN[field] || OCR_FIELD_LABELS_VN[field.toLowerCase()] || field)
        .join(', ');
};

/**
 * Dịch 1 mã/chuỗi failedCriteria hoặc failedReasons sang tiếng Việt.
 * Giữ nguyên nếu đã là câu tiếng Việt / warning AI (`- …`).
 */
export const formatFailedReasonCode = (raw) => {
    if (raw == null) return '';
    let text = String(raw).trim();
    if (!text) return '';

    // Warning AI: "- Ảnh bị cắt góc"
    if (text.startsWith('- ')) {
        return text.slice(2).trim() || text;
    }

    const missingMatch = text.match(/^MISSING_IMPORTANT_FIELDS:(.+)$/i);
    if (missingMatch) {
        const fields = translateOcrFieldList(missingMatch[1]);
        return fields
            ? `Thiếu trường quan trọng: ${fields}`
            : 'Thiếu trường quan trọng trên giấy tờ';
    }

    const lowConfMatch = text.match(/^LOW_CONFIDENCE_IMPORTANT_FIELDS:(.+)$/i);
    if (lowConfMatch) {
        const fields = translateOcrFieldList(lowConfMatch[1]);
        return fields
            ? `Độ tin cậy thấp ở trường: ${fields}`
            : 'Độ tin cậy thấp ở các trường quan trọng';
    }

    const upper = text.toUpperCase();
    if (FAILED_CRITERIA_LABELS_VN[upper]) {
        return FAILED_CRITERIA_LABELS_VN[upper];
    }

    // Prefix code chưa có trong map nhưng vẫn dạng CODE:...
    const prefixMatch = text.match(/^([A-Z][A-Z0-9_]+):(.*)$/);
    if (prefixMatch && FAILED_CRITERIA_LABELS_VN[prefixMatch[1]]) {
        const rest = prefixMatch[2].trim();
        const base = FAILED_CRITERIA_LABELS_VN[prefixMatch[1]];
        return rest ? `${base}: ${translateOcrFieldList(rest) || rest}` : base;
    }

    return text;
};

/** Lý do fail dạng list (Manual / toast) — hỗ trợ array mới + string JSON cũ. */
export const toReasonList = (reasons) => {
    if (!reasons) return [];
    if (Array.isArray(reasons)) {
        return reasons
            .map((item) => {
                const raw =
                    typeof item === 'string'
                        ? item.trim()
                        : unwrapOcrField(item?.message ?? item?.code ?? item);
                return formatFailedReasonCode(raw);
            })
            .filter(Boolean);
    }
    if (typeof reasons === 'string') {
        const trimmed = reasons.trim();
        if (!trimmed) return [];
        try {
            const parsed = JSON.parse(trimmed);
            return toReasonList(parsed);
        } catch {
            return [formatFailedReasonCode(trimmed)];
        }
    }
    if (typeof reasons === 'object') {
        return Object.entries(reasons)
            .map(([key, value]) => {
                const text = unwrapOcrField(value);
                if (!text) return '';
                // value đã là code → dịch; key là nhóm (cccd / license)
                const translated = formatFailedReasonCode(text);
                if (translated !== text) return translated;
                return formatFailedReasonCode(key) !== key
                    ? `${formatFailedReasonCode(key)}: ${translated}`
                    : `${key}: ${translated}`;
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

const MEDIA_FILE_TYPE_LABELS = {
    CCCD_FRONT: 'CCCD mặt trước',
    CCCD_BACK: 'CCCD mặt sau',
    BUSINESS_LICENSE: 'Giấy phép / GPKD',
    TAX_DOCUMENT: 'Giấy tờ thuế',
};

const mediaTypeLabel = (type, index = 0, total = 1) => {
    const base = MEDIA_FILE_TYPE_LABELS[type] || type || 'Ảnh';
    if (total > 1) return `${base} (${index + 1}/${total})`;
    return base;
};

/**
 * Chuẩn hoá mediaFiles từ manual-verification detail.
 * Hỗ trợ:
 * - Array of string | { type, url }
 * - Map { CCCD_FRONT: url | [url...] , BUSINESS_LICENSE: [...] }
 */
export const mediaFilesToEntries = (mediaFiles) => {
    if (!mediaFiles) return [];

    if (Array.isArray(mediaFiles)) {
        return mediaFiles
            .map((item, index) => {
                if (typeof item === 'string') {
                    return { key: `file-${index}`, url: item, label: `Ảnh ${index + 1}` };
                }
                const type = item?.type || item?.mediaFileType || `file-${index}`;
                return {
                    key: `${type}-${index}`,
                    url: item?.url || item?.fileUrl || '',
                    label: mediaTypeLabel(type),
                };
            })
            .filter((item) => item.url);
    }

    if (typeof mediaFiles === 'object') {
        const entries = [];
        Object.entries(mediaFiles).forEach(([type, value]) => {
            const urls = Array.isArray(value)
                ? value
                : typeof value === 'string'
                  ? [value]
                  : value?.url || value?.fileUrl
                    ? [value.url || value.fileUrl]
                    : [];

            urls.forEach((url, index) => {
                const resolved = typeof url === 'string' ? url : url?.url || url?.fileUrl || '';
                if (!resolved) return;
                entries.push({
                    key: `${type}-${index}`,
                    url: resolved,
                    label: mediaTypeLabel(type, index, urls.length),
                });
            });
        });
        return entries;
    }

    return [];
};
