/** @returns {(number|'ellipsis')[]} */
export const buildRecruitmentPageItems = (page, totalPages) => {
    if (totalPages <= 1) return [];
    if (totalPages <= 4) {
        return Array.from({ length: totalPages }, (_, i) => i);
    }
    const last = totalPages - 1;
    const set = new Set([0, last, page, page - 1, page + 1, page - 2, page + 2]);
    const sorted = [...set].filter((p) => p >= 0 && p <= last).sort((a, b) => a - b);
    const items = [];
    let prev = null;
    sorted.forEach((p) => {
        if (prev != null && p - prev > 1) items.push('ellipsis');
        items.push(p);
        prev = p;
    });
    return items;
};

export const paginateItems = (items, page, pageSize) => {
    const list = Array.isArray(items) ? items : [];
    const totalPages = list.length === 0 ? 0 : Math.ceil(list.length / pageSize);
    const maxPage = Math.max(totalPages - 1, 0);
    const currentPage = Math.min(Math.max(page, 0), maxPage);
    const start = currentPage * pageSize;
    return {
        pageItems: list.slice(start, start + pageSize),
        totalPages,
        currentPage,
    };
};
