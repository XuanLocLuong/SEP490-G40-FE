/**
 * Client-only UI metadata for Admin System Configurations.
 * Keys must match backend configKey. Unmapped keys still render via fallback.
 */

export const CONFIG_UI_GROUP_ORDER = [
    'Khám phá và Xu hướng',
    'Xác thực danh tính',
    'Khác',
];

/** icon: key vào icon map trên page (Sparkles | Trending | Shield | Settings | Chart | Layers) */
export const SYSTEM_CONFIG_UI_MAP = {
    // ---- 1. Gợi ý & Matching (Sparkles) ----
    RECOMMENDATION_WEIGHT_SCHEDULE: {
        group: 'Khám phá và Xu hướng',
        label: 'Trọng số lịch làm việc (Matching)',
        icon: 'Sparkles',
        unit: '',
        isJson: false,
    },
    RECOMMENDATION_WEIGHT_DISTANCE: {
        group: 'Khám phá và Xu hướng',
        label: 'Trọng số khoảng cách địa lý',
        icon: 'Sparkles',
        unit: 'km',
        isJson: false,
    },
    RECOMMENDATION_WEIGHT_SKILL: {
        group: 'Khám phá và Xu hướng',
        label: 'Trọng số kỹ năng (Matching)',
        icon: 'Sparkles',
        unit: '',
        isJson: false,
    },
    RECOMMENDATION_WEIGHT_TRUST: {
        group: 'Khám phá và Xu hướng',
        label: 'Trọng số điểm uy tín (Trust score)',
        icon: 'Shield',
        unit: '',
        isJson: false,
    },
    RECOMMENDATION_WEIGHT_SALARY: {
        group: 'Khám phá và Xu hướng',
        label: 'Trọng số mức lương phù hợp',
        icon: 'Sparkles',
        unit: '',
        isJson: false,
    },
    RECOMMENDATION_WEIGHT_CONTENT: {
        group: 'Khám phá và Xu hướng',
        label: 'Trọng số độ tương đồng nội dung (AI NLP)',
        icon: 'Sparkles',
        unit: '',
        isJson: false,
    },

    // ---- 2. Cold-start (Người dùng mới) ----
    RECOMMENDATION_COLD_START_WEIGHT_JOB_TYPE: {
        group: 'Khám phá và Xu hướng',
        label: 'Cold-start · Trọng số loại công việc',
        icon: 'Sparkles',
        unit: '',
        isJson: false,
    },
    RECOMMENDATION_COLD_START_WEIGHT_DISTANCE: {
        group: 'Khám phá và Xu hướng',
        label: 'Cold-start · Trọng số khoảng cách',
        icon: 'Sparkles',
        unit: 'km',
        isJson: false,
    },
    RECOMMENDATION_COLD_START_WEIGHT_SALARY: {
        group: 'Khám phá và Xu hướng',
        label: 'Cold-start · Trọng số mức lương',
        icon: 'Sparkles',
        unit: '',
        isJson: false,
    },
    RECOMMENDATION_COLD_START_WEIGHT_TRUST: {
        group: 'Khám phá và Xu hướng',
        label: 'Cold-start · Trọng số điểm uy tín',
        icon: 'Shield',
        unit: '',
        isJson: false,
    },
    RECOMMENDATION_COLD_START_WEIGHT_TRENDING: {
        group: 'Khám phá và Xu hướng',
        label: 'Cold-start · Trọng số xu hướng',
        icon: 'Trending',
        unit: '',
        isJson: false,
    },

    // ---- 3. Bán kính tìm kiếm (Search Radius) ----
    RECOMMENDATION_MAX_RADIUS_KM: {
        group: 'Khám phá và Xu hướng',
        label: 'Bán kính đề xuất tối đa',
        icon: 'Sparkles',
        unit: 'km',
        isJson: false,
    },
    DEFAULT_SEARCH_RADIUS_KM: {
        group: 'Khám phá và Xu hướng',
        label: 'Bán kính đề xuất mặc định',
        icon: 'Sparkles',
        unit: 'km',
        isJson: false,
    },
    SEARCH_RADIUS_EXPANSION_STEP_KM: {
        group: 'Khám phá và Xu hướng',
        label: 'Bước mở rộng bán kính đề xuất',
        icon: 'Sparkles',
        unit: 'km',
        isJson: false,
    },
    RECOMMENDATION_MIN_RADIUS_KM: {
        group: 'Khám phá và Xu hướng',
        label: 'Bán kính đề xuất tối thiểu',
        icon: 'Sparkles',
        unit: 'km',
        isJson: false,
    },

    // ---- 4. Độ phủ lịch làm việc & Kỹ năng theo từng vòng ----
    RECOMMENDATION_SCHEDULE_COVERAGE_ROUND_1: {
        group: 'Khám phá và Xu hướng',
        label: 'Độ phủ lịch làm việc (Vòng 1)',
        icon: 'Layers',
        unit: '',
        isJson: false,
    },
    RECOMMENDATION_SCHEDULE_COVERAGE_ROUND_2: {
        group: 'Khám phá và Xu hướng',
        label: 'Độ phủ lịch làm việc (Vòng 2)',
        icon: 'Layers',
        unit: '',
        isJson: false,
    },
    RECOMMENDATION_SCHEDULE_COVERAGE_ROUND_3: {
        group: 'Khám phá và Xu hướng',
        label: 'Độ phủ lịch làm việc (Vòng 3)',
        icon: 'Layers',
        unit: '',
        isJson: false,
    },
    RECOMMENDATION_SCHEDULE_COVERAGE_FINAL: {
        group: 'Khám phá và Xu hướng',
        label: 'Độ phủ lịch làm việc (Vòng cuối)',
        icon: 'Layers',
        unit: '',
        isJson: false,
    },
    RECOMMENDATION_SKILL_COVERAGE_ROUND_1: {
        group: 'Khám phá và Xu hướng',
        label: 'Trùng khớp kỹ năng (Vòng 1)',
        icon: 'Layers',
        unit: '',
        isJson: false,
    },
    RECOMMENDATION_SKILL_COVERAGE_ROUND_2: {
        group: 'Khám phá và Xu hướng',
        label: 'Trùng khớp kỹ năng (Vòng 2)',
        icon: 'Layers',
        unit: '',
        isJson: false,
    },
    RECOMMENDATION_SKILL_COVERAGE_ROUND_3: {
        group: 'Khám phá và Xu hướng',
        label: 'Trùng khớp kỹ năng (Vòng 3)',
        icon: 'Layers',
        unit: '',
        isJson: false,
    },
    RECOMMENDATION_SKILL_COVERAGE_FINAL: {
        group: 'Khám phá và Xu hướng',
        label: 'Trùng khớp kỹ năng (Vòng cuối)',
        icon: 'Layers',
        unit: '',
        isJson: false,
    },

    // ---- 5. Trang Khám phá & Hành vi (Discovery) ----
    DISCOVERY_WEIGHT_LOCATION: {
        group: 'Khám phá và Xu hướng',
        label: 'Khám phá · Trọng số ưu tiên địa điểm',
        icon: 'Trending',
        unit: '',
        isJson: false,
    },
    DISCOVERY_WEIGHT_JOB_TYPE: {
        group: 'Khám phá và Xu hướng',
        label: 'Khám phá · Trọng số loại công việc',
        icon: 'Trending',
        unit: '',
        isJson: false,
    },
    DISCOVERY_WEIGHT_PREFERRED_JOB_TYPE: {
        group: 'Khám phá và Xu hướng',
        label: 'Khám phá · Điểm cộng loại việc ưa thích',
        icon: 'Trending',
        unit: '',
        isJson: false,
    },
    DISCOVERY_WEIGHT_SALARY: {
        group: 'Khám phá và Xu hướng',
        label: 'Khám phá · Điểm cộng mức lương',
        icon: 'Trending',
        unit: '',
        isJson: false,
    },
    DISCOVERY_WEIGHT_SCHEDULE: {
        group: 'Khám phá và Xu hướng',
        label: 'Khám phá · Trọng số lịch làm việc',
        icon: 'Trending',
        unit: '',
        isJson: false,
    },
    DISCOVERY_BEHAVIOR_WEIGHT_APPLY: {
        group: 'Khám phá và Xu hướng',
        label: 'Hành vi · Trọng số Ứng tuyển',
        icon: 'Trending',
        unit: '',
        isJson: false,
    },
    DISCOVERY_BEHAVIOR_WEIGHT_SAVE: {
        group: 'Khám phá và Xu hướng',
        label: 'Hành vi · Trọng số Lưu việc làm',
        icon: 'Trending',
        unit: '',
        isJson: false,
    },
    DISCOVERY_BEHAVIOR_WEIGHT_VIEW: {
        group: 'Khám phá và Xu hướng',
        label: 'Hành vi · Trọng số Xem việc làm',
        icon: 'Trending',
        unit: '',
        isJson: false,
    },
    RECOMMENDATION_MINIMUM_POOL_SIZE: {
        group: 'Khám phá và Xu hướng',
        label: 'Số lượng ứng viên/việc làm tối thiểu (Pool)',
        icon: 'Sparkles',
        unit: '',
        isJson: false,
    },

    // ---- 6. Xu hướng (Trending) ----
    TRENDING_WEIGHT_APPLY: {
        group: 'Khám phá và Xu hướng',
        label: 'Xu hướng · Điểm cộng khi Ứng tuyển',
        icon: 'Trending',
        unit: '',
        isJson: false,
    },
    TRENDING_WEIGHT_SAVE: {
        group: 'Khám phá và Xu hướng',
        label: 'Xu hướng · Điểm cộng khi Lưu việc làm',
        icon: 'Trending',
        unit: '',
        isJson: false,
    },
    TRENDING_WEIGHT_VIEW: {
        group: 'Khám phá và Xu hướng',
        label: 'Xu hướng · Điểm cộng khi Xem việc làm',
        icon: 'Trending',
        unit: '',
        isJson: false,
    },

    // ---- 7. Bảng xếp hạng Nhà tuyển dụng hàng đầu (Top Recruiter) ----
    TOP_RECRUITER_RANKING_ACTIVE: {
        group: 'Khám phá và Xu hướng',
        label: 'Bật bảng xếp hạng nhà tuyển dụng hàng đầu',
        icon: 'Chart',
        unit: '',
        isJson: false,
    },
    TOP_RECRUITER_MIN_TRUST_SCORE: {
        group: 'Khám phá và Xu hướng',
        label: 'NTD hàng đầu · Điểm uy tín tối thiểu',
        icon: 'Chart',
        unit: '',
        isJson: false,
    },
    TOP_RECRUITER_MIN_SUCCESSFUL_HIRES: {
        group: 'Khám phá và Xu hướng',
        label: 'NTD hàng đầu · Tuyển thành công tối thiểu',
        icon: 'Chart',
        unit: '',
        isJson: false,
    },
    TOP_RECRUITER_MIN_ACCOUNT_AGE_DAYS: {
        group: 'Khám phá và Xu hướng',
        label: 'NTD hàng đầu · Tuổi tài khoản tối thiểu',
        icon: 'Chart',
        unit: 'ngày',
        isJson: false,
    },
    TOP_RECRUITER_ACCOUNT_AGE_REFERENCE: {
        group: 'Khám phá và Xu hướng',
        label: 'NTD hàng đầu · Mốc tính tuổi doanh nghiệp',
        icon: 'Chart',
        unit: '',
        isJson: false,
    },
    TOP_RECRUITER_MIN_VALID_REVIEWS: {
        group: 'Khám phá và Xu hướng',
        label: 'NTD hàng đầu · Số review hợp lệ tối thiểu',
        icon: 'Chart',
        unit: '',
        isJson: false,
    },
    TOP_RECRUITER_RESULT_LIMIT: {
        group: 'Khám phá và Xu hướng',
        label: 'NTD hàng đầu · Số lượng kết quả tối đa',
        icon: 'Chart',
        unit: '',
        isJson: false,
    },
    TOP_RECRUITER_WEIGHT_TRUST_SCORE: {
        group: 'Khám phá và Xu hướng',
        label: 'NTD hàng đầu · Trọng số điểm uy tín',
        icon: 'Chart',
        unit: '',
        isJson: false,
    },
    TOP_RECRUITER_VERIFIED_BONUS: {
        group: 'Khám phá và Xu hướng',
        label: 'NTD hàng đầu · Điểm ưu tiên đã xác minh',
        icon: 'Chart',
        unit: '',
        isJson: false,
    },
    TOP_RECRUITER_WEIGHT_AVERAGE_RATING: {
        group: 'Khám phá và Xu hướng',
        label: 'NTD hàng đầu · Trọng số đánh giá trung bình',
        icon: 'Chart',
        unit: '',
        isJson: false,
    },
    TOP_RECRUITER_WEIGHT_VALID_REVIEWS: {
        group: 'Khám phá và Xu hướng',
        label: 'NTD hàng đầu · Trọng số số lượng review',
        icon: 'Chart',
        unit: '',
        isJson: false,
    },
    TOP_RECRUITER_WEIGHT_SUCCESSFUL_HIRES: {
        group: 'Khám phá và Xu hướng',
        label: 'NTD hàng đầu · Trọng số tuyển thành công',
        icon: 'Chart',
        unit: '',
        isJson: false,
    },
    TOP_RECRUITER_WEIGHT_ACTIVE_JOBS: {
        group: 'Khám phá và Xu hướng',
        label: 'NTD hàng đầu · Trọng số việc đang tuyển',
        icon: 'Chart',
        unit: '',
        isJson: false,
    },
    TOP_RECRUITER_WEIGHT_ACCOUNT_AGE: {
        group: 'Khám phá và Xu hướng',
        label: 'NTD hàng đầu · Trọng số tuổi doanh nghiệp',
        icon: 'Chart',
        unit: '',
        isJson: false,
    },
    TOP_RECRUITER_REVIEW_COUNT_CAP: {
        group: 'Khám phá và Xu hướng',
        label: 'NTD hàng đầu · Mốc trần số review',
        icon: 'Chart',
        unit: '',
        isJson: false,
    },
    TOP_RECRUITER_SUCCESSFUL_HIRE_CAP: {
        group: 'Khám phá và Xu hướng',
        label: 'NTD hàng đầu · Mốc trần tuyển thành công',
        icon: 'Chart',
        unit: '',
        isJson: false,
    },
    TOP_RECRUITER_ACTIVE_JOB_CAP: {
        group: 'Khám phá và Xu hướng',
        label: 'NTD hàng đầu · Mốc trần việc đang tuyển',
        icon: 'Chart',
        unit: '',
        isJson: false,
    },
    TOP_RECRUITER_ACCOUNT_AGE_DAYS_CAP: {
        group: 'Khám phá và Xu hướng',
        label: 'NTD hàng đầu · Mốc trần tuổi doanh nghiệp',
        icon: 'Chart',
        unit: 'ngày',
        isJson: false,
    },

    // ---- 8. Xác thực danh tính (Shield) ----
    VERIFICATION_CITIZEN_CONFIG: {
        group: 'Xác thực danh tính',
        label: 'Ngưỡng kiểm định CCCD / CMND (AI)',
        icon: 'Shield',
        unit: '',
        isJson: true,
    },
    VERIFICATION_BUSINESS_CONFIG: {
        group: 'Xác thực danh tính',
        label: 'Ngưỡng kiểm định Giấy phép ĐKKD (AI)',
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

export const SYSTEM_CONFIG_SUB_GROUPS = {
    MATCHING_WEIGHTS: {
        id: 'MATCHING_WEIGHTS',
        title: '1. Trọng số Khớp lệnh Đề xuất (Matching)',
        description: 'Dùng để tính % điểm phù hợp giữa Ứng viên và Việc làm',
        type: 'sum100',
        targetSum: 100,
        keys: [
            'RECOMMENDATION_WEIGHT_SCHEDULE',
            'RECOMMENDATION_WEIGHT_DISTANCE',
            'RECOMMENDATION_WEIGHT_SKILL',
            'RECOMMENDATION_WEIGHT_TRUST',
            'RECOMMENDATION_WEIGHT_SALARY',
            'RECOMMENDATION_WEIGHT_CONTENT',
        ],
    },
    COLD_START_WEIGHTS: {
        id: 'COLD_START_WEIGHTS',
        title: '2. Trọng số Người dùng mới (Cold Start)',
        description: 'Dùng tính điểm gợi ý cho ứng viên mới chưa có lịch sử hoạt động',
        type: 'sum100',
        targetSum: 100,
        keys: [
            'RECOMMENDATION_COLD_START_WEIGHT_JOB_TYPE',
            'RECOMMENDATION_COLD_START_WEIGHT_DISTANCE',
            'RECOMMENDATION_COLD_START_WEIGHT_SALARY',
            'RECOMMENDATION_COLD_START_WEIGHT_TRUST',
            'RECOMMENDATION_COLD_START_WEIGHT_TRENDING',
        ],
    },
    TOP_RECRUITER_WEIGHTS: {
        id: 'TOP_RECRUITER_WEIGHTS',
        title: '3. Trọng số Xếp hạng NTD Hàng đầu (Top Recruiter Ranking - UC-54)',
        description: 'Dùng để tính điểm xếp hạng 7 tiêu chí cho Doanh nghiệp tuyển dụng hàng đầu',
        type: 'sum100',
        targetSum: 100,
        keys: [
            'TOP_RECRUITER_WEIGHT_TRUST_SCORE',
            'TOP_RECRUITER_VERIFIED_BONUS',
            'TOP_RECRUITER_WEIGHT_AVERAGE_RATING',
            'TOP_RECRUITER_WEIGHT_VALID_REVIEWS',
            'TOP_RECRUITER_WEIGHT_SUCCESSFUL_HIRES',
            'TOP_RECRUITER_WEIGHT_ACTIVE_JOBS',
            'TOP_RECRUITER_WEIGHT_ACCOUNT_AGE',
        ],
    },
    SCHEDULE_COVERAGE: {
        id: 'SCHEDULE_COVERAGE',
        title: '4. Độ phủ Lịch làm việc theo Vòng lọc (Schedule Coverage: 0.0 → 1.0)',
        description: 'Tỷ lệ trùng khớp tối thiểu: Vòng 1 (1.0) ≥ Vòng 2 (0.9) ≥ Vòng 3 (0.8) ≥ Vòng cuối (0.7) ≥ 0.0',
        type: 'coverage',
        keys: [
            'RECOMMENDATION_SCHEDULE_COVERAGE_ROUND_1',
            'RECOMMENDATION_SCHEDULE_COVERAGE_ROUND_2',
            'RECOMMENDATION_SCHEDULE_COVERAGE_ROUND_3',
            'RECOMMENDATION_SCHEDULE_COVERAGE_FINAL',
        ],
    },
    SKILL_COVERAGE: {
        id: 'SKILL_COVERAGE',
        title: '5. Độ phủ Kỹ năng theo Vòng lọc (Skill Coverage: 0.0 → 1.0)',
        description: 'Tỷ lệ trùng khớp tối thiểu: Vòng 1 (0.5) ≥ Vòng 2 (0.3) ≥ Vòng 3 (0.1) ≥ Vòng cuối (0.0) ≥ 0.0',
        type: 'coverage',
        keys: [
            'RECOMMENDATION_SKILL_COVERAGE_ROUND_1',
            'RECOMMENDATION_SKILL_COVERAGE_ROUND_2',
            'RECOMMENDATION_SKILL_COVERAGE_ROUND_3',
            'RECOMMENDATION_SKILL_COVERAGE_FINAL',
        ],
    },
    SEARCH_RADIUS: {
        id: 'SEARCH_RADIUS',
        title: '6. Bán kính Địa lý Đề xuất (Search Radius: km)',
        description: 'Ràng buộc: Bán kính tối thiểu ≤ Bán kính mặc định ≤ Bán kính tối đa (> 0 km)',
        type: 'radius',
        keys: [
            'RECOMMENDATION_MIN_RADIUS_KM',
            'DEFAULT_SEARCH_RADIUS_KM',
            'SEARCH_RADIUS_EXPANSION_STEP_KM',
            'RECOMMENDATION_MAX_RADIUS_KM',
        ],
    },
    TOP_RECRUITER_CRITERIA: {
        id: 'TOP_RECRUITER_CRITERIA',
        title: '7. Điều kiện đủ & Mốc chuẩn hóa NTD Hàng đầu',
        description: 'Ngưỡng tối thiểu và mốc trần chuẩn hóa cho thuật toán xếp hạng UC-54',
        type: 'general',
        keys: [
            'TOP_RECRUITER_RANKING_ACTIVE',
            'TOP_RECRUITER_MIN_TRUST_SCORE',
            'TOP_RECRUITER_MIN_SUCCESSFUL_HIRES',
            'TOP_RECRUITER_MIN_ACCOUNT_AGE_DAYS',
            'TOP_RECRUITER_ACCOUNT_AGE_REFERENCE',
            'TOP_RECRUITER_MIN_VALID_REVIEWS',
            'TOP_RECRUITER_RESULT_LIMIT',
            'TOP_RECRUITER_REVIEW_COUNT_CAP',
            'TOP_RECRUITER_SUCCESSFUL_HIRE_CAP',
            'TOP_RECRUITER_ACTIVE_JOB_CAP',
            'TOP_RECRUITER_ACCOUNT_AGE_DAYS_CAP',
        ],
    },
    DISCOVERY_AND_TRENDING: {
        id: 'DISCOVERY_AND_TRENDING',
        title: '8. Trọng số Khám phá, Hành vi & Xu hướng (Discovery & Trending)',
        description: 'Điểm cộng xu hướng và tương tác người dùng (Ứng tuyển ≥ Lưu việc ≥ Xem việc ≥ 0)',
        type: 'general',
        keys: [
            'DISCOVERY_WEIGHT_LOCATION',
            'DISCOVERY_WEIGHT_JOB_TYPE',
            'DISCOVERY_WEIGHT_PREFERRED_JOB_TYPE',
            'DISCOVERY_WEIGHT_SALARY',
            'DISCOVERY_WEIGHT_SCHEDULE',
            'DISCOVERY_BEHAVIOR_WEIGHT_APPLY',
            'DISCOVERY_BEHAVIOR_WEIGHT_SAVE',
            'DISCOVERY_BEHAVIOR_WEIGHT_VIEW',
            'RECOMMENDATION_MINIMUM_POOL_SIZE',
            'TRENDING_WEIGHT_APPLY',
            'TRENDING_WEIGHT_SAVE',
            'TRENDING_WEIGHT_VIEW',
        ],
    },
};

export const SYSTEM_CONFIG_SUB_GROUP_ORDER = [
    'MATCHING_WEIGHTS',
    'COLD_START_WEIGHTS',
    'TOP_RECRUITER_WEIGHTS',
    'SCHEDULE_COVERAGE',
    'SKILL_COVERAGE',
    'SEARCH_RADIUS',
    'TOP_RECRUITER_CRITERIA',
    'DISCOVERY_AND_TRENDING',
];

export const getSystemConfigUiMeta = (configKey, beConfigGroup, beItem) => {
    const mapped = SYSTEM_CONFIG_UI_MAP[configKey];
    const group = beConfigGroup?.trim() || mapped?.group || 'Khác';
    if (mapped) {
        return {
            key: configKey,
            group,
            label: mapped.label || beItem?.description || configKey,
            icon: mapped.icon || 'Settings',
            unit: mapped.unit || '',
            isJson: Boolean(mapped.isJson),
        };
    }
    return {
        key: configKey,
        group,
        label: beItem?.description || configKey,
        icon: 'Settings',
        unit: '',
        isJson: false,
    };
};
