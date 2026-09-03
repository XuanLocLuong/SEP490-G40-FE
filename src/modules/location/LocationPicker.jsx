import { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './locationPicker.css';
import { useAuth } from '../../contexts/authContext.js';

const DEFAULT_CENTER = { latitude: 21.028511, longitude: 105.804817 };
const DEFAULT_ZOOM = 13;
const SELECTED_ZOOM = 17;
const TARGET_ACCURACY_METERS = 25;
const LOCATION_SCAN_TIMEOUT_MS = 25000;
const FRESH_SAMPLE_TOLERANCE_MS = 2000;
const POSITION_OPTIONS = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

const getGeolocationErrorMessage = (code) => {
    switch (code) {
        case 1: return 'Bạn đã từ chối quyền truy cập vị trí.';
        case 2: return 'Trình duyệt không xác định được vị trí hiện tại.';
        case 3: return 'Quá thời gian chờ lấy vị trí.';
        default: return 'Không thể lấy vị trí hiện tại.';
    }
};

const formatCoordinate = (value) => Number(value).toFixed(6);

const formatDateTime = (value) => {
    if (!value) return '--';
    return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'medium' }).format(value);
};

const createPositionSnapshot = (result, requestStartedAt) => ({
    latitude: result.coords.latitude,
    longitude: result.coords.longitude,
    accuracy: result.coords.accuracy,
    timestamp: result.timestamp,
    source: 'auto',
});

const createManualPosition = ({ latitude, longitude, source }) => ({
    latitude,
    longitude,
    accuracy: null,
    timestamp: Date.now(),
    source,
});

const getSourceLabel = (source) => {
    if (source === 'map') return 'Chọn trên bản đồ';
    if (source === 'address') return 'Từ địa chỉ';
    return 'Tự động (GPS)';
};

const coordsNearlyEqual = (a, b) =>
    a != null &&
    b != null &&
    Math.abs(Number(a.latitude) - Number(b.latitude)) < 1e-7 &&
    Math.abs(Number(a.longitude) - Number(b.longitude)) < 1e-7;

