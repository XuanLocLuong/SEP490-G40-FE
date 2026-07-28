/**
 * Client-only UI metadata for Admin System Configurations.
 * Keys must match backend configKey. Unmapped keys still render via fallback.
 */

export const CONFIG_UI_GROUP_ORDER = [
    'AI & Recommendation Thresholds',
    'Trust Score Rules',
    'System Limits',
    'Xác thực danh tính',
    'Khác',
];

/** icon: key vào icon map trên page (Sparkles | Trending | Shield | Settings | Chart | Layers) */
export const SYSTEM_CONFIG_UI_MAP = {
    RECOMMENDATION_WEIGHT_SCHEDULE: {
        group: 'AI & Recommendation Thresholds',
        label: 'Trọng số lịch làm việc',
        icon: 'Sparkles',
        unit: '',
        isJson: false,
    },
    RECOMMENDATION_WEIGHT_DISTANCE: {
        group: 'AI & Recommendation Thresholds',
        label: 'Trọng số khoảng cách',
        icon: 'Sparkles',
        unit: '',
        isJson: false,
    },
    RECOMMENDATION_WEIGHT_SKILL: {
        group: 'AI & Recommendation Thresholds',
        label: 'Trọng số kỹ năng (Matching)',
        icon: 'Sparkles',
        unit: '',
        isJson: false,
    },
    RECOMMENDATION_WEIGHT_TRUST: {
        group: 'AI & Recommendation Thresholds',
        label: 'Trọng số trust score',
        icon: 'Sparkles',
        unit: '',
        isJson: false,
    },
    RECOMMENDATION_WEIGHT_SALARY: {
        group: 'AI & Recommendation Thresholds',
        label: 'Trọng số mức lương',
        icon: 'Sparkles',
        unit: '',
        isJson: false,
    },
    RECOMMENDATION_WEIGHT_CONTENT: {
        group: 'AI & Recommendation Thresholds',
        label: 'Trọng số nội dung tin',
        icon: 'Sparkles',
        unit: '',
        isJson: false,
    },
    RECOMMENDATION_COLD_START_WEIGHT_SCHEDULE: {
        group: 'AI & Recommendation Thresholds',
        label: 'Cold-start · lịch làm việc',
        icon: 'Sparkles',
        unit: '',
        isJson: false,
    },
    RECOMMENDATION_COLD_START_WEIGHT_DISTANCE: {
        group: 'AI & Recommendation Thresholds',
        label: 'Cold-start · khoảng cách',
        icon: 'Sparkles',
        unit: '',
        isJson: false,
    },
    RECOMMENDATION_COLD_START_WEIGHT_SKILL: {
        group: 'AI & Recommendation Thresholds',
        label: 'Cold-start · kỹ năng',
        icon: 'Sparkles',
        unit: '',
        isJson: false,
    },
    RECOMMENDATION_COLD_START_WEIGHT_TRUST: {
        group: 'AI & Recommendation Thresholds',
        label: 'Cold-start · trust',
        icon: 'Sparkles',
        unit: '',
        isJson: false,
    },
    RECOMMENDATION_COLD_START_WEIGHT_SALARY: {
        group: 'AI & Recommendation Thresholds',
        label: 'Cold-start · lương',
        icon: 'Sparkles',
        unit: '',
        isJson: false,
    },
    RECOMMENDATION_COLD_START_WEIGHT_CONTENT: {
        group: 'AI & Recommendation Thresholds',
        label: 'Cold-start · nội dung',
        icon: 'Sparkles',
        unit: '',
        isJson: false,
    },
    RECOMMENDATION_MINIMUM_POOL_SIZE: {
        group: 'AI & Recommendation Thresholds',
        label: 'Kích thước pool tối thiểu',
        icon: 'Sparkles',
        unit: '',
        isJson: false,
    },
    RECOMMENDATION_COLD_START_WEIGHT_JOB_TYPE: {
        group: 'AI & Recommendation Thresholds',
        label: 'Cold-start · loại công việc',
        icon: 'Sparkles',
        unit: '',
        isJson: false,
    },
    RECOMMENDATION_COLD_START_WEIGHT_TRENDING: {
        group: 'AI & Recommendation Thresholds',
        label: 'Cold-start · xu hướng',
        icon: 'Sparkles',
        unit: '',
        isJson: false,
    },
    TRENDING_WEIGHT_APPLY: {
        group: 'AI & Recommendation Thresholds',
        label: 'Trending · trọng số Apply',
        icon: 'Trending',
        unit: '',
        isJson: false,
    },
    TRENDING_WEIGHT_SAVE: {
        group: 'AI & Recommendation Thresholds',
        label: 'Trending · trọng số Save',
        icon: 'Trending',
        unit: '',
        isJson: false,
    },
    TRENDING_WEIGHT_VIEW: {
        group: 'AI & Recommendation Thresholds',
        label: 'Trending · trọng số View',
        icon: 'Trending',
        unit: '',
        isJson: false,
    },
    VERIFICATION_CITIZEN_CONFIG: {
        group: 'Xác thực danh tính',
        label: 'Cấu hình xác thực CCCD / công dân',
        icon: 'Shield',
        unit: '',
        isJson: true,
    },
    VERIFICATION_BUSINESS_CONFIG: {
        group: 'Xác thực danh tính',
        label: 'Cấu hình xác thực doanh nghiệp',
        icon: 'Shield',
        unit: '',
        isJson: true,
    },
};

/** Nhãn VI cho field con trong JSON config (key kỹ thuật vẫn hiện trong ngoặc). */
export const SYSTEM_CONFIG_JSON_FIELD_LABELS = {
    minAge: 'Tuổi tối thiểu',
    approveMinScore: 'Điểm duyệt tối thiểu',
    rejectIfExpired: 'Từ chối nếu hết hạn',
    manualReviewMinScore: 'Điểm chuyển duyệt tay',
    approveMaxTamperingRisk: 'Rủi ro giả mạo tối đa (duyệt)',
    rejectIfAgeUnderMinimum: 'Từ chối nếu dưới tuổi tối thiểu',
    rejectIfImageQualityBelow: 'Từ chối nếu chất lượng ảnh thấp hơn',
    rejectIfMissingFrontOrBack: 'Từ chối nếu thiếu mặt trước/sau',
    requiredFieldMinConfidence: 'Độ tin cậy field bắt buộc tối thiểu',
    rejectIfTamperingRiskAtLeast: 'Từ chối nếu rủi ro giả mạo ≥',
    rejectIfDocumentNotDetected: 'Từ chối nếu không nhận diện giấy tờ',
};

/** Ví dụ: "Tuổi tối thiểu (minAge)" — field lạ vẫn hiện đúng tên key. */
export const getSystemConfigJsonFieldLabel = (fieldKey) => {
    const key = String(fieldKey || '');
    const vi = SYSTEM_CONFIG_JSON_FIELD_LABELS[key];
    if (!vi) return key;
    return `${vi} (${key})`;
};

export const getSystemConfigUiMeta = (configKey, beConfigGroup) => {
    const mapped = SYSTEM_CONFIG_UI_MAP[configKey];
    if (mapped) {
        return {
            key: configKey,
            group: mapped.group,
            label: mapped.label,
            icon: mapped.icon || 'Settings',
            unit: mapped.unit || '',
            isJson: Boolean(mapped.isJson),
        };
    }
    return {
        key: configKey,
        group: beConfigGroup?.trim() || 'Khác',
        label: configKey,
        icon: 'Settings',
        unit: '',
        isJson: false,
    };
};
