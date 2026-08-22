import Fuse from 'fuse.js';

const uniqueByIdOrCode = (items) => {
    const seen = new Set();
    return items.filter((item) => {
        const key = item.id ?? item.code.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

export const suggestJobTypes = (catalog, keyword, limit = 6) => {
    const items = uniqueByIdOrCode(
        (Array.isArray(catalog) ? catalog : [])
            .map((item) => ({
                id: item?.id ?? null,
                code: String(item?.code || '').trim(),
                name: String(item?.name || '').trim(),
            }))
            .filter((item) => item.code || item.name)
    );
    const query = String(keyword || '').trim();
    if (!query || items.length === 0) return [];

    const lowerQuery = query.toLowerCase();
    const containsMatches = items.filter((item) =>
        `${item.code} ${item.name}`.toLowerCase().includes(lowerQuery)
    );
    const fuzzyMatches = new Fuse(items, {
        keys: ['code', 'name'],
        threshold: 0.45,
        ignoreLocation: true,
        minMatchCharLength: 1,
    })
        .search(query)
        .map((result) => result.item);

    return uniqueByIdOrCode([...containsMatches, ...fuzzyMatches]).slice(0, limit);
};
