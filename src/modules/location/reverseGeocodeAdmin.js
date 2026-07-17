const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse';

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