/** Đổi text địa chỉ → tọa độ (Photon + Nominatim fallback). */
const geocodeAddress = async (query) => {
    const trimmed = String(query || '').trim();
    if (!trimmed) return null;

    // Tier 1: Photon by Komoot (OSM Mirror)
    try {
        const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=1`;
        const res = await fetch(photonUrl);
        if (res.ok) {
            const data = await res.json();
            const coords = data.features?.[0]?.geometry?.coordinates;
            if (coords && coords.length >= 2) {
                return createManualPosition({
                    latitude: coords[1],
                    longitude: coords[0],
                    source: 'address',
                });
            }
        }
    } catch {
        // fallback
    }

    // Tier 2: Nominatim (OpenStreetMap)
    try {
        const res = await fetch(
            `${NOMINATIM_URL}?q=${encodeURIComponent(trimmed)}&format=json&limit=1&addressdetails=1`,
            { headers: { 'Accept-Language': 'vi' } }
        );
        if (res.ok) {
            const results = await res.json();
            if (results && results.length > 0) {
                const { lat, lon } = results[0];
                return createManualPosition({
                    latitude: parseFloat(lat),
                    longitude: parseFloat(lon),
                    source: 'address',
                });
            }
        }
    } catch {
        // fallback
    }

    return null;
};

const markerIcon = L.divIcon({
    className: 'location-picker__marker',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
});

/**
 * Bản đồ chọn vị trí.
 *
 * variant="store" (mặc định — dùng cho địa chỉ cơ sở recruiter):
 *   - searchQuery: chuỗi từ AddressForm + buildFullAddress
 *   - initialLocation: { latitude, longitude } khi sửa location cũ
 *   - onLocationChange: trả { latitude, longitude, source }
 *
 * variant="demo": giữ UI GPS demo ban đầu của dev (học/thử nghiệm).
 */
const LocationPicker = ({
    variant = 'store',
    title = 'Xác nhận vị trí cơ sở',
    searchQuery = '',
    initialLocation = null,
    onLocationChange,
}) => {
    const isStoreMode = variant === 'store';
    const auth = useAuth()?.auth;

    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const watchIdRef = useRef(null);
    const scanTimerRef = useRef(null);
    const bestPositionRef = useRef(null);
    const requestStartedAtRef = useRef(null);
    const onLocationChangeRef = useRef(onLocationChange);
    /** Tọa độ đã áp lên map lần gần nhất — tránh setView lại khi parent chỉ đổi identity callback. */
    const appliedMapCoordsRef = useRef(null);

    const [selectedLocation, setSelectedLocation] = useState(() =>
        initialLocation?.latitude != null && initialLocation?.longitude != null
            ? createManualPosition({
                  latitude: Number(initialLocation.latitude),
                  longitude: Number(initialLocation.longitude),
                  source: 'map',
              })
            : null
    );
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState('');
    const [permissionState, setPermissionState] = useState('unknown');
    const [demoAddress, setDemoAddress] = useState('');
    const [geocoding, setGeocoding] = useState(false);

    const isScanning = status === 'loading';
    const viewerName = auth?.fullName || auth?.email || 'Khách';

    useEffect(() => {
        onLocationChangeRef.current = onLocationChange;
    }, [onLocationChange]);

    const selectLocation = useCallback((location) => {
        setSelectedLocation(location);
        onLocationChangeRef.current?.({
            latitude: location.latitude,
            longitude: location.longitude,
            source: location.source,
        });
    }, []);

    const clearLocationScan = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation?.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        if (scanTimerRef.current !== null) {
            window.clearTimeout(scanTimerRef.current);
            scanTimerRef.current = null;
        }
    }, []);

    const finishWithBestPosition = useCallback(
        (fallbackMessage) => {
            clearLocationScan();
            if (bestPositionRef.current) {
                selectLocation(bestPositionRef.current);
                setStatus('success');
                return;
            }
            setStatus('error');
            setError(
                fallbackMessage ||
                    'Chưa nhận được vị trí. Hãy tìm trên bản đồ hoặc click chọn trực tiếp.'
            );
        },
        [clearLocationScan, selectLocation]
    );

    // GPS demo mode — quyền truy cập vị trí trình duyệt
    useEffect(() => {
        if (isStoreMode || !navigator.permissions?.query) return undefined;

        let permissionStatus;
        navigator.permissions
            .query({ name: 'geolocation' })
            .then((s) => {
                permissionStatus = s;
                setPermissionState(s.state);
                s.onchange = () => setPermissionState(s.state);
            })
            .catch(() => setPermissionState('unknown'));

        return () => {
            if (permissionStatus) permissionStatus.onchange = null;
        };
    }, [isStoreMode]);

    useEffect(() => () => clearLocationScan(), [clearLocationScan]);

    // Khởi tạo bản đồ Leaflet — chỉ 1 lần; không phụ thuộc selectLocation để tránh remount → nhảy zoom.
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return undefined;

        const map = L.map(mapContainerRef.current, { zoomControl: true, scrollWheelZoom: true }).setView(
            [DEFAULT_CENTER.latitude, DEFAULT_CENTER.longitude],
            DEFAULT_ZOOM
        );

        L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
            attribution: '&copy; Google Maps',
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
            maxZoom: 20,
        }).addTo(map);

        map.on('click', (event) => {
            const loc = createManualPosition({
                latitude: event.latlng.lat,
                longitude: event.latlng.lng,
                source: 'map',
            });
            selectLocation(loc);
            setError('');
            setStatus('success');
        });

        mapRef.current = map;

        const invalidate = () => map.invalidateSize({ pan: false });
        const t1 = window.setTimeout(invalidate, 50);
        const t2 = window.setTimeout(invalidate, 250);
        requestAnimationFrame(invalidate);

        return () => {
            window.clearTimeout(t1);
            window.clearTimeout(t2);
            map.remove();
            mapRef.current = null;
            markerRef.current = null;
            appliedMapCoordsRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once; selectLocation ổn định qua ref/callback rỗng deps
    }, []);

    // Cập nhật marker khi có tọa độ mới — chỉ setView khi tọa độ thực sự đổi
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        if (!selectedLocation) {
            markerRef.current?.remove();
            markerRef.current = null;
            appliedMapCoordsRef.current = null;
            return;
        }

        const latLng = [selectedLocation.latitude, selectedLocation.longitude];
        const coordsChanged = !coordsNearlyEqual(appliedMapCoordsRef.current, selectedLocation);

        if (!markerRef.current) {
            markerRef.current = L.marker(latLng, { draggable: true, icon: markerIcon }).addTo(map);
            markerRef.current.on('dragend', (event) => {
                const ll = event.target.getLatLng();
                selectLocation(
                    createManualPosition({ latitude: ll.lat, longitude: ll.lng, source: 'map' })
                );
                setError('');
                setStatus('success');
            });
        } else if (coordsChanged) {
            markerRef.current.setLatLng(latLng);
        }

        if (coordsChanged) {
            appliedMapCoordsRef.current = {
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
            };
            map.setView(latLng, Math.max(map.getZoom(), SELECTED_ZOOM), { animate: true });
        }
    }, [selectLocation, selectedLocation]);

    // Đồng bộ từ parent initialLocation — bỏ qua nếu cùng tọa độ (tránh vòng lặp zoom)
    useEffect(() => {
        if (initialLocation?.latitude == null || initialLocation?.longitude == null) return;

        const next = {
            latitude: Number(initialLocation.latitude),
            longitude: Number(initialLocation.longitude),
        };

        setSelectedLocation((prev) => {
            if (coordsNearlyEqual(prev, next)) return prev;
            return createManualPosition({ ...next, source: 'map' });
        });
        setError('');
        // Không gọi onLocationChange lại — parent đã nắm coords này.
    }, [initialLocation?.latitude, initialLocation?.longitude]);

    /** Store mode: geocode từ searchQuery (AddressForm). */
    const handleFindOnMap = async () => {
        const query = searchQuery.trim();
        if (!query) {
            setError('Hãy chọn Tỉnh, Phường/Xã và nhập địa chỉ chi tiết trước.');
            return;
        }

        setGeocoding(true);
        setError('');

        try {
            const loc = await geocodeAddress(query);
            if (!loc) {
                setError('Không tìm thấy vị trí. Thử chỉnh địa chỉ hoặc click trên bản đồ.');
                return;
            }
            selectLocation(loc);
            setStatus('success');
        } catch {
            setError('Lỗi khi tìm địa chỉ trên bản đồ. Hãy thử lại.');
        } finally {
            setGeocoding(false);
        }
    };

    /** Demo mode: geocode từ ô input nội bộ. */
    const handleDemoAddressSearch = async (e) => {
        e.preventDefault();
        const query = demoAddress.trim();
        if (!query) return;

        setGeocoding(true);
        setError('');

        try {
            const loc = await geocodeAddress(query);
            if (!loc) {
                setError('Không tìm thấy địa chỉ. Hãy thử lại với từ khóa khác.');
                return;
            }
            selectLocation(loc);
            setDemoAddress(query);
            setStatus('success');
        } catch {
            setError('Lỗi khi tìm địa chỉ. Hãy thử lại.');
        } finally {
            setGeocoding(false);
        }
    };

    const handleGetCurrentPosition = () => {
        clearLocationScan();
        bestPositionRef.current = null;
        requestStartedAtRef.current = Date.now();
        setSelectedLocation(null);
        setError('');

        if (!window.isSecureContext) {
            setStatus('error');
            setError('Geolocation chỉ hoạt động trên HTTPS hoặc localhost.');
            return;
        }
        if (!navigator.geolocation) {
            setStatus('error');
            setError('Trình duyệt không hỗ trợ Geolocation.');
            return;
        }

        setStatus('loading');
        scanTimerRef.current = window.setTimeout(() => {
            finishWithBestPosition(
                bestPositionRef.current
                    ? undefined
                    : 'Hết thời gian quét. Hãy nhập địa chỉ hoặc chọn trên bản đồ.'
            );
        }, LOCATION_SCAN_TIMEOUT_MS);

        watchIdRef.current = navigator.geolocation.watchPosition(
            (result) => {
                const next = createPositionSnapshot(result, requestStartedAtRef.current || Date.now());
                const currentBest = bestPositionRef.current;
                if (!currentBest || next.accuracy < currentBest.accuracy) {
                    bestPositionRef.current = next;
                    selectLocation(next);
                }
                if (next.accuracy <= TARGET_ACCURACY_METERS) {
                    bestPositionRef.current = next;
                    selectLocation(next);
                    setStatus('success');
                    clearLocationScan();
                }
            },
            (geoError) => {
                if (geoError.code === 1) {
                    setStatus('error');
                    setError(getGeolocationErrorMessage(geoError.code));
                    clearLocationScan();
                    return;
                }
                setError(`${getGeolocationErrorMessage(geoError.code)} Đang tiếp tục thử...`);
            },
            POSITION_OPTIONS
        );
    };

    const handleStopScan = () => {
        finishWithBestPosition('Chưa có mẫu vị trí. Hãy nhập địa chỉ hoặc chọn trên bản đồ.');
    };

    const renderedPermissionState = {
        granted: 'Đã cấp quyền',
        denied: 'Đã từ chối',
        prompt: 'Sẽ hỏi khi bấm nút',
        unknown: 'Chưa kiểm tra',
    }[permissionState];

    return (
        <section
            className={`location-picker${isStoreMode ? ' location-picker--store' : ''}`}
            aria-labelledby={isStoreMode ? undefined : 'location-picker-title'}
            aria-label={isStoreMode ? 'Xác nhận địa chỉ trên bản đồ' : undefined}
        >
            {!isStoreMode && (
                <div className="location-picker__header">
                    <div>
                        <p className="location-picker__eyebrow">Xác nhận vị trí</p>
                        <h2 id="location-picker-title" className="location-picker__title">
                            {title}
                        </h2>
                        <p className="location-picker__subtitle">
                            Đang dùng với <strong>{viewerName}</strong>
                        </p>
                    </div>
                    <span
                        className={`location-picker__permission location-picker__permission--${permissionState}`}
                    >
                        {renderedPermissionState}
                    </span>
                </div>
            )}

            {error && (
                <div className="location-picker__alert" role="alert">
                    {error}
                </div>
            )}

            {isStoreMode ? (
                <>
                    {searchQuery.trim() && (
                        <p className="location-picker__query-preview">
                            <strong>Địa chỉ tìm kiếm:</strong> {searchQuery}
                        </p>
                    )}

                    <div className="location-picker__actions">
                        <button
                            className={
                                isStoreMode
                                    ? 'account-settings__btn account-settings__btn--primary'
                                    : 'location-picker__button'
                            }
                            type="button"
                            onClick={handleFindOnMap}
                            disabled={geocoding || !searchQuery.trim()}
                        >
                            {geocoding ? 'Đang tìm...' : 'Tìm trên bản đồ'}
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <div className="location-picker__actions">
                        <button
                            className="location-picker__button"
                            type="button"
                            onClick={handleGetCurrentPosition}
                            disabled={isScanning}
                        >
                            {isScanning ? 'Đang quét vị trí...' : 'Lấy vị trí tự động'}
                        </button>
                        {isScanning && (
                            <button
                                className="location-picker__button location-picker__button--secondary"
                                type="button"
                                onClick={handleStopScan}
                            >
                                Dùng mẫu tốt nhất
                            </button>
                        )}
                    </div>

                    <form className="location-picker__address-form" onSubmit={handleDemoAddressSearch}>
                        <label className="location-picker__address-label">
                            <span>Địa chỉ</span>
                            <input
                                type="text"
                                placeholder="Nhập địa chỉ đầy đủ..."
                                value={demoAddress}
                                onChange={(e) => setDemoAddress(e.target.value)}
                            />
                        </label>
                        <button
                            className="location-picker__button location-picker__button--secondary"
                            type="submit"
                            disabled={geocoding || !demoAddress.trim()}
                        >
                            {geocoding ? 'Đang tìm...' : 'Tìm địa chỉ'}
                        </button>
                    </form>
                </>
            )}

            <div className="location-picker__map-panel">
                <div ref={mapContainerRef} className="location-picker__map" aria-label="Bản đồ chọn vị trí" />
            </div>

            {selectedLocation && !isStoreMode && (
                <div className="location-picker__result">
                    <div className="location-picker__result-grid">
                        <div className="location-picker__metric">
                            <span>Vĩ độ (Latitude)</span>
                            <strong>{formatCoordinate(selectedLocation.latitude)}</strong>
                        </div>
                        <div className="location-picker__metric">
                            <span>Kinh độ (Longitude)</span>
                            <strong>{formatCoordinate(selectedLocation.longitude)}</strong>
                        </div>
                        {!isStoreMode && (
                            <>
                                <div className="location-picker__metric">
                                    <span>Độ chính xác</span>
                                    <strong>
                                        {typeof selectedLocation.accuracy === 'number'
                                            ? `${Math.round(selectedLocation.accuracy)} m`
                                            : '--'}
                                    </strong>
                                </div>
                                <div className="location-picker__metric">
                                    <span>Thời điểm</span>
                                    <strong>{formatDateTime(selectedLocation.timestamp)}</strong>
                                </div>
                            </>
                        )}
                        <div className="location-picker__metric">
                            <span>Nguồn</span>
                            <strong>{getSourceLabel(selectedLocation.source)}</strong>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default LocationPicker;
