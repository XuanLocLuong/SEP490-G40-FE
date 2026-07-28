import Fuse from 'fuse.js';

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
 * Dropdown suggestions while typing (contains + fuzzy), giống job search.
 * @param {string[]} catalog - danh sách tên skill
 * @param {string} keyword
 * @param {number} [limit=6]
 * @returns {string[]}
 */
export const suggestSkillNames = (catalog, keyword, limit = 6) => {
    const names = uniqueKeepOrder(
        (Array.isArray(catalog) ? catalog : []).map((n) => String(n || '').trim()).filter(Boolean)
    );
    const q = String(keyword || '').trim();
    if (q.length < 1 || names.length === 0) return [];

    const lower = q.toLowerCase();
    const containsMatches = names.filter((label) => label.toLowerCase().includes(lower));

    const fuse = new Fuse(
        names.map((label) => ({ label })),
        {
            keys: ['label'],
            threshold: 0.45,
            ignoreLocation: true,
            minMatchCharLength: 1,
        }
    );
    const fuzzyMatches = fuse.search(q).map((hit) => hit.item.label);

    return uniqueKeepOrder([...containsMatches, ...fuzzyMatches]).slice(0, limit);
};
