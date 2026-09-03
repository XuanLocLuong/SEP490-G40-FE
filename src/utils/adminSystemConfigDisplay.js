import {
    CONFIG_UI_GROUP_ORDER,
    SYSTEM_CONFIG_SUB_GROUPS,
    SYSTEM_CONFIG_SUB_GROUP_ORDER,
} from '../constants/adminSystemConfigUiMap.js';

export const CONFIG_DATA_TYPE = {
    NUMBER: 'NUMBER',
    STRING: 'STRING',
    BOOLEAN: 'BOOLEAN',
    JSON: 'JSON',
};

export const CONFIG_DATA_TYPE_LABELS = {
    NUMBER: 'Số',
    STRING: 'Chuỗi',
    BOOLEAN: 'Boolean',
    JSON: 'JSON',
};

export const getConfigDataTypeLabel = (type) =>
    CONFIG_DATA_TYPE_LABELS[type] || type || '—';

/** Group list theo configGroup, giữ thứ tự xuất hiện từ BE. */
export const groupSystemConfigs = (items = []) => {
    const map = new Map();
    items.forEach((item) => {
        const group = item?.configGroup?.trim() || 'Khác';
        if (!map.has(group)) map.set(group, []);
        map.get(group).push(item);
    });
    return Array.from(map.entries()).map(([group, configs]) => ({ group, configs }));
};

export const formatConfigValueDisplay = (value, dataType) => {
    if (value == null || value === '') return '—';
    const type = String(dataType || '').toUpperCase();
    if (type === CONFIG_DATA_TYPE.BOOLEAN) {
        if (value === true || value === 'true' || value === 'TRUE') return 'Bật (true)';
        if (value === false || value === 'false' || value === 'FALSE') return 'Tắt (false)';
    }
    if (type === CONFIG_DATA_TYPE.JSON || typeof value === 'object') {
        try {
            return JSON.stringify(value, null, 2);
        } catch {
            return String(value);
        }
    }
    return String(value);
};

/** Chuỗi draft để edit trong form. */
export const toConfigDraftString = (value, dataType) => {
    if (value == null) return '';
    const type = String(dataType || '').toUpperCase();
    if (type === CONFIG_DATA_TYPE.BOOLEAN) {
        return value === true || value === 'true' || value === 'TRUE' ? 'true' : 'false';
    }
    if (type === CONFIG_DATA_TYPE.JSON || typeof value === 'object') {
        try {
            return JSON.stringify(value, null, 2);
        } catch {
            return String(value);
        }
    }
    return String(value);
};

/**
 * Parse allowedRange kiểu "0-100", "0.0-1.0", ">=0", "<=100".
 * Trả về { min, max } hoặc null nếu không parse được.
 */
export const parseAllowedRange = (allowedRange) => {
    if (!allowedRange || typeof allowedRange !== 'string') return null;
    const text = allowedRange.trim();
    const between = text.match(/^(-?\d+(?:\.\d+)?)\s*[-–]\s*(-?\d+(?:\.\d+)?)$/);
    if (between) {
        return { min: Number(between[1]), max: Number(between[2]) };
    }
    const gte = text.match(/^>=\s*(-?\d+(?:\.\d+)?)$/);
    if (gte) return { min: Number(gte[1]), max: undefined };
    const lte = text.match(/^<=\s*(-?\d+(?:\.\d+)?)$/);
    if (lte) return { min: undefined, max: Number(lte[1]) };
    return null;
};

export const areConfigValuesEqual = (a, b, dataType) => {
    const type = String(dataType || '').toUpperCase();
    if (type === CONFIG_DATA_TYPE.NUMBER) {
        const na = Number(a);
        const nb = Number(b);
        if (Number.isNaN(na) || Number.isNaN(nb)) return String(a) === String(b);
        return na === nb;
    }
    if (type === CONFIG_DATA_TYPE.BOOLEAN) {
        const toBool = (v) => v === true || v === 'true' || v === 'TRUE';
        return toBool(a) === toBool(b);
    }
    if (type === CONFIG_DATA_TYPE.JSON || (typeof a === 'object' && a != null) || (typeof b === 'object' && b != null)) {
        try {
            const sa = typeof a === 'string' ? JSON.stringify(JSON.parse(a)) : JSON.stringify(a ?? null);
            const sb = typeof b === 'string' ? JSON.stringify(JSON.parse(b)) : JSON.stringify(b ?? null);
            return sa === sb;
        } catch {
            return String(a) === String(b);
        }
    }
    return String(a ?? '') === String(b ?? '');
};

