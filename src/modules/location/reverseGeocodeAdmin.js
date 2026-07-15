import { findProvinceByNameFuzzy, findWardByNameFuzzy } from './localLocation.js';

const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse';

const ADMIN_PREFIX =
    /^(thành phố|tỉnh|tp\.?|quận|huyện|thị xã|thị trấn|phường|xã|p\.|q\.)\s+/i;

const normalizeAdminLabel = (value) =>
    (value || '')
        .trim()
        .replace(ADMIN_PREFIX, '')
        .replace(/\s+/g, ' ')
        .toLowerCase();

const collectAddressCandidates = (address = {}) => {
    const provinceCandidates = [
        address.state,
        address.city,
        address.county,
        address.region,
    ].filter(Boolean);

    const wardCandidates = [
        address.suburb,
        address.neighbourhood,
        address.quarter,
        address.village,
        address.town,
        address.city_district,
        address.district,
    ].filter(Boolean);

    return { provinceCandidates, wardCandidates };
};

export const reverseGeocodeCoordinates = async (latitude, longitude) => {
    const res = await fetch(
        `${NOMINATIM_REVERSE}?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
        { headers: { 'Accept-Language': 'vi' } }
    );

    if (!res.ok) {
        throw new Error('Reverse geocode failed');
    }

    return res.json();
};

/**
 * Đổi tọa độ GPS → khớp Tỉnh/TP + Phường/Xã trong dia-chinh-web.json.
 * Chỉ trả admin units; không điền địa chỉ chi tiết.
 */
export const resolveAdminFromCoordinates = async (latitude, longitude) => {
    const data = await reverseGeocodeCoordinates(latitude, longitude);
    const { provinceCandidates, wardCandidates } = collectAddressCandidates(data?.address);

    let province = null;
    for (const candidate of provinceCandidates) {
        province = findProvinceByNameFuzzy(candidate);
        if (province) break;
    }

    let ward = null;
    if (province) {
        for (const candidate of wardCandidates) {
            ward = findWardByNameFuzzy(province.id, candidate);
            if (ward) break;
        }
    }

    return {
        province,
        ward,
        rawAddress: data?.address || null,
    };
};

export const getGeolocationErrorMessage = (code) => {
    switch (code) {
        case 1:
            return 'Bạn đã từ chối quyền truy cập vị trí.';
        case 2:
            return 'Trình duyệt không xác định được vị trí hiện tại.';
        case 3:
            return 'Quá thời gian chờ lấy vị trí.';
        default:
            return 'Không thể lấy vị trí hiện tại.';
    }
};
