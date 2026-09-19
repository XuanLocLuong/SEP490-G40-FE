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

const uniqueKeepOrder = (items) => {
    const seen = new Set();
    return items.filter((item) => {
        const key = String(item).toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

const normalizeSpaces = (value) => String(value || '').trim().replace(/\s+/g, ' ');

/**
 * Ghép gợi ý vào phần cuối câu đang nhập thay vì thay toàn bộ câu.
 * Ví dụ: "IT Part" + "Part time" => "IT Part time".
 */
const completeKeyword = (keyword, suggestion) => {
    const query = normalizeSpaces(keyword);
    const candidate = normalizeSpaces(suggestion);
    if (!query || !candidate) return null;

    const queryLower = query.toLocaleLowerCase('vi');
    const candidateLower = candidate.toLocaleLowerCase('vi');

    // Câu gợi ý đã chứa nguyên phần người dùng nhập.
    if (candidateLower.includes(queryLower)) return candidate;

    const words = query.split(' ');

    // Tìm cụm dài nhất ở cuối câu đang gõ trùng với đầu từ khóa gợi ý,
    // sau đó chỉ hoàn thành cụm cuối và giữ nguyên phần đứng trước.
    for (let start = 1; start < words.length; start += 1) {
        const suffix = words.slice(start).join(' ').toLocaleLowerCase('vi');
        if (!candidateLower.startsWith(suffix)) continue;

        const prefix = words.slice(0, start).join(' ');
        return `${prefix} ${candidate}`;
    }

    return null;
};

/**
 * Dropdown suggestions while typing. Every returned item is the complete
 * query that will be placed in the input, so existing user text is preserved.
 * @returns {string[]}
 */
export const suggestJobKeywords = (keyword, limit = 6) => {
    const q = normalizeSpaces(keyword);
    if (q.length < 1) return [];

    const lower = q.toLocaleLowerCase('vi');
    const directMatches = JOB_SEARCH_SUGGESTIONS.filter((label) =>
        label.toLocaleLowerCase('vi').includes(lower)
    );
    const appendedMatches = JOB_SEARCH_SUGGESTIONS
        .filter((label) => !label.toLocaleLowerCase('vi').includes(lower))
        .map((label) => completeKeyword(q, label))
        .filter(Boolean);

    return uniqueKeepOrder([...directMatches, ...appendedMatches]).slice(0, limit);
};
