import Fuse from 'fuse.js';

/** Catalog gợi ý từ khóa tìm việc (FE-only, không gọi BE). */
export const JOB_SEARCH_SUGGESTIONS = [
    'Pha chế',
    'Thu ngân',
    'Phục vụ',
    'Giao tiếp',
    'Tiếng Anh',
    'Bán hàng',
    'Quản lý kho',
    'Tin học văn phòng',
    'Barista',
    'Nhân viên bán hàng',
    'Nhân viên phục vụ',
    'Nhân viên thu ngân',
    'Nhân viên kho',
    'Giao hàng',
    'Shipper',
    'Part time',
    'Full time',
    'Ca sáng',
    'Ca tối',
    'Nhà hàng',
    'Quán cà phê',
    'Siêu thị',
    'Cửa hàng',
    'Lễ tân',
    'Chăm sóc khách hàng',
    'Tạp vụ',
    'Phụ bếp',
    'Bảo vệ',
];

const fuse = new Fuse(
    JOB_SEARCH_SUGGESTIONS.map((label) => ({ label })),
    {
        keys: ['label'],
        threshold: 0.45,
        ignoreLocation: true,
        minMatchCharLength: 1,
    }
);

const uniqueKeepOrder = (items) => {
    const seen = new Set();
    return items.filter((item) => {
        const key = String(item).toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

/**
 * Dropdown suggestions while typing (includes exact / partial matches).
 * @returns {string[]}
 */
export const suggestJobKeywords = (keyword, limit = 6) => {
    const q = String(keyword || '').trim();
    if (q.length < 1) return [];

    const lower = q.toLowerCase();

    const containsMatches = JOB_SEARCH_SUGGESTIONS.filter((label) =>
        label.toLowerCase().includes(lower)
    );

    const fuzzyMatches = fuse.search(q).map((hit) => hit.item.label);

    return uniqueKeepOrder([...containsMatches, ...fuzzyMatches]).slice(0, limit);
};
