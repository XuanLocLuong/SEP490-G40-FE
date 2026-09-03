const BLACKLIST_WORDS = [
    'châu á',
    'châu âu',
    'đông nam á',
    'việt nam',
    'vietnam',
    'asia',
    'southeast asia',
];

export const isBlacklistedDetail = (value) => {
    const s = String(value || '').trim().toLowerCase();
    if (!s || s.length < 2) return true;
    return BLACKLIST_WORDS.some((word) => s === word || s.includes(word));
};

const fetchWithTimeout = async (url, options = {}, timeoutMs = 4000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);
        return res;
    } catch (err) {
        clearTimeout(timeoutId);
        throw err;
    }
};

/**
 * Multi-Tier Reverse Geocode:
 * Kết hợp dữ liệu hành chính chuẩn Việt Nam (Tỉnh, Quận/Huyện, Phường/Xã từ BigDataCloud)
 * với chi tiết số nhà / tên đường (từ Photon OSM Mirror)
 */
export const reverseGeocodeCoordinates = async (latitude, longitude) => {
    if (latitude == null || longitude == null) {
        throw new Error('Missing coordinates');
    }

    let adminResult = null;
    let streetResult = null;
    const allAdminNames = [];

    // 1. Lấy thông tin hành chính 3 cấp chuẩn VN từ BigDataCloud
    try {
        const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=vi`;
        const res = await fetchWithTimeout(bdcUrl, {}, 3000);
        if (res.ok) {
            const data = await res.json();
            const adminList = data.localityInfo?.administrative || [];

            adminList.forEach((a) => {
                if (a?.name && !isBlacklistedDetail(a.name)) {
                    allAdminNames.push(a.name);
                }
            });

            const provinceName = data.principalSubdivision || '';
            const districtObj = adminList.find(
                (a) =>
                    a.adminLevel === 5 ||
                    a.adminLevel === 6 ||
                    a.adminLevel === 7 ||
                    a.adminLevel === 3 ||
                    /quận|huyện|thị xã|tp/i.test(a.description || '') ||
                    /quận|huyện|thị xã/i.test(a.name || '')
            );
            const districtName = districtObj?.name || data.city || '';

            const wardObj = adminList.find(
                (a) =>
                    a.adminLevel === 8 ||
                    a.adminLevel === 9 ||
                    a.adminLevel === 10 ||
                    a.adminLevel === 4 ||
                    /phường|xã|thị trấn/i.test(a.description || '') ||
                    /phường|xã|thị trấn/i.test(a.name || '')
            );
            const wardName = wardObj?.name || data.locality || '';

            adminResult = {
                province: provinceName,
                district: districtName,
                ward: wardName,
                country: data.countryName || 'Việt Nam',
            };
        }
    } catch {
        // fallback
    }

    // 2. Lấy tên đường, số nhà, POI từ Photon OSM Mirror
    try {
        const photonUrl = `https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}&lang=default`;
        const res = await fetchWithTimeout(photonUrl, {}, 3000);
        if (res.ok) {
            const data = await res.json();
            const props = data.features?.[0]?.properties;
            if (props) {
                const houseNo = props.housenumber || '';
                const street = props.street || '';
                const placeName = props.name || '';

                if (props.district) allAdminNames.push(props.district);
                if (props.city) allAdminNames.push(props.city);
                if (props.state) allAdminNames.push(props.state);

                let road = street;
                if (!road && placeName && !isBlacklistedDetail(placeName)) {
                    road = placeName;
                }

                streetResult = {
                    road: isBlacklistedDetail(road) ? '' : road,
                    house_number: isBlacklistedDetail(houseNo) ? '' : houseNo,
                    district: props.district || props.suburb || props.locality || '',
                    city: props.city || props.state || '',
                };
            }
        }
    } catch {
        // fallback
    }

    // 3. Nếu cả 2 nguồn trên đều không có, thử Nominatim OSM
    if (!adminResult && !streetResult) {
        try {
            const nomUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
            const res = await fetchWithTimeout(nomUrl, { headers: { 'Accept-Language': 'vi' } }, 3000);
            if (res.ok) {
                const data = await res.json();
                if (data?.address) {
                    if (isBlacklistedDetail(data.address.road)) data.address.road = '';
                    if (isBlacklistedDetail(data.address.house_number)) data.address.house_number = '';
                }
                return data;
            }
        } catch {
            // all failed
        }
    }

    if (!adminResult && !streetResult) {
        throw new Error('All reverse geocoding providers failed');
    }

    const province = adminResult?.province || streetResult?.city || '';
    const district = adminResult?.district || streetResult?.district || '';
    const ward = adminResult?.ward || '';
    const road = streetResult?.road || '';
    const houseNumber = streetResult?.house_number || '';

    const detailParts = [houseNumber, road].filter(Boolean).join(' ');
    const displayParts = [
        detailParts,
        ward,
        district,
        province,
        adminResult?.country || 'Việt Nam',
    ].filter(Boolean);

    return {
        address: {
            city: province,
            state: province,
            province: province,
            county: district,
            district: district,
            city_district: district,
            suburb: ward || district,
            ward: ward,
            quarter: ward || district,
            village: ward,
            road: road,
            house_number: houseNumber,
            allAdminNames: Array.from(new Set(allAdminNames)),
        },
        display_name: displayParts.join(', '),
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
