import { JOB_TYPE_OPTIONS } from '../constants/jobPost.js';
import recruiterJobApi from '../apis/RecruiterJobApi.jsx';

const toArray = (value) => {
    if (Array.isArray(value)) return value;
    if (value == null || value === '') return [];
    return [value];
};

const KNOWN_LABELS_STORAGE_KEY = 'joblink.jobTypeLabels.v1';

const readKnownLabelsFromStorage = () => {
    try {
        const raw = sessionStorage.getItem(KNOWN_LABELS_STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
};

const writeKnownLabelsToStorage = (mapObj) => {
    try {
        sessionStorage.setItem(KNOWN_LABELS_STORAGE_KEY, JSON.stringify(mapObj));
    } catch {
        // ignore
    }
};

/** code → label đã từng thấy (API / fallback) — giữ để toast khi loại đã bị gỡ khỏi /jobs/types. */
const knownJobTypeLabels = new Map(
    Object.entries(readKnownLabelsFromStorage()).map(([code, label]) => [
        String(code),
        String(label),
    ]),
);

/**
 * Normalize GET /jobs/types item.
 * Hỗ trợ BE hiện tại `{ value, label }` và đề xuất thêm `active`.
 * Thiếu `active` → mặc định true (API public hiện chỉ trả loại đang mở).
 */
export const normalizeJobTypeOption = (item) => {
    if (!item) return null;
    if (typeof item === 'string') {
        return { value: item, label: item, active: true };
    }
    const value = item.value || item.name || item.code;
    if (!value) return null;
    const active =
        item.active == null && item.isActive == null
            ? true
            : Boolean(item.active ?? item.isActive);
    return {
        value: String(value),
        label: String(item.label || item.name || value),
        active,
    };
};

export const normalizeJobTypeOptions = (list) => {
    if (!Array.isArray(list)) return [];
    return list.map(normalizeJobTypeOption).filter(Boolean);
};

export const rememberJobTypeLabels = (options = []) => {
    let changed = false;
    toArray(options).forEach((option) => {
        const normalized = normalizeJobTypeOption(option);
        if (!normalized?.value || !normalized.label) return;
        if (knownJobTypeLabels.get(normalized.value) === normalized.label) return;
        knownJobTypeLabels.set(normalized.value, normalized.label);
        changed = true;
    });
    if (changed) {
        writeKnownLabelsToStorage(Object.fromEntries(knownJobTypeLabels));
    }
};

// Seed fallback cứng.
rememberJobTypeLabels(JOB_TYPE_OPTIONS);

/** Options đang chọn được (active !== false). */
export const getActiveJobTypeOptions = (options = []) =>
    options.filter((option) => option?.value && option.active !== false);

/**
 * Lĩnh vực đang chọn nhưng không còn dùng được:
 * - không có trong catalog, hoặc
 * - có trong catalog với active === false
 */
export const getInactiveSelectedJobTypes = (selectedCodes, options = []) => {
    const selected = toArray(selectedCodes)
        .map((code) => String(code).trim())
        .filter(Boolean);
    if (selected.length === 0) return [];

    const byValue = new Map(
        options
            .filter((option) => option?.value)
            .map((option) => [String(option.value), option]),
    );

    return selected.filter((code) => {
        const option = byValue.get(code);
        if (!option) return true;
        return option.active === false;
    });
};

export const pruneInactiveJobTypes = (selectedCodes, options = []) => {
    const selected = toArray(selectedCodes)
        .map((code) => String(code).trim())
        .filter(Boolean);
    const removed = getInactiveSelectedJobTypes(selected, options);
    if (removed.length === 0) {
        return { nextTypes: selected, removed: [] };
    }
    const removedSet = new Set(removed);
    return {
        nextTypes: selected.filter((code) => !removedSet.has(code)),
        removed,
    };
};

const labelLookupOptions = (options = []) => {
    const fallback = normalizeJobTypeOptions(JOB_TYPE_OPTIONS);
    const byValue = new Map();
    // Ưu tiên: options mới → known session → fallback cứng.
    knownJobTypeLabels.forEach((label, code) => {
        byValue.set(code, label);
    });
    fallback.forEach((option) => {
        if (option?.value) byValue.set(String(option.value), option.label || option.value);
    });
    options.forEach((option) => {
        const normalized = normalizeJobTypeOption(option);
        if (normalized?.value) {
            byValue.set(normalized.value, normalized.label || normalized.value);
        }
    });
    return byValue;
};

export const formatRemovedJobTypeLabels = (removedCodes, options = []) => {
    const labels = labelLookupOptions(options);
    return toArray(removedCodes)
        .map((code) => labels.get(String(code)) || String(code))
        .filter(Boolean);
};

/** Toast khi tự gỡ lĩnh vực đã vô hiệu hóa. */
export const INACTIVE_JOB_TYPES_TOAST_ID = 'job-types-inactive-removed';

export const buildInactiveJobTypesRemovedMessage = (removedCodes, options = []) => {
    const labels = formatRemovedJobTypeLabels(removedCodes, options);
    if (labels.length === 0) {
        return 'Một số ngành nghề đã bị vô hiệu hóa và đã được gỡ khỏi tin. Vui lòng chọn ngành nghề khác nếu cần.';
    }
    return `Một số ngành nghề đã bị vô hiệu hóa và đã được gỡ khỏi tin: ${labels.join(', ')}. Vui lòng chọn ngành nghề khác nếu cần.`;
};

export const getJobTypeLabels = (rawJobTypes, options = []) => {
    if (!rawJobTypes) return [];

    const labelByCode = new Map(
        options
            .filter((option) => option?.value)
            .map((option) => [
                String(option.value).trim().toUpperCase(),
                String(option.label || option.value).trim(),
            ]),
    );

    // Bổ sung known labels (session) khi options không còn loại đã tắt.
    knownJobTypeLabels.forEach((label, code) => {
        const key = String(code).trim().toUpperCase();
        if (!labelByCode.has(key)) labelByCode.set(key, label);
    });

    return String(rawJobTypes)
        .split(',')
        .map((code) => code.trim())
        .filter(Boolean)
        .map((code) => labelByCode.get(code.toUpperCase()) || code);
};

export const formatJobTypeLabels = (rawJobTypes, options = []) =>
    getJobTypeLabels(rawJobTypes, options).join(', ');

let cachedJobTypeOptions = null;
let cachedJobTypeOptionsAt = 0;
let jobTypeOptionsRequest = null;
const JOB_TYPE_CACHE_TTL_MS = 5 * 60 * 1000;

export const invalidateJobTypeOptionsCache = () => {
    // Giữ label đã biết trước khi xóa cache list.
    if (cachedJobTypeOptions?.length) {
        rememberJobTypeLabels(cachedJobTypeOptions);
    }
    cachedJobTypeOptions = null;
    cachedJobTypeOptionsAt = 0;
};

/**
 * Load JobType từ GET /api/v1/jobs/types.
 * @param {{ force?: boolean }} [opts]
 */
export const fetchJobTypeOptions = async ({ force = false } = {}) => {
    if (
        !force &&
        cachedJobTypeOptions &&
        Date.now() - cachedJobTypeOptionsAt < JOB_TYPE_CACHE_TTL_MS
    ) {
        return cachedJobTypeOptions;
    }

    if (force) {
        invalidateJobTypeOptionsCache();
    }

    if (!jobTypeOptionsRequest) {
        jobTypeOptionsRequest = recruiterJobApi
            .getJobTypes()
            .then(normalizeJobTypeOptions)
            .then((list) => {
                const resolved =
                    list.length > 0 ? list : normalizeJobTypeOptions(JOB_TYPE_OPTIONS);
                rememberJobTypeLabels(resolved);
                if (list.length > 0) {
                    cachedJobTypeOptions = list;
                    cachedJobTypeOptionsAt = Date.now();
                }
                return resolved;
            })
            .catch(() => {
                const fallback = normalizeJobTypeOptions(JOB_TYPE_OPTIONS);
                rememberJobTypeLabels(fallback);
                return fallback;
            })
            .finally(() => {
                jobTypeOptionsRequest = null;
            });
    }

    return jobTypeOptionsRequest;
};
