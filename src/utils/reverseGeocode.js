/**
 * Reverse geocode lat/lng → địa chỉ hiển thị (Nominatim).
 * Chỉ dùng để view; không thay cột `address` trên BE trừ khi user sửa form địa chỉ cá nhân.
 */
export const reverseGeocodeLatLng = async (latitude, longitude) => {
    if (latitude == null || longitude == null) return '';
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            {
                headers: {
                    'Accept-Language': 'vi',
                },
            }
        );
        const data = await res.json();
        return data?.display_name || '';
    } catch (err) {
        console.error('Reverse geocode failed:', err);
        return '';
    }
};
