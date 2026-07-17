import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const PREVIEW_ZOOM = 15;

const markerIcon = L.divIcon({
    className: 'readonly-map-preview__marker',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
});

/**
 * Bản đồ preview chỉ xem — có thể kéo/zoom nhẹ để đọc tên đường như map trong modal.
 * Không đổi tọa độ (marker cố định).
 */
const ReadonlyMapPreview = ({ latitude, longitude, className = '' }) => {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);

    useEffect(() => {
        if (latitude == null || longitude == null) return undefined;
        if (!mapContainerRef.current) return undefined;

        // Remount sạch khi tọa độ đổi lớn (tránh tile lệch sau layout).
        if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
            markerRef.current = null;
        }

        const lat = Number(latitude);
        const lng = Number(longitude);

        const map = L.map(mapContainerRef.current, {
            zoomControl: true,
            scrollWheelZoom: false,
            dragging: true,
            doubleClickZoom: true,
            boxZoom: false,
            keyboard: false,
            attributionControl: true,
        }).setView([lat, lng], PREVIEW_ZOOM);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap',
            maxZoom: 19,
        }).addTo(map);

        markerRef.current = L.marker([lat, lng], {
            icon: markerIcon,
            interactive: false,
            keyboard: false,
        }).addTo(map);

        mapRef.current = map;

        const invalidate = () => {
            map.invalidateSize({ pan: false });
            map.setView([lat, lng], map.getZoom(), { animate: false });
        };

        // Leaflet hay lệch tile nếu gọi quá sớm — invalidate nhiều lần sau layout.
        const t1 = window.setTimeout(invalidate, 0);
        const t2 = window.setTimeout(invalidate, 100);
        const t3 = window.setTimeout(invalidate, 300);
        requestAnimationFrame(invalidate);

        let resizeObserver;
        if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
            resizeObserver = new ResizeObserver(() => invalidate());
            resizeObserver.observe(mapContainerRef.current);
        }

        return () => {
            window.clearTimeout(t1);
            window.clearTimeout(t2);
            window.clearTimeout(t3);
            resizeObserver?.disconnect();
            map.remove();
            mapRef.current = null;
            markerRef.current = null;
        };
    }, [latitude, longitude]);

    if (latitude == null || longitude == null) return null;

    return (
        <div className={`readonly-map-preview ${className}`.trim()}>
            <div
                ref={mapContainerRef}
                className="readonly-map-preview__map"
                aria-label="Bản đồ vị trí đã lưu"
            />
        </div>
    );
};

export default ReadonlyMapPreview;
