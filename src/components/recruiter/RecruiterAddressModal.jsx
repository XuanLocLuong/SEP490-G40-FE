import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { MapPinIcon } from '../common/icons.jsx';
import {
    AddressForm,
    LocationPicker,
    buildFullAddress,
    matchProvinceAndWardFromNominatim,
} from '../../modules/location/index.js';
import {
    reverseGeocodeCoordinates,
    getGeolocationErrorMessage,
} from '../../modules/location/reverseGeocodeAdmin.js';
import '../../assets/styles/RecruiterAddressModal.css';

const NOMINATIM_SEARCH = 'https://nominatim.openstreetmap.org/search';

const emptyAddress = () => ({
    provinceId: '',
    wardId: '',
    detailAddress: '',
    provinceName: '',
    wardName: '',
});

const extractDetailFromNominatim = (address = {}) => {
    const parts = [
        address.house_number,
        address.road || address.street || address.pedestrian,
    ].filter(Boolean);
    return parts.join(' ').trim();
};

const normalizeLoosePlaceName = (value) =>
    String(value || '')
        .normalize('NFC')
        .trim()
        .toLowerCase()
        .replace(/^(thành phố|tp\.?|tỉnh|quận|huyện|thị xã|thị trấn|phường|xã)\s+/i, '')
        .trim();

