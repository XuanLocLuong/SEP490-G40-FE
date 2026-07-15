import { fetchHomepageJobs, searchJobs, fetchNearbyJobs } from '../apis/JobApi.jsx';

export const LANDING_PREVIEW_SIZE = 8;
export const JOB_LIST_PAGE_SIZE = 10;
/** Jobs loaded per request in /jobs/:id sidebar (append via Load more). BE max size = 50. */
export const JOB_DETAIL_SIDEBAR_PAGE_SIZE = 10;

/** Khớp seed BE `MAX_SEARCH_RADIUS_KM` — job ngoài bán kính near-me có distanceKm = null. */
export const MAX_NEAR_ME_RADIUS_KM = 10;

/**
 * Label khoảng cách cho UI near-me.
 * @returns {{ label: string, variant: 'nearby' | 'outside' } | null}
 */
export const getJobDistanceDisplay = (distanceKm, nearMe = false) => {
    if (distanceKm != null && Number.isFinite(Number(distanceKm))) {
        return {
            label: `Cách ${Number(distanceKm).toFixed(1)} km`,
            variant: 'nearby',
        };
    }
    if (nearMe) {
        return {
            label: `> ${MAX_NEAR_ME_RADIUS_KM} km`,
            variant: 'outside',
        };
    }
    return null;
};

/** BE schedule dayOfWeek: 2=Mon … 8=Sun */
export const SCHEDULE_DAY_OPTIONS = [
    { value: '2', label: 'T2' },
    { value: '3', label: 'T3' },
    { value: '4', label: 'T4' },
    { value: '5', label: 'T5' },
    { value: '6', label: 'T6' },
    { value: '7', label: 'T7' },
    { value: '8', label: 'CN' },
];

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';

export const getCurrentPosition = () =>
    new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Trình duyệt không hỗ trợ định vị.'));
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) =>
                resolve({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                }),
            (err) => {
                if (err?.code === 1) {
                    reject(new Error('Bạn đã từ chối quyền truy cập vị trí. Hãy nhập địa chỉ thủ công.'));
                    return;
                }
                reject(new Error('Không thể lấy vị trí. Vui lòng cho phép truy cập vị trí hoặc nhập địa chỉ.'));
            },
            { enableHighAccuracy: false, timeout: 10000 }
        );
    });

/** Geocode text địa chỉ → lat/lng (Nominatim / OpenStreetMap). */
export const geocodeAddress = async (query) => {
    const trimmed = String(query || '').trim();
    if (!trimmed) {
        throw new Error('Vui lòng nhập địa chỉ để tìm việc gần bạn.');
    }

    const res = await fetch(
        `${NOMINATIM_URL}?q=${encodeURIComponent(trimmed)}&format=json&limit=1&countrycodes=vn`,
        { headers: { 'Accept-Language': 'vi' } }
    );

    if (!res.ok) {
        throw new Error('Không thể tra cứu địa chỉ. Vui lòng thử lại.');
    }

    const results = await res.json();
    if (!Array.isArray(results) || results.length === 0) {
        throw new Error('Không tìm thấy địa chỉ. Hãy thử mô tả cụ thể hơn.');
    }

    return {
        latitude: Number.parseFloat(results[0].lat),
        longitude: Number.parseFloat(results[0].lon),
        displayName: results[0].display_name || trimmed,
    };
};

