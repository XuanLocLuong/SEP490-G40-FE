/**
 * Gộp các phần địa chỉ thành 1 chuỗi để geocode (Nominatim / OpenStreetMap).
 * Thứ tự: chi tiết → phường/xã → tỉnh/thành → Vietnam
 */
export const buildFullAddress = ({ detailAddress, wardName, provinceName }) => {
    const parts = [detailAddress, wardName, provinceName, 'Vietnam'].filter(
        (part) => part?.trim()
    );

    return parts.join(', ');
};