/**
 * Validate + convert draft string → newValue gửi BE.
 * Trả { ok, value, error }.
 */
export const parseAndValidateConfigValue = (draft, config) => {
    const type = String(config?.dataType || '').toUpperCase();
    const raw = typeof draft === 'string' ? draft.trim() : draft;

    if (raw === '' || raw == null) {
        return { ok: false, value: null, error: 'Vui lòng nhập giá trị mới.' };
    }

    if (type === CONFIG_DATA_TYPE.NUMBER) {
        const num = Number(raw);
        if (Number.isNaN(num)) {
            return { ok: false, value: null, error: 'Giá trị phải là số.' };
        }
        const range = parseAllowedRange(config?.allowedRange);
        if (range?.min != null && num < range.min) {
            return { ok: false, value: null, error: `Giá trị phải ≥ ${range.min}.` };
        }
        if (range?.max != null && num > range.max) {
            return { ok: false, value: null, error: `Giá trị phải ≤ ${range.max}.` };
        }
        return { ok: true, value: num, error: '' };
    }

    if (type === CONFIG_DATA_TYPE.BOOLEAN) {
        if (raw !== 'true' && raw !== 'false' && raw !== true && raw !== false) {
            return { ok: false, value: null, error: 'Giá trị boolean phải là true hoặc false.' };
        }
        return { ok: true, value: raw === true || raw === 'true', error: '' };
    }

    if (type === CONFIG_DATA_TYPE.JSON) {
        try {
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            return { ok: true, value: parsed, error: '' };
        } catch {
            return { ok: false, value: null, error: 'JSON không hợp lệ.' };
        }
    }

    // STRING / fallback
    return { ok: true, value: String(raw), error: '' };
};

/** Hiển thị giá trị mặc định của một field con trong JSON config. */
export const formatConfigDefaultFieldDisplay = (value) => {
    if (value == null) return '—';
    if (typeof value === 'boolean') {
        return value ? 'Bật (true)' : 'Tắt (false)';
    }
    if (typeof value === 'object') {
        try {
            return JSON.stringify(value);
        } catch {
            return String(value);
        }
    }
    return String(value);
};

/**
 * Parse defaultValue JSON config → object, giữ thứ tự field theo draft nếu có.
 */
export const getJsonConfigDefaultEntries = (defaultValue, draftObject) => {
    const defaults = parseJsonConfigObject(defaultValue);
    const draftKeys =
        draftObject && typeof draftObject === 'object' && !Array.isArray(draftObject)
            ? Object.keys(draftObject)
            : [];
    const defaultKeys = Object.keys(defaults);
    const orderedKeys = draftKeys.length
        ? [...draftKeys, ...defaultKeys.filter((k) => !draftKeys.includes(k))]
        : defaultKeys;

    return orderedKeys.map((key) => [key, defaults[key]]);
};

/** Normalize currentValue (object | JSON string) → plain object for JSON editors. */
export const parseJsonConfigObject = (raw) => {
    if (raw == null || raw === '') return {};
    if (typeof raw === 'object' && !Array.isArray(raw)) return { ...raw };
    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return { ...parsed };
        } catch {
            return {};
        }
    }
    return {};
};

/**
 * Clone value for draft state.
 * JSON / object → shallow-cloned object; primitives as-is.
 */
export const cloneConfigDraftValue = (value, dataType, forceJson = false) => {
    const type = String(dataType || '').toUpperCase();
    if (forceJson || type === CONFIG_DATA_TYPE.JSON || (typeof value === 'object' && value != null)) {
        return parseJsonConfigObject(value);
    }
    return value;
};

/**
 * Validate draft (already typed) before PUT.
 * For JSON drafts that are objects, validate as object.
 */
export const validateConfigDraftValue = (draft, config) => {
    const type = String(config?.dataType || '').toUpperCase();

    if (type === CONFIG_DATA_TYPE.JSON || (draft && typeof draft === 'object' && !Array.isArray(draft))) {
        if (draft == null || typeof draft !== 'object' || Array.isArray(draft)) {
            return { ok: false, value: null, error: `${config.configKey}: JSON không hợp lệ.` };
        }
        // Coerce nested string numbers where leaf is string that looks numeric? keep as-is from inputs
        const normalized = {};
        for (const [k, v] of Object.entries(draft)) {
            if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v)) && /^-?\d+(\.\d+)?$/.test(v.trim())) {
                normalized[k] = Number(v);
            } else if (v === 'true' || v === 'false') {
                normalized[k] = v === 'true';
            } else {
                normalized[k] = v;
            }
        }
        return { ok: true, value: normalized, error: '' };
    }

    return parseAndValidateConfigValue(
        draft == null ? '' : String(draft),
        config
    );
};

