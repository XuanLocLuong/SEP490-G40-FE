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
    requestStartedAt,
    receivedAt: Date.now(),
    isFresh: result.timestamp >= requestStartedAt - FRESH_SAMPLE_TOLERANCE_MS,
    source: 'auto',
});

const createManualPosition = ({ latitude, longitude, source }) => ({
    latitude,
    longitude,
    accuracy: null,
    timestamp: Date.now(),
    requestStartedAt: Date.now(),
    receivedAt: Date.now(),
    isFresh: true,
    source,
});

const getSourceLabel = (source) => {
    if (source === 'map') return 'Chọn trên bản đồ';
    if (source === 'manual') return 'Nhập thủ công';
    if (source === 'address') return 'Từ địa chỉ';
    return 'Tự động';
};

const markerIcon = L.divIcon({
    className: 'location-picker__marker',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
});

const LocationPicker = ({ title = 'Vị trí hiện tại của người dùng', onLocationChange }) => {
    const auth = useAuth()?.auth;
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const watchIdRef = useRef(null);
    const scanTimerRef = useRef(null);
    const bestPositionRef = useRef(null);
    const requestStartedAtRef = useRef(null);

    const [selectedLocation, setSelectedLocation] = useState(null);
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState('');
    const [permissionState, setPermissionState] = useState('unknown');
    const [address, setAddress] = useState('');
    const [addressSearching, setAddressSearching] = useState(false);
    const [confirmStatus, setConfirmStatus] = useState('idle');
    const viewerName = auth?.username || 'Khách';
    const isScanning = status === 'loading';

    const selectLocation = useCallback((location) => {
        setSelectedLocation(location);
        onLocationChange?.(location);
    }, [onLocationChange]);

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

    const finishWithBestPosition = useCallback((fallbackMessage) => {
        clearLocationScan();
        if (bestPositionRef.current) {
            selectLocation(bestPositionRef.current);
            setStatus('success');
            return;
        }
        setStatus('error');
        setError(fallbackMessage || 'Chưa nhận được mẫu vị trí nào. Bạn có thể nhập địa chỉ hoặc chọn trên bản đồ.');
    }, [clearLocationScan, selectLocation]);

    useEffect(() => {
        if (!navigator.permissions?.query) return undefined;
        let permissionStatus;
        navigator.permissions.query({ name: 'geolocation' }).then((s) => {
            permissionStatus = s;
            setPermissionState(s.state);
            s.onchange = () => setPermissionState(s.state);
        }).catch(() => setPermissionState('unknown'));
        return () => { if (permissionStatus) permissionStatus.onchange = null; };
    }, []);

    useEffect(() => () => clearLocationScan(), [clearLocationScan]);

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return undefined;
        const map = L.map(mapContainerRef.current, { zoomControl: true, scrollWheelZoom: true })
            .setView([DEFAULT_CENTER.latitude, DEFAULT_CENTER.longitude], DEFAULT_ZOOM);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(map);
        map.on('click', (event) => {
            const loc = createManualPosition({ latitude: event.latlng.lat, longitude: event.latlng.lng, source: 'map' });
            selectLocation(loc);
            setError('');
            setStatus('success');
        });
        mapRef.current = map;
        return () => { map.remove(); mapRef.current = null; markerRef.current = null; };
    }, [selectLocation]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        if (!selectedLocation) {
            markerRef.current?.remove();
            markerRef.current = null;
            return;
        }
        const latLng = [selectedLocation.latitude, selectedLocation.longitude];
        if (!markerRef.current) {
            markerRef.current = L.marker(latLng, { draggable: true, icon: markerIcon }).addTo(map);
            markerRef.current.on('dragend', (event) => {
                const ll = event.target.getLatLng();
                selectLocation(createManualPosition({ latitude: ll.lat, longitude: ll.lng, source: 'map' }));
                setError('');
                setStatus('success');
            });
        } else {
            markerRef.current.setLatLng(latLng);
        }
        map.setView(latLng, Math.max(map.getZoom(), SELECTED_ZOOM), { animate: true });
    }, [selectLocation, selectedLocation]);

    const handleGetCurrentPosition = () => {
        clearLocationScan();
        bestPositionRef.current = null;
        requestStartedAtRef.current = Date.now();
        setSelectedLocation(null);
        setError('');

        if (!window.isSecureContext) {
            setStatus('error');
            setError('Geolocation API chỉ hoạt động trên HTTPS hoặc localhost. Hãy nhập địa chỉ hoặc chọn trên bản đồ.');
            return;
        }
        if (!navigator.geolocation) {
            setStatus('error');
            setError('Trình duyệt không hỗ trợ Geolocation. Hãy nhập địa chỉ hoặc chọn trên bản đồ.');
            return;
        }

        setStatus('loading');
        scanTimerRef.current = window.setTimeout(() => {
            finishWithBestPosition(
                bestPositionRef.current
                    ? undefined
                    : 'Hết thời gian quét. Hãy nhập địa chỉ hoặc chọn vị trí trên bản đồ.'
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
                    setError(`${getGeolocationErrorMessage(geoError.code)} Bạn có thể nhập địa chỉ hoặc chọn trên bản đồ.`);
                    clearLocationScan();
                    return;
                }
                setError(`${getGeolocationErrorMessage(geoError.code)} Đang tiếp tục thử...`);
            },
            POSITION_OPTIONS,
        );
    };

    const handleStopScan = () => {
        finishWithBestPosition('Chưa có mẫu vị trí nào. Bạn có thể nhập địa chỉ hoặc chọn trên bản đồ.');
    };

    const handleAddressSearch = async (e) => {
        e.preventDefault();
        const query = address.trim();
        if (!query) return;

        setAddressSearching(true);
        setError('');

        try {
            const res = await fetch(`${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`, {
                headers: { 'Accept-Language': 'vi' },
            });
            const results = await res.json();

            if (!results.length) {
                setError('Không tìm thấy địa chỉ. Hãy thử lại với từ khóa khác.');
                setAddressSearching(false);
                return;
            }

            const { lat, lon, display_name } = results[0];
            const loc = createManualPosition({ latitude: parseFloat(lat), longitude: parseFloat(lon), source: 'address' });
            selectLocation(loc);
            setAddress(display_name || query);
            setStatus('success');
        } catch {
            setError('Lỗi khi tìm địa chỉ. Hãy thử lại.');
        } finally {
            setAddressSearching(false);
        }
    };

    const handleConfirmLocation = async () => {
        if (!selectedLocation) {
            setError('Hãy chọn vị trí trước khi xác nhận.');
            return;
        }

        setConfirmStatus('sending');
        try {
            // TODO: Gọi API BE tại đây
            // await axiosClient.post('/member/location', {
            //     latitude: selectedLocation.latitude,
            //     longitude: selectedLocation.longitude,
            // });
            await new Promise((r) => setTimeout(r, 1000));
            setConfirmStatus('success');
            setError('');
        } catch {
            setConfirmStatus('error');
            setError('Gửi vị trí thất bại. Vui lòng thử lại.');
        }
    };

    const renderedPermissionState = {
        granted: 'Đã cấp quyền',
        denied: 'Đã từ chối',
        prompt: 'Sẽ hỏi khi bấm nút',
        unknown: 'Chưa kiểm tra',
    }[permissionState];

    return (
        <section className="location-picker" aria-labelledby="location-picker-title">
            <div className="location-picker__header">
                <div>
                    <p className="location-picker__eyebrow">Xác nhận vị trí</p>
                    <h1 id="location-picker-title">{title}</h1>
                    <p className="location-picker__subtitle">
                        Đang dùng với <strong>{viewerName}</strong>
                    </p>
                </div>
                <span className={`location-picker__permission location-picker__permission--${permissionState}`}>
                    {renderedPermissionState}
                </span>
            </div>

            {error && (
                <div className="location-picker__alert" role="alert">
                    {error}
                    {status === 'error' && (
                        <span className="location-picker__alert-hint">
                            {' '}Bạn có thể nhập địa chỉ bên dưới hoặc click chọn vị trí trên bản đồ.
                        </span>
                    )}
                </div>
            )}

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

            <form className="location-picker__address-form" onSubmit={handleAddressSearch}>
                <label className="location-picker__address-label">
                    <span>Địa chỉ</span>
                    <input
                        type="text"
                        placeholder="Nhập địa chỉ, VD: Số 72 đường Trần Hưng Đạo, Phường Cửa Nam, Thành Phố Hà Nội."
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                    />
                </label>
                <button
                    className="location-picker__button location-picker__button--secondary"
                    type="submit"
                    disabled={addressSearching || !address.trim()}
                >
                    {addressSearching ? 'Đang tìm...' : 'Tìm địa chỉ'}
                </button>
            </form>

            <div className="location-picker__map-panel">
                <div ref={mapContainerRef} className="location-picker__map" aria-label="Bản đồ chọn vị trí" />
            </div>

            {selectedLocation && (
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
                        <div className="location-picker__metric">
                            <span>Độ chính xác</span>
                            <strong>
                                {typeof selectedLocation.accuracy === 'number'
                                    ? `${Math.round(selectedLocation.accuracy)} m`
                                    : '--'}
                            </strong>
                        </div>
                        <div className="location-picker__metric">
                            <span>Nguồn</span>
                            <strong>{getSourceLabel(selectedLocation.source)}</strong>
                        </div>
                        <div className="location-picker__metric">
                            <span>Thời điểm</span>
                            <strong>{formatDateTime(selectedLocation.timestamp)}</strong>
                        </div>
                    </div>

                    <button
                        className="location-picker__button location-picker__button--confirm"
                        type="button"
                        onClick={handleConfirmLocation}
                        disabled={confirmStatus === 'sending'}
                    >
                        {confirmStatus === 'sending'
                            ? 'Đang gửi...'
                            : confirmStatus === 'success'
                                ? 'Đã xác nhận!'
                                : 'Xác nhận vị trí'}
                    </button>
                </div>
            )}

            <div className="location-picker__hint">
                <strong>Hướng dẫn:</strong>
                <span>
                    {isScanning
                        ? ` Đang quét tối đa ${Math.round(LOCATION_SCAN_TIMEOUT_MS / 1000)} giây, sẽ dừng sớm khi sai số <= ${TARGET_ACCURACY_METERS}m.`
                        : ' Bấm "Lấy vị trí tự động", nhập địa chỉ, hoặc click trực tiếp trên bản đồ để chọn vị trí.'}
                </span>
            </div>
        </section>
    );
};

export default LocationPicker;