const extractDetailFromDisplayName = (displayName, wardName, provinceName) => {
    const parts = String(displayName || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    if (!parts.length) return '';

    const adminNames = [wardName, provinceName]
        .map(normalizeLoosePlaceName)
        .filter(Boolean);

    const isAdminOrTail = (part) => {
        const p = normalizeLoosePlaceName(part);
        if (!p) return true;
        if (/^(việt nam|vietnam)$/i.test(part.trim())) return true;
        if (/^\d{4,6}$/.test(part.trim())) return true;
        if (/^(phường|xã|quận|huyện|thị xã|thị trấn|thành phố|tỉnh|tp\.?)\s+/i.test(part.trim()))
            return true;
        return adminNames.some((n) => p === n || p.includes(n) || n.includes(p));
    };

    const stop = parts.findIndex(isAdminOrTail);
    const detailParts = stop === -1 ? parts.slice(0, 2) : parts.slice(0, stop);
    return detailParts.join(', ').trim();
};

const geocodeAddressQuery = async (query) => {
    const res = await fetch(
        `${NOMINATIM_SEARCH}?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`,
        { headers: { 'Accept-Language': 'vi' } }
    );
    if (!res.ok) throw new Error('Geocode request failed');
    const results = await res.json();
    if (!results.length) return null;
    return {
        latitude: parseFloat(results[0].lat),
        longitude: parseFloat(results[0].lon),
        source: 'address',
    };
};

/**
 * Modal cập nhật địa chỉ trụ sở.
 * Draft sống trong modal; chỉ commit ra ngoài khi bấm "Xác nhận"
 * (bắt buộc đủ 3 ô + lat/lng) → tránh lệch chữ vs tọa độ trên form chính.
 */
const RecruiterAddressModal = ({
    open,
    initialAddress = null,
    initialCoords = null,
    onClose,
    onConfirm,
}) => {
    const reverseGeocodeTimerRef = useRef(null);
    const lastCoordsRef = useRef(null);

    const [addressInitial, setAddressInitial] = useState(emptyAddress);
    const [addressFormKey, setAddressFormKey] = useState('modal-new');
    const [locationPickerKey, setLocationPickerKey] = useState('modal-map');
    const [addressData, setAddressData] = useState(emptyAddress);
    const [coords, setCoords] = useState(null);
    // Tỉnh/Phường gắn với ghim hiện tại. Đổi 2 cấp này mới bắt định vị lại;
    // chỉ sửa số nhà / địa chỉ chi tiết thì vẫn Xác nhận được.
    const [locatedAdmin, setLocatedAdmin] = useState({ provinceId: '', wardId: '' });
    const [gpsLoading, setGpsLoading] = useState(false);
    const [mapSearchLoading, setMapSearchLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    const searchQuery = useMemo(
        () =>
            buildFullAddress({
                detailAddress: addressData.detailAddress,
                wardName: addressData.wardName,
                provinceName: addressData.provinceName,
            }),
        [addressData.detailAddress, addressData.wardName, addressData.provinceName]
    );

    // Mỗi lần mở modal: nạp draft từ giá trị đã commit ngoài page.
    useEffect(() => {
        if (!open) return;

        const next = { ...emptyAddress(), ...(initialAddress || {}) };
        setAddressInitial(next);
        setAddressData(next);
        setAddressFormKey(`modal-${Date.now()}`);
        setStatusMessage('');

        if (initialCoords?.latitude != null && initialCoords?.longitude != null) {
            const saved = {
                latitude: Number(initialCoords.latitude),
                longitude: Number(initialCoords.longitude),
            };
            lastCoordsRef.current = saved;
            setCoords(saved);
            setLocatedAdmin({
                provinceId: next.provinceId || '',
                wardId: next.wardId || '',
            });
            setLocationPickerKey(`modal-map-${saved.latitude}-${saved.longitude}`);
        } else {
            lastCoordsRef.current = null;
            setCoords(null);
            setLocatedAdmin({ provinceId: '', wardId: '' });
            setLocationPickerKey(`modal-map-${Date.now()}`);
        }
        // Chỉ init khi mở modal — tránh reset draft khi parent re-render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    useEffect(
        () => () => {
            if (reverseGeocodeTimerRef.current) {
                clearTimeout(reverseGeocodeTimerRef.current);
            }
        },
        []
    );

    const fillAddressFromCoordinates = useCallback(async (latitude, longitude) => {
        try {
            const data = await reverseGeocodeCoordinates(latitude, longitude);
            const matched = matchProvinceAndWardFromNominatim(
                data?.address,
                data?.display_name || ''
            );
            const detailAddress =
                extractDetailFromNominatim(data?.address) ||
                extractDetailFromDisplayName(
                    data?.display_name,
                    matched.wardName,
                    matched.cityName
                );

            const next = {
                provinceId: matched.provinceId || '',
                wardId: matched.wardId || '',
                provinceName: matched.cityName || '',
                wardName: matched.wardName || '',
                detailAddress,
            };

            setAddressInitial(next);
            setAddressData(next);
            setAddressFormKey(`geo-${Date.now()}`);
            setLocatedAdmin({
                provinceId: next.provinceId || '',
                wardId: next.wardId || '',
            });

            if (!matched.provinceId) {
                toast.warning('Không khớp Tỉnh/Phường trong danh mục. Vui lòng chọn thủ công.');
                setStatusMessage('Vui lòng chọn Tỉnh/Phường thủ công.');
            } else if (!detailAddress) {
                setStatusMessage('Vui lòng nhập địa chỉ chi tiết (số nhà, tên đường).');
            } else {
                setStatusMessage('Đã lấy vị trí. Có thể sửa số nhà rồi bấm Xác nhận.');
            }
        } catch {
            toast.error('Không thể xác định địa chỉ từ vị trí trên bản đồ.');
        }
    }, []);

    const handleAddressChange = useCallback(
        (data) => {
            const adminMoved =
                data.provinceId !== addressData.provinceId ||
                data.wardId !== addressData.wardId;

            // AddressForm đã clear detail khi đổi Tỉnh/Phường — đồng bộ draft.
            setAddressData(data);

            if (adminMoved) {
                // Đổi hành chính → ghim cũ không còn tin cậy cho chỗ mới.
                if (coords) {
                    setStatusMessage(
                        'Đã đổi Tỉnh/Phường — địa chỉ chi tiết đã xóa. Hãy nhập lại và tìm trên bản đồ hoặc chọn ghim.'
                    );
                } else {
                    setStatusMessage('Đã đổi Tỉnh/Phường. Nhập địa chỉ chi tiết rồi tìm trên bản đồ.');
                }
                return;
            }

            if (!coords) {
                setStatusMessage('');
                return;
            }

            const pinAdminMoved =
                (locatedAdmin.provinceId && data.provinceId !== locatedAdmin.provinceId) ||
                (locatedAdmin.wardId && data.wardId !== locatedAdmin.wardId);

            if (pinAdminMoved) {
                setStatusMessage(
                    'Đã đổi Tỉnh/Phường. Hãy tìm trên bản đồ hoặc chọn lại ghim trước khi xác nhận.'
                );
            } else if (data.detailAddress?.trim()) {
                setStatusMessage(
                    'Có thể sửa số nhà. Vị trí bản đồ giữ nguyên — bấm Xác nhận nếu đúng.'
                );
            } else {
                setStatusMessage('');
            }
        },
        [
            addressData.provinceId,
            addressData.wardId,
            coords,
            locatedAdmin.provinceId,
            locatedAdmin.wardId,
        ]
    );

    const handleCoordsChange = useCallback(
        (loc) => {
            if (loc?.latitude == null || loc?.longitude == null) return;

            const last = lastCoordsRef.current;
            const unchanged =
                last &&
                Math.abs(last.latitude - loc.latitude) < 1e-7 &&
                Math.abs(last.longitude - loc.longitude) < 1e-7;

            lastCoordsRef.current = { latitude: loc.latitude, longitude: loc.longitude };
            setCoords({ latitude: loc.latitude, longitude: loc.longitude });

            if (unchanged) return;

            if (loc.source === 'address') {
                setLocatedAdmin({
                    provinceId: addressData.provinceId || '',
                    wardId: addressData.wardId || '',
                });
                setStatusMessage('Đã tìm thấy vị trí. Có thể sửa số nhà rồi bấm Xác nhận.');
                return;
            }

            if (reverseGeocodeTimerRef.current) {
                clearTimeout(reverseGeocodeTimerRef.current);
            }

            reverseGeocodeTimerRef.current = setTimeout(() => {
                fillAddressFromCoordinates(loc.latitude, loc.longitude);
            }, 600);
        },
        [addressData.provinceId, addressData.wardId, fillAddressFromCoordinates]
    );

    const handleFindAddressOnMap = async () => {
        if (!addressData.provinceId || !addressData.wardId || !addressData.detailAddress?.trim()) {
            toast.error('Vui lòng chọn Tỉnh, Phường/Xã và nhập địa chỉ chi tiết trước.');
            return;
        }

        const query = searchQuery.trim();
        if (!query) return;

        setMapSearchLoading(true);
        try {
            const loc = await geocodeAddressQuery(query);
            if (!loc) {
                toast.error('Không tìm thấy vị trí. Thử chỉnh địa chỉ hoặc click trên bản đồ.');
                return;
            }
            handleCoordsChange(loc);
        } catch {
            toast.error('Không tìm được vị trí. Thử lại hoặc chọn trên bản đồ.');
        } finally {
            setMapSearchLoading(false);
        }
    };

    const handleGetCurrentLocation = () => {
        if (!window.isSecureContext) {
            toast.error('Geolocation chỉ hoạt động trên HTTPS hoặc localhost.');
            return;
        }
        if (!navigator.geolocation) {
            toast.error('Trình duyệt không hỗ trợ Geolocation.');
            return;
        }

        setGpsLoading(true);
        setStatusMessage('');

        navigator.geolocation.getCurrentPosition(
            async (result) => {
                const latitude = result.coords.latitude;
                const longitude = result.coords.longitude;
                lastCoordsRef.current = { latitude, longitude };
                setCoords({ latitude, longitude });

                try {
                    await fillAddressFromCoordinates(latitude, longitude);
                    setLocationPickerKey(`modal-gps-${Date.now()}`);
                } finally {
                    setGpsLoading(false);
                }
            },
            (geoError) => {
                toast.error(getGeolocationErrorMessage(geoError.code));
                setGpsLoading(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    const addressReady =
        addressData.provinceId &&
        addressData.wardId &&
        addressData.detailAddress?.trim() &&
        coords?.latitude != null &&
        coords?.longitude != null;

    // Chỉ bắt định vị lại khi đổi Tỉnh/Phường so với lúc gắn ghim.
    // Sửa số nhà / địa chỉ chi tiết vẫn Xác nhận được với ghim hiện tại.
    const adminChanged =
        coords != null &&
        ((locatedAdmin.provinceId && addressData.provinceId !== locatedAdmin.provinceId) ||
            (locatedAdmin.wardId && addressData.wardId !== locatedAdmin.wardId));

    const canConfirm = addressReady && !adminChanged;

    const statusText = (() => {
        if (statusMessage) return statusMessage;
        if (!coords) {
            return 'Lấy vị trí hiện tại, tìm trên bản đồ, hoặc chọn ghim trên bản đồ.';
        }
        if (adminChanged) {
            return 'Đã đổi Tỉnh/Phường. Hãy tìm trên bản đồ hoặc chọn lại ghim trước khi xác nhận.';
        }
        return 'Đã có vị trí. Có thể sửa số nhà rồi bấm Xác nhận.';
    })();

    const handleConfirm = () => {
        if (!canConfirm) {
            if (adminChanged) {
                toast.error(
                    'Đã đổi Tỉnh/Phường. Vui lòng tìm lại trên bản đồ hoặc chọn lại ghim.'
                );
            } else {
                toast.error('Vui lòng nhập đủ địa chỉ và chọn vị trí trên bản đồ.');
            }
            return;
        }

        onConfirm?.({
            address: {
                provinceId: addressData.provinceId,
                wardId: addressData.wardId,
                detailAddress: addressData.detailAddress.trim(),
                provinceName: addressData.provinceName,
                wardName: addressData.wardName,
            },
            coords: {
                latitude: coords.latitude,
                longitude: coords.longitude,
            },
            displayName: buildFullAddress({
                detailAddress: addressData.detailAddress.trim(),
                wardName: addressData.wardName,
                provinceName: addressData.provinceName,
            }),
        });
    };

    if (!open) return null;

    return (
        <div
            className="recruiter-address-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="recruiter-address-modal-title"
        >
            <button
                type="button"
                className="recruiter-address-modal__backdrop"
                aria-label="Đóng"
                onClick={onClose}
            />

            <div className="recruiter-address-modal__panel">
                <div className="recruiter-address-modal__header">
                    <h2 id="recruiter-address-modal-title">Cập nhật địa chỉ trụ sở</h2>
                    <button
                        type="button"
                        className="recruiter-address-modal__close"
                        onClick={onClose}
                        aria-label="Đóng"
                    >
                        ×
                    </button>
                </div>

                <div className="recruiter-address-modal__body">
                    <div className="recruiter-address-modal__toolbar">
                        <button
                            type="button"
                            className="recruiter-address-modal__gps-btn"
                            onClick={handleGetCurrentLocation}
                            disabled={gpsLoading}
                        >
                            <MapPinIcon width={14} height={14} />
                            {gpsLoading ? 'Đang lấy vị trí...' : 'Lấy vị trí hiện tại'}
                        </button>
                    </div>

                    <AddressForm
                        key={addressFormKey}
                        initialValues={addressInitial}
                        onChange={handleAddressChange}
                        detailAction={
                            <button
                                type="button"
                                className="recruiter-address-modal__find-btn"
                                onClick={handleFindAddressOnMap}
                                disabled={
                                    mapSearchLoading ||
                                    !addressData.provinceId ||
                                    !addressData.wardId ||
                                    !addressData.detailAddress?.trim()
                                }
                            >
                                {mapSearchLoading ? 'Đang tìm...' : 'Tìm trên bản đồ'}
                            </button>
                        }
                    />

                    <div className="recruiter-address-modal__map">
                        <LocationPicker
                            key={locationPickerKey}
                            searchQuery={searchQuery}
                            initialLocation={coords}
                            onLocationChange={handleCoordsChange}
                        />
                    </div>

                    <p
                        className={`recruiter-address-modal__status${
                            canConfirm
                                ? ' recruiter-address-modal__status--ok'
                                : ' recruiter-address-modal__status--warn'
                        }`}
                        role="status"
                    >
                        {statusText}
                    </p>
                </div>

                <div className="recruiter-address-modal__footer">
                    <button
                        type="button"
                        className="recruiter-address-modal__btn recruiter-address-modal__btn--ghost"
                        onClick={onClose}
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        className="recruiter-address-modal__btn recruiter-address-modal__btn--primary"
                        disabled={!canConfirm}
                        onClick={handleConfirm}
                    >
                        Xác nhận
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecruiterAddressModal;
