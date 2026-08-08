/**
 * Helpers ngành nghề / loại hình DN.
 * Danh sách dropdown: GET /api/v1/recruiter/profile/business-types (không hardcode).
 * File này chỉ map code ↔ nhãn khi chưa có catalog từ API (guest / legacy).
 */

/** Fallback nhãn VI khi chưa load API (guest profile, v.v.) */
const FALLBACK_LABELS = {
    FNB: 'F&B (Dịch vụ ăn uống)',
    RETAIL: 'Bán lẻ (Retail)',
    SERVICES: 'Dịch vụ (Services)',
    INDIVIDUAL: 'Cá nhân / hộ kinh doanh',
};

/** Map nhãn / giá trị cũ → code BE */
const LEGACY_TO_CODE = {
    'F&B (Dịch vụ ăn uống)': 'FNB',
    'F&B / Nhà hàng': 'FNB',
    'Food and Beverage': 'FNB',
    Retail: 'RETAIL',
    Services: 'SERVICES',
    'Cá nhân': 'INDIVIDUAL',
    'Hộ kinh doanh': 'INDIVIDUAL',
    'Doanh nghiệp tư nhân': 'INDIVIDUAL',
    'Công ty TNHH': 'SERVICES',
    'Công ty cổ phần': 'SERVICES',
    Startup: 'SERVICES',
    'Tập đoàn': 'SERVICES',
    Khác: 'SERVICES',
};

/**
 * Chuẩn hóa về code BE. Không nhận diện được → null (tránh gửi nhãn VI).
 * @param {string} input
 * @param {{ value: string, label?: string }[]} [options] catalog từ API
 */
export const toBusinessTypeCode = (input, options = []) => {
    const raw = String(input || '').trim();
    if (!raw) return null;

    const upper = raw.toUpperCase();
    if (Array.isArray(options) && options.some((o) => String(o.value).toUpperCase() === upper)) {
        return upper;
    }
    if (FALLBACK_LABELS[upper]) return upper;

    if (LEGACY_TO_CODE[raw]) return LEGACY_TO_CODE[raw];

    const normalized = raw
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    if (normalized.includes('f&b') || normalized.includes('fnb') || normalized.includes('an uong') || normalized.includes('food')) {
        return 'FNB';
    }
    if (normalized.includes('ban le') || normalized.includes('retail')) return 'RETAIL';
    if (normalized.includes('ca nhan') || normalized.includes('ho kinh doanh') || normalized.includes('individual')) {
        return 'INDIVIDUAL';
    }
    if (normalized.includes('dich vu') || normalized.includes('service')) return 'SERVICES';

    return null;
};

/**
 * @param {string} input code hoặc nhãn
 * @param {{ value: string, label: string }[]} [options]
 */
export const formatBusinessTypeLabel = (input, options = []) => {
    if (!input) return '';
    const code = toBusinessTypeCode(input, options) || String(input).trim().toUpperCase();
    const fromApi = Array.isArray(options)
        ? options.find((item) => String(item.value).toUpperCase() === code)
        : null;
    if (fromApi?.label) return fromApi.label;
    if (FALLBACK_LABELS[code]) return FALLBACK_LABELS[code];
    return String(input);
};

/** Map response BE → options select { value: code, label: name, requiresBusinessLicense? } */
export const mapBusinessTypeOptions = (list) => {
    if (!Array.isArray(list)) return [];
    return list
        .filter((item) => item?.code)
        .map((item) => ({
            value: String(item.code).toUpperCase(),
            label: item.name || item.code,
            description: item.description || '',
            id: item.id,
            requiresBusinessLicense:
                typeof item.requiresBusinessLicense === 'boolean'
                    ? item.requiresBusinessLicense
                    : undefined,
        }));
};
