/**
 * Helpers loại hình DN — danh sách chỉ lấy từ BE
 * (GET /api/v1/recruiter/profile/business-types). Không hardcode code/nhãn.
 */

const matchOption = (input, options = []) => {
    const raw = String(input || '').trim();
    if (!raw || !Array.isArray(options) || options.length === 0) return null;

    const upper = raw.toUpperCase();
    return (
        options.find((item) => String(item.value).toUpperCase() === upper) ||
        options.find((item) => String(item.label || '').trim() === raw) ||
        null
    );
};

/**
 * Chuẩn hóa về code BE theo catalog API. Không khớp → null.
 * @param {string} input
 * @param {{ value: string, label?: string }[]} [options]
 */
export const toBusinessTypeCode = (input, options = []) => {
    const match = matchOption(input, options);
    return match ? String(match.value).toUpperCase() : null;
};

/**
 * Nhãn hiển thị từ catalog. Không có catalog → trả nguyên input (code/tên BE).
 * @param {string} input
 * @param {{ value: string, label: string }[]} [options]
 */
export const formatBusinessTypeLabel = (input, options = []) => {
    if (!input) return '';
    const match = matchOption(input, options);
    if (match?.label) return match.label;
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
