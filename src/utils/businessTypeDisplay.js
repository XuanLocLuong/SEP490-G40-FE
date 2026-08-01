/** BE enum: FNB | RETAIL | SERVICES | INDIVIDUAL */

export const BUSINESS_TYPE_CODES = ['FNB', 'RETAIL', 'SERVICES', 'INDIVIDUAL'];

/** Dropdown: value = code API, label = tiếng Việt trên UI */
export const BUSINESS_TYPE_OPTIONS = [
    { value: 'FNB', label: 'F&B (Dịch vụ ăn uống)' },
    { value: 'RETAIL', label: 'Bán lẻ (Retail)' },
    { value: 'SERVICES', label: 'Dịch vụ (Services)' },
    { value: 'INDIVIDUAL', label: 'Cá nhân / hộ kinh doanh' },
];

/** Map nhãn / giá trị cũ (trước khi BE ép code) → code */
const LEGACY_TO_CODE = {
    'F&B (Dịch vụ ăn uống)': 'FNB',
    'F&B / Nhà hàng': 'FNB',
    'Hộ kinh doanh': 'INDIVIDUAL',
    'Doanh nghiệp tư nhân': 'INDIVIDUAL',
    'Công ty TNHH': 'SERVICES',
    'Công ty cổ phần': 'SERVICES',
    'Startup': 'SERVICES',
    'Tập đoàn': 'SERVICES',
    Khác: 'SERVICES',
};

/**
 * Chuẩn hóa về code BE. Không nhận diện được → null (tránh gửi nhãn VI).
 */
export const toBusinessTypeCode = (input) => {
    const raw = String(input || '').trim();
    if (!raw) return null;

    const upper = raw.toUpperCase();
    if (BUSINESS_TYPE_CODES.includes(upper)) return upper;

    if (LEGACY_TO_CODE[raw]) return LEGACY_TO_CODE[raw];

    const normalized = raw
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    if (normalized.includes('f&b') || normalized.includes('fnb') || normalized.includes('an uong')) {
        return 'FNB';
    }
    if (normalized.includes('ban le') || normalized.includes('retail')) return 'RETAIL';
    if (normalized.includes('ca nhan') || normalized.includes('ho kinh doanh')) {
        return 'INDIVIDUAL';
    }
    if (normalized.includes('dich vu') || normalized.includes('service')) return 'SERVICES';

    return null;
};

export const formatBusinessTypeLabel = (input) => {
    if (!input) return '';
    const code = toBusinessTypeCode(input);
    const opt = BUSINESS_TYPE_OPTIONS.find((item) => item.value === code);
    if (opt) return opt.label;
    return String(input);
};
