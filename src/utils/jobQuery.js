import { fetchHomepageJobs, searchJobs, fetchNearbyJobs } from '../apis/JobApi.jsx';

export const LANDING_PREVIEW_SIZE = 8;
export const JOB_LIST_PAGE_SIZE = 10;
/** Jobs loaded per request in /jobs/:id sidebar (append via Load more). BE max size = 50. */
export const JOB_DETAIL_SIDEBAR_PAGE_SIZE = 10;

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
            () => reject(new Error('Không thể lấy vị trí. Vui lòng cho phép truy cập vị trí.')),
            { enableHighAccuracy: false, timeout: 10000 }
        );
    });

/** @typedef {{ keyword?: string, city?: string, ward?: string, nearMe?: boolean, latitude?: number, longitude?: number }} JobQuery */

export const isSearchQuery = (query) =>
    Boolean(query?.nearMe || query?.keyword || query?.city || query?.ward);

export const fetchJobListPage = async (page, size, query) => {
    if (query?.nearMe) {
        const res = await fetchNearbyJobs({
            latitude: query.latitude,
            longitude: query.longitude,
            page,
            size,
        });
        return res.data.data;
    }
    if (query && (query.keyword || query.city || query.ward)) {
        const res = await searchJobs({
            keyword: query.keyword || undefined,
            city: query.city || undefined,
            ward: query.ward || undefined,
            page,
            size,
        });
        return res.data.data;
    }
    const res = await fetchHomepageJobs(page, size);
    return res.data.data;
};

export const buildJobListSearchParams = (query) => {
    const params = new URLSearchParams();
    if (query?.keyword) params.set('keyword', query.keyword);
    if (query?.city) params.set('city', query.city);
    if (query?.ward) params.set('ward', query.ward);
    if (query?.nearMe) params.set('nearMe', '1');
    return params;
};

export const parseJobListSearchParams = (searchParams) => {
    const keyword = searchParams.get('keyword')?.trim() || '';
    const city = searchParams.get('city')?.trim() || '';
    const ward = searchParams.get('ward')?.trim() || '';
    const nearMe = searchParams.get('nearMe') === '1';
    if (!keyword && !city && !ward && !nearMe) return null;
    return { keyword, city, ward, nearMe };
};