/**
 * Workaround BE JSON column: gửi newValue dạng chuỗi JSON hợp lệ
 * (tránh Map.toString() phía BE → MySQL cast_as_json lỗi).
 * NUMBER/STRING/BOOLEAN giữ nguyên kiểu.
 */
export const toApiConfigNewValue = (value, dataType, forceJson = false) => {
    const type = String(dataType || '').toUpperCase();
    if (forceJson || type === CONFIG_DATA_TYPE.JSON) {
        if (typeof value === 'string') {
            // Đã là string — đảm bảo parse được rồi stringify lại cho chuẩn
            try {
                return JSON.stringify(JSON.parse(value));
            } catch {
                return value;
            }
        }
        return JSON.stringify(value ?? {});
    }
    return value;
};

/**
 * Build UI sections from BE items + FE map.
 * Chỉ gồm group có ít nhất 1 config thật từ BE.
 */
export const buildSystemConfigUiSections = (items = [], getMeta) => {
    const buckets = new Map();

    items.forEach((item) => {
        const meta = getMeta(item.configKey, item.configGroup, item);
        const group = meta.group || 'Khác';
        if (!buckets.has(group)) buckets.set(group, []);
        buckets.get(group).push({ item, meta });
    });

    const ordered = [];
    const used = new Set();

    CONFIG_UI_GROUP_ORDER.forEach((group) => {
        if (!buckets.has(group)) return;
        ordered.push({ group, rows: buckets.get(group) });
        used.add(group);
    });

    buckets.forEach((rows, group) => {
        if (used.has(group)) return;
        ordered.push({ group, rows });
    });

    return ordered;
};

/**
 * Phân chia danh sách cấu hình của nhóm 'Khám phá và Xu hướng' thành các nhóm con logic.
 */
export const buildSystemConfigSubSections = (rows = []) => {
    if (!rows.length) return [];

    const rowMap = new Map();
    rows.forEach((r) => rowMap.set(r.item.configKey, r));

    const usedKeys = new Set();
    const subSections = [];

    SYSTEM_CONFIG_SUB_GROUP_ORDER.forEach((subGroupId) => {
        const def = SYSTEM_CONFIG_SUB_GROUPS[subGroupId];
        if (!def) return;

        const subRows = [];
        def.keys.forEach((key) => {
            if (rowMap.has(key)) {
                subRows.push(rowMap.get(key));
                usedKeys.add(key);
            }
        });

        if (subRows.length > 0) {
            subSections.push({
                subGroupId,
                def,
                rows: subRows,
            });
        }
    });

    // Các tham số chưa phân nhóm (nếu có)
    const remainingRows = rows.filter((r) => !usedKeys.has(r.item.configKey));
    if (remainingRows.length > 0) {
        subSections.push({
            subGroupId: 'OTHER_SUB_GROUP',
            def: {
                id: 'OTHER_SUB_GROUP',
                title: 'Các tham số khác',
                description: '',
                type: 'general',
            },
            rows: remainingRows,
        });
    }

    return subSections;
};

/**
 * Validate toàn bộ các ràng buộc logic liên nhóm (Cross-field Hard Constraints).
 * Trả về { isValid: boolean, errors: { subGroupId: string, message: string }[], groupStatuses: Record<string, any> }
 */
