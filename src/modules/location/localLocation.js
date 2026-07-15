import locationData from '../../assets/data/dia-chinh-web.json';

/**
 * Danh sách Tỉnh / Thành phố (capDiaChinh = "T").
 * Dữ liệu tĩnh — không gọi API server.
 */
export const getProvinces = () =>
    locationData
        .filter((item) => item.capDiaChinh === 'T')
        .sort((a, b) => a.ten.localeCompare(b.ten, 'vi'));

/**
 * Danh sách Phường / Xã thuộc một tỉnh (capDiaChinh = "P").
 * @param {string|number} provinceId — id tỉnh trong JSON (vd: "1" = Hà Nội)
 */
export const getWardsByProvince = (provinceId) => {
    if (!provinceId) return [];

    return locationData
        .filter(
            (item) =>
                item.capDiaChinh === 'P' && item.diaChinhChaId === String(provinceId)
        )
        .sort((a, b) => a.ten.localeCompare(b.ten, 'vi'));
};

/** Tìm 1 bản ghi theo id (dùng khi load lại form từ tên đã lưu). */
export const findLocationById = (id) =>
    locationData.find((item) => item.id === String(id)) ?? null;

/** Khớp tên tỉnh/TP đã lưu BE (field city) → id dropdown. */
export const findProvinceByName = (name) => {
    if (!name?.trim()) return null;
    return getProvinces().find((item) => item.ten === name.trim()) ?? null;
};

/** Khớp tên phường/xã đã lưu BE (field district) → id dropdown. */
export const findWardByName = (provinceId, name) => {
    if (!provinceId || !name?.trim()) return null;
    return getWardsByProvince(provinceId).find((item) => item.ten === name.trim()) ?? null;
};

const normalizeVnPlaceName = (value) =>
    String(value || '')
        .normalize('NFC')
        .trim()
        .toLowerCase()
        .replace(/^(thành phố|tp\.?|tỉnh|quận|huyện|thị xã|thị trấn|phường|xã)\s+/i, '')
        .trim();

const namesMatch = (a, b) => {
    const left = normalizeVnPlaceName(a);
    const right = normalizeVnPlaceName(b);
    if (!left || !right) return false;
    return left === right || left.includes(right) || right.includes(left);
};

/**
 * Map kết quả Nominatim reverse → id Tỉnh/Phường trong dia-chinh-web.json.
 * @param {object} address — object address từ Nominatim
 * @param {string} displayName
 */
export const matchProvinceAndWardFromNominatim = (address = {}, displayName = '') => {
    const provinceCandidates = [
        address.city,
        address.state,
        address.province,
        address.county,
        address.town,
        address.municipality,
        address['ISO3166-2-lvl4'],
    ].filter(Boolean);

    const provinces = getProvinces();
    let province =
        provinces.find((item) => provinceCandidates.some((name) => namesMatch(item.ten, name))) ||
        provinces.find((item) => displayName.includes(item.ten)) ||
        null;

    if (!province) {
        return { provinceId: '', wardId: '', cityName: '', wardName: '' };
    }

    const wardCandidates = [
        address.suburb,
        address.neighbourhood,
        address.quarter,
        address.village,
        address.city_district,
        address.borough,
        address.municipality,
        address.town,
    ].filter(Boolean);

    const wards = getWardsByProvince(province.id);
    const ward =
        wards.find((item) => wardCandidates.some((name) => namesMatch(item.ten, name))) ||
        wards.find((item) => displayName.includes(item.ten)) ||
        null;

    return {
        provinceId: province.id,
        wardId: ward?.id || '',
        cityName: province.ten,
        wardName: ward?.ten || '',
    };
};