/** Reverse geocode lat/lng → địa chỉ + object address Nominatim. */
export const reverseGeocodeCoords = async (latitude, longitude) => {
    const res = await fetch(
        `${NOMINATIM_REVERSE_URL}?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
        { headers: { 'Accept-Language': 'vi' } }
    );

    if (!res.ok) {
        throw new Error('Không thể lấy địa chỉ từ vị trí hiện tại.');
    }

    const data = await res.json();
    const displayName = data?.display_name?.trim() || '';
    if (!displayName) {
        throw new Error('Không tìm thấy địa chỉ quanh vị trí hiện tại.');
    }
    return {
        displayName,
        address: data.address || {},
    };
};

/**
 * @typedef {{
 *   keyword?: string,
 *   city?: string,
 *   ward?: string,
 *   nearMe?: boolean,
 *   latitude?: number,
 *   longitude?: number,
 *   jobType?: string,
 *   salaryMin?: number|null,
 *   salaryMax?: number|null,
 *   skillIds?: number[],
 *   schedules?: Array<{ dayOfWeek: string, startTime: string, endTime: string }>,
 * }} JobQuery
 */

const toNumberOrNull = (value) => {
    if (value === '' || value == null) return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
};

const normalizeSkillIds = (skillIds) =>
    (Array.isArray(skillIds) ? skillIds : [])
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0);

const normalizeTime = (value) => {
    if (!value) return '';
    const trimmed = String(value).trim();
    if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) return trimmed;
    if (/^\d{2}:\d{2}$/.test(trimmed)) return `${trimmed}:00`;
    return '';
};

export const normalizeSchedules = (schedules) => {
    if (!Array.isArray(schedules)) return [];
    return schedules
        .map((item) => ({
            dayOfWeek: String(item?.dayOfWeek || '').trim(),
            startTime: normalizeTime(item?.startTime),
            endTime: normalizeTime(item?.endTime),
        }))
        .filter(
            (item) =>
                item.dayOfWeek &&
                item.startTime &&
                item.endTime &&
                item.startTime < item.endTime
        );
};

export const hasAdvancedFilters = (query) => {
    if (!query) return false;
    return Boolean(
        query.jobType ||
            query.salaryMin != null ||
            query.salaryMax != null ||
            (query.skillIds && query.skillIds.length > 0) ||
            (query.schedules && query.schedules.length > 0)
    );
};

export const hasNearMeCoords = (query) =>
    query?.nearMe &&
    query.latitude != null &&
    query.longitude != null &&
    Number.isFinite(Number(query.latitude)) &&
    Number.isFinite(Number(query.longitude));

/** True when any search/filter is active (not plain homepage feed). */
export const isSearchQuery = (query) =>
    Boolean(
        hasNearMeCoords(query) ||
            query?.keyword ||
            query?.city ||
            query?.ward ||
            hasAdvancedFilters(query)
    );

/** Bỏ schedules nếu không phải candidate (filter lịch chỉ dành cho candidate). */
export const applyCandidateScheduleAccess = (query, isCandidate) => {
    if (!query || isCandidate || !query.schedules?.length) return query;
    const next = { ...query, schedules: [] };
    return isSearchQuery(next) ? next : null;
};

const buildSearchBody = (page, size, query) => {
    const body = {
        page,
        size,
    };

    if (query?.keyword) body.keyword = query.keyword;
    if (query?.city) body.city = query.city;
    if (query?.ward) body.ward = query.ward;
    if (query?.jobType) body.jobType = query.jobType;

    const salaryMin = toNumberOrNull(query?.salaryMin);
    const salaryMax = toNumberOrNull(query?.salaryMax);
    if (salaryMin != null) body.salaryMin = salaryMin;
    if (salaryMax != null) body.salaryMax = salaryMax;

    const skillIds = normalizeSkillIds(query?.skillIds);
    if (skillIds.length > 0) body.skillIds = skillIds;

    const schedules = normalizeSchedules(query?.schedules);
    if (schedules.length > 0) body.schedules = schedules;

    return body;
};

export const fetchJobListPage = async (page, size, query) => {
    if (hasNearMeCoords(query)) {
        const skillIds = normalizeSkillIds(query.skillIds);
        const schedules = normalizeSchedules(query.schedules);
        const body = {
            latitude: Number(query.latitude),
            longitude: Number(query.longitude),
            page,
            size,
        };
        if (query.jobType) body.jobType = query.jobType;
        const salaryMin = toNumberOrNull(query.salaryMin);
        const salaryMax = toNumberOrNull(query.salaryMax);
        if (salaryMin != null) body.salaryMin = salaryMin;
        if (salaryMax != null) body.salaryMax = salaryMax;
        if (skillIds.length > 0) body.skillIds = skillIds;
        if (schedules.length > 0) body.schedules = schedules;

        const res = await fetchNearbyJobs(body);
        return res.data.data;
    }
    if (isSearchQuery(query)) {
        const res = await searchJobs(buildSearchBody(page, size, query));
        return res.data.data;
    }
    const res = await fetchHomepageJobs(page, size);
    return res.data.data;
};

const encodeSchedules = (schedules) =>
    normalizeSchedules(schedules)
        .map((item) => `${item.dayOfWeek}_${item.startTime}_${item.endTime}`)
        .join(',');

const decodeSchedules = (raw) => {
    if (!raw) return [];
    return normalizeSchedules(
        raw.split(',').map((chunk) => {
            const [dayOfWeek, startTime, endTime] = chunk.split('_');
            return { dayOfWeek, startTime, endTime };
        })
    );
};

export const buildJobListSearchParams = (query) => {
    const params = new URLSearchParams();
    if (query?.nearMe && hasNearMeCoords(query)) {
        params.set('nearMe', '1');
        params.set('lat', String(query.latitude));
        params.set('lng', String(query.longitude));
    }
    if (query?.keyword) params.set('keyword', query.keyword);
    if (query?.city) params.set('city', query.city);
    if (query?.ward) params.set('ward', query.ward);

    if (query?.jobType) params.set('jobType', query.jobType);

    const salaryMin = toNumberOrNull(query?.salaryMin);
    const salaryMax = toNumberOrNull(query?.salaryMax);
    if (salaryMin != null) params.set('salaryMin', String(salaryMin));
    if (salaryMax != null) params.set('salaryMax', String(salaryMax));

    const skillIds = normalizeSkillIds(query?.skillIds);
    if (skillIds.length > 0) params.set('skillIds', skillIds.join(','));

    const schedulesEncoded = encodeSchedules(query?.schedules);
    if (schedulesEncoded) params.set('schedules', schedulesEncoded);

    return params;
};

export const parseJobListSearchParams = (searchParams) => {
    const nearMe = searchParams.get('nearMe') === '1';
    const latitude = toNumberOrNull(searchParams.get('lat'));
    const longitude = toNumberOrNull(searchParams.get('lng'));
    const keyword = searchParams.get('keyword')?.trim() || '';
    const city = searchParams.get('city')?.trim() || '';
    const ward = searchParams.get('ward')?.trim() || '';
    const jobType = searchParams.get('jobType')?.trim() || '';
    const salaryMin = toNumberOrNull(searchParams.get('salaryMin'));
    const salaryMax = toNumberOrNull(searchParams.get('salaryMax'));
    const skillIds = normalizeSkillIds(
        (searchParams.get('skillIds') || '')
            .split(',')
            .map((part) => part.trim())
            .filter(Boolean)
    );
    const schedules = decodeSchedules(searchParams.get('schedules') || '');

    const query = {
        keyword,
        city,
        ward,
        nearMe: nearMe && latitude != null && longitude != null,
        latitude: nearMe && latitude != null ? latitude : undefined,
        longitude: nearMe && longitude != null ? longitude : undefined,
        jobType: jobType || undefined,
        salaryMin,
        salaryMax,
        skillIds,
        schedules,
    };

    return isSearchQuery(query) ? query : null;
};
