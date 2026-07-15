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

/** Khớp tên phường/xã đã lưu BE (field ward) → id dropdown. */
export const findWardByName = (provinceId, name) => {
    if (!provinceId || !name?.trim()) return null;
    return getWardsByProvince(provinceId).find((item) => item.ten === name.trim()) ?? null;
};

const normalizeAdminName = (name) =>
    (name || '')
        .trim()
        .replace(/^(Thành phố|Tỉnh|TP\.?|Quận|Huyện|Thị xã|Thị trấn|Phường|Xã|P\.|Q\.)\s+/i, '')
        .replace(/\s+/g, ' ')
        .toLowerCase();

const namesLooselyMatch = (a, b) => {
    const left = normalizeAdminName(a);
    const right = normalizeAdminName(b);
    if (!left || !right) return false;
    return left === right || left.includes(right) || right.includes(left);
};

/** Khớp mềm tên tỉnh từ Nominatim → id dropdown. */
export const findProvinceByNameFuzzy = (name) => {
    const exact = findProvinceByName(name);
    if (exact) return exact;

    return (
        getProvinces().find((item) => namesLooselyMatch(item.ten, name)) ?? null
    );
};

/** Khớp mềm tên phường/xã từ Nominatim → id dropdown. */
export const findWardByNameFuzzy = (provinceId, name) => {
    const exact = findWardByName(provinceId, name);
    if (exact) return exact;

    return (
        getWardsByProvince(provinceId).find((item) => namesLooselyMatch(item.ten, name)) ??
        null
    );
};
