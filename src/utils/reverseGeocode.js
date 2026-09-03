import { reverseGeocodeCoordinates } from '../modules/location/reverseGeocodeAdmin.js';

/**
 * Reverse geocode lat/lng → địa chỉ hiển thị.
 * Chỉ dùng để view; không thay cột `address` trên BE trừ khi user sửa form địa chỉ cá nhân.
 */
export const reverseGeocodeLatLng = async (latitude, longitude) => {
    if (latitude == null || longitude == null) return '';
    try {
        const data = await reverseGeocodeCoordinates(latitude, longitude);
        return data?.display_name || '';
    } catch {
        return '';
    }
};
