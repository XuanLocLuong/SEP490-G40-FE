import { CONFIG_UI_GROUP_ORDER } from '../constants/adminSystemConfigUiMap.js';

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
