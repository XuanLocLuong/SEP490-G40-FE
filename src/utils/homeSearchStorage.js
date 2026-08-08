import { isSearchQuery } from './jobQuery.js';

const HOME_SEARCH_KEY = 'joblink_home_search_query';

const sanitizeQuery = (query) => {
    if (!query || typeof query !== 'object') return null;
    const next = {
        keyword: query.keyword ? String(query.keyword) : '',
        city: query.city ? String(query.city) : '',
        ward: query.ward ? String(query.ward) : '',
        jobType: query.jobType ? String(query.jobType) : '',
        salaryMin: query.salaryMin ?? null,
        salaryMax: query.salaryMax ?? null,
        skillIds: Array.isArray(query.skillIds) ? query.skillIds.map(Number).filter(Number.isFinite) : [],
        schedules: Array.isArray(query.schedules) ? query.schedules : [],
        nearMe: Boolean(query.nearMe),
        latitude: query.latitude ?? null,
        longitude: query.longitude ?? null,
    };
    return isSearchQuery(next) ? next : null;
};

export const setHomeSearchQuery = (query) => {
    const payload = sanitizeQuery(query);
    try {
        if (!payload) {
            sessionStorage.removeItem(HOME_SEARCH_KEY);
            return;
        }
        sessionStorage.setItem(HOME_SEARCH_KEY, JSON.stringify(payload));
    } catch {
        // ignore quota / private mode
    }
};

export const peekHomeSearchQuery = () => {
    try {
        const raw = sessionStorage.getItem(HOME_SEARCH_KEY);
        if (!raw) return null;
        return sanitizeQuery(JSON.parse(raw));
    } catch {
        return null;
    }
};

export const clearHomeSearchQuery = () => {
    try {
        sessionStorage.removeItem(HOME_SEARCH_KEY);
    } catch {
        // ignore
    }
};
