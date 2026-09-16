/** Chuẩn hóa để kiểm tra: bỏ khoảng trắng và dấu gạch phân cách. */
export const normalizeTaxCode = (value) =>
    String(value ?? '')
        .trim()
        .replace(/[\s-]/g, '');

export const isValidTaxCode = (value) => {
    const normalized = normalizeTaxCode(value);
    return /^\d{10}$|^\d{13}$/.test(normalized);
};

/** MST 13 số được chuẩn hóa thành dạng 10 số-3 số để hiển thị và gửi BE. */
export const formatTaxCode = (value) => {
    const normalized = normalizeTaxCode(value);
    if (/^\d{13}$/.test(normalized)) {
        return `${normalized.slice(0, 10)}-${normalized.slice(10)}`;
    }
    return normalized;
};

/** Dùng cho ô nhập: bỏ ký tự lạ, giới hạn 13 số và tự chèn dấu gạch. */
export const formatTaxCodeInput = (value) => {
    const digits = String(value ?? '').replace(/\D/g, '').slice(0, 13);
    if (digits.length > 10) {
        return `${digits.slice(0, 10)}-${digits.slice(10)}`;
    }
    return digits;
};
