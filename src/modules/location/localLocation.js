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