export const validateSystemConfigConstraints = (drafts = {}, items = []) => {
    const errors = [];
    const groupStatuses = {};

    const getVal = (key, fallback = 0) => {
        if (drafts[key] !== undefined && drafts[key] !== null) {
            if (drafts[key] === '') return 0;
            const n = Number(drafts[key]);
            return Number.isNaN(n) ? fallback : n;
        }
        const item = items.find((i) => i.configKey === key);
        if (item && item.currentValue !== undefined && item.currentValue !== null) {
            if (item.currentValue === '') return fallback;
            const n = Number(item.currentValue);
            return Number.isNaN(n) ? fallback : n;
        }
        return fallback;
    };

    const calcSum = (keys) => {
        const sum = keys.reduce((acc, key) => acc + getVal(key, 0), 0);
        return Math.round(sum * 100) / 100;
    };

    // 1. Nhóm 1.1: Trọng số Matching (sum = 100)
    const matchingSum = calcSum(SYSTEM_CONFIG_SUB_GROUPS.MATCHING_WEIGHTS.keys);
    const matchingValid = Math.abs(matchingSum - 100) < 0.001;
    groupStatuses.MATCHING_WEIGHTS = {
        sum: matchingSum,
        isValid: matchingValid,
        diff: Math.round((matchingSum - 100) * 100) / 100,
    };
    if (!matchingValid) {
        errors.push({
            subGroupId: 'MATCHING_WEIGHTS',
            message: `Tổng trọng số Khớp lệnh Đề xuất (Matching) phải bằng đúng 100% (Hiện tại: ${matchingSum}% · ${matchingSum > 100 ? `Đang dư +${groupStatuses.MATCHING_WEIGHTS.diff}%` : `Đang thiếu ${Math.abs(groupStatuses.MATCHING_WEIGHTS.diff)}%`}).`,
        });
    }

    // 2. Nhóm 1.2: Trọng số Cold Start (sum = 100)
    const coldStartSum = calcSum(SYSTEM_CONFIG_SUB_GROUPS.COLD_START_WEIGHTS.keys);
    const coldStartValid = Math.abs(coldStartSum - 100) < 0.001;
    groupStatuses.COLD_START_WEIGHTS = {
        sum: coldStartSum,
        isValid: coldStartValid,
        diff: Math.round((coldStartSum - 100) * 100) / 100,
    };
    if (!coldStartValid) {
        errors.push({
            subGroupId: 'COLD_START_WEIGHTS',
            message: `Tổng trọng số Người dùng mới (Cold Start) phải bằng đúng 100% (Hiện tại: ${coldStartSum}% · ${coldStartSum > 100 ? `Đang dư +${groupStatuses.COLD_START_WEIGHTS.diff}%` : `Đang thiếu ${Math.abs(groupStatuses.COLD_START_WEIGHTS.diff)}%`}).`,
        });
    }

    // 3. Nhóm 1.3: Trọng số Top Recruiter Ranking (sum = 100)
    const topRecruiterSum = calcSum(SYSTEM_CONFIG_SUB_GROUPS.TOP_RECRUITER_WEIGHTS.keys);
    const topRecruiterValid = Math.abs(topRecruiterSum - 100) < 0.001;
    groupStatuses.TOP_RECRUITER_WEIGHTS = {
        sum: topRecruiterSum,
        isValid: topRecruiterValid,
        diff: Math.round((topRecruiterSum - 100) * 100) / 100,
    };
    if (!topRecruiterValid) {
        errors.push({
            subGroupId: 'TOP_RECRUITER_WEIGHTS',
            message: `Tổng 7 trọng số Bảng xếp hạng NTD hàng đầu phải bằng đúng 100% (Hiện tại: ${topRecruiterSum}% · ${topRecruiterSum > 100 ? `Đang dư +${groupStatuses.TOP_RECRUITER_WEIGHTS.diff}%` : `Đang thiếu ${Math.abs(groupStatuses.TOP_RECRUITER_WEIGHTS.diff)}%`}).`,
        });
    }

    // 4. Nhóm 2.1: Độ phủ Lịch làm việc (0.0 -> 1.0, r1 >= r2 >= r3 >= rf)
    const schedR1 = getVal('RECOMMENDATION_SCHEDULE_COVERAGE_ROUND_1', 1.0);
    const schedR2 = getVal('RECOMMENDATION_SCHEDULE_COVERAGE_ROUND_2', 0.9);
    const schedR3 = getVal('RECOMMENDATION_SCHEDULE_COVERAGE_ROUND_3', 0.8);
    const schedRf = getVal('RECOMMENDATION_SCHEDULE_COVERAGE_FINAL', 0.7);

    const schedValues = [schedR1, schedR2, schedR3, schedRf];
    if (schedValues.some((v) => v < 0 || v > 1)) {
        errors.push({
            subGroupId: 'SCHEDULE_COVERAGE',
            message: 'Độ phủ lịch làm việc: Các giá trị phải nằm trong khoảng từ 0.0 đến 1.0.',
        });
    }
    if (schedR2 > schedR1) {
        errors.push({
            subGroupId: 'SCHEDULE_COVERAGE',
            message: `Độ phủ lịch làm việc: Vòng 2 (${schedR2}) không được lớn hơn Vòng 1 (${schedR1}).`,
        });
    }
    if (schedR3 > schedR2) {
        errors.push({
            subGroupId: 'SCHEDULE_COVERAGE',
            message: `Độ phủ lịch làm việc: Vòng 3 (${schedR3}) không được lớn hơn Vòng 2 (${schedR2}).`,
        });
    }
    if (schedRf > schedR3) {
        errors.push({
            subGroupId: 'SCHEDULE_COVERAGE',
            message: `Độ phủ lịch làm việc: Vòng cuối (${schedRf}) không được lớn hơn Vòng 3 (${schedR3}).`,
        });
    }

    // 5. Nhóm 2.2: Độ phủ Kỹ năng (0.0 -> 1.0, s1 >= s2 >= s3 >= sf)
    const skillR1 = getVal('RECOMMENDATION_SKILL_COVERAGE_ROUND_1', 0.5);
    const skillR2 = getVal('RECOMMENDATION_SKILL_COVERAGE_ROUND_2', 0.3);
    const skillR3 = getVal('RECOMMENDATION_SKILL_COVERAGE_ROUND_3', 0.1);
    const skillRf = getVal('RECOMMENDATION_SKILL_COVERAGE_FINAL', 0.0);

    const skillValues = [skillR1, skillR2, skillR3, skillRf];
    if (skillValues.some((v) => v < 0 || v > 1)) {
        errors.push({
            subGroupId: 'SKILL_COVERAGE',
            message: 'Độ phủ kỹ năng: Các giá trị phải nằm trong khoảng từ 0.0 đến 1.0.',
        });
    }
    if (skillR2 > skillR1) {
        errors.push({
            subGroupId: 'SKILL_COVERAGE',
            message: `Độ phủ kỹ năng: Vòng 2 (${skillR2}) không được lớn hơn Vòng 1 (${skillR1}).`,
        });
    }
    if (skillR3 > skillR2) {
        errors.push({
            subGroupId: 'SKILL_COVERAGE',
            message: `Độ phủ kỹ năng: Vòng 3 (${skillR3}) không được lớn hơn Vòng 2 (${skillR2}).`,
        });
    }
    if (skillRf > skillR3) {
        errors.push({
            subGroupId: 'SKILL_COVERAGE',
            message: `Độ phủ kỹ năng: Vòng cuối (${skillRf}) không được lớn hơn Vòng 3 (${skillR3}).`,
        });
    }

    // 6. Nhóm 3: Bán kính tìm kiếm (km)
    const minRad = getVal('RECOMMENDATION_MIN_RADIUS_KM', 1.0);
    const defRad = getVal('DEFAULT_SEARCH_RADIUS_KM', 5.0);
    const maxRad = getVal('RECOMMENDATION_MAX_RADIUS_KM', 15.0);
    const stepRad = getVal('SEARCH_RADIUS_EXPANSION_STEP_KM', 2.0);

    if (minRad <= 0 || defRad <= 0 || maxRad <= 0) {
        errors.push({
            subGroupId: 'SEARCH_RADIUS',
            message: 'Bán kính địa lý: Các giá trị bán kính phải lớn hơn 0 km.',
        });
    }
    if (stepRad <= 0) {
        errors.push({
            subGroupId: 'SEARCH_RADIUS',
            message: 'Bán kính địa lý: Bước mở rộng bán kính phải lớn hơn 0 km.',
        });
    }
    if (minRad > defRad) {
        errors.push({
            subGroupId: 'SEARCH_RADIUS',
            message: `Bán kính địa lý: Bán kính tối thiểu (${minRad} km) không được lớn hơn Bán kính mặc định (${defRad} km).`,
        });
    }
    if (defRad > maxRad) {
        errors.push({
            subGroupId: 'SEARCH_RADIUS',
            message: `Bán kính địa lý: Bán kính mặc định (${defRad} km) không được lớn hơn Bán kính tối đa (${maxRad} km).`,
        });
    }
    if (minRad > maxRad) {
        errors.push({
            subGroupId: 'SEARCH_RADIUS',
            message: `Bán kính địa lý: Bán kính tối thiểu (${minRad} km) không được lớn hơn Bán kính tối đa (${maxRad} km).`,
        });
    }

    // 7. Nhóm 4: Hành vi & Xu hướng (>= 0)
    const behaviorKeys = [
        'DISCOVERY_BEHAVIOR_WEIGHT_APPLY',
        'DISCOVERY_BEHAVIOR_WEIGHT_SAVE',
        'DISCOVERY_BEHAVIOR_WEIGHT_VIEW',
        'TRENDING_WEIGHT_APPLY',
        'TRENDING_WEIGHT_SAVE',
        'TRENDING_WEIGHT_VIEW',
    ];
    for (const bKey of behaviorKeys) {
        if (getVal(bKey, 0) < 0) {
            errors.push({
                subGroupId: 'DISCOVERY_AND_TRENDING',
                message: `Hệ số tương tác: ${bKey} không được là số âm.`,
            });
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        groupStatuses,
    };
};
