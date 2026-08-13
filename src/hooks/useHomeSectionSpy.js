import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Highlight homepage nav tab from scroll position (scroll spy).
 * Active when a section crosses the vertical middle of the viewport;
 * at the top (hero) with no section mid-screen → no highlight.
 * `activateSection` locks spy briefly so smooth scroll-from-click does not flicker.
 */
export const useHomeSectionSpy = (
    sectionIds = [],
    { enabled = true, lockMs = 900 } = {}
) => {
    const [activeSectionId, setActiveSectionId] = useState(null);
    const lockUntilRef = useRef(0);
    const idsKey = Array.isArray(sectionIds) ? sectionIds.filter(Boolean).join('|') : '';

    const syncFromScroll = useCallback(() => {
        if (!enabled) return;
        if (Date.now() < lockUntilRef.current) return;

        const ids = idsKey ? idsKey.split('|') : [];
        if (ids.length === 0) return;

        // Đã chạm đầu trang (không cuộn lên thêm được) → không coi là đang ở section nào.
        if (window.scrollY <= 8) {
            setActiveSectionId((prev) => (prev == null ? prev : null));
            return;
        }

        // Mid-screen probe: chỉ active khi section đang cắt đường giữa viewport.
        const midY = window.innerHeight / 2;
        let current = null;
        let bestDist = Infinity;

        for (const id of ids) {
            const el = document.getElementById(id);
            if (!el) continue;
            const rect = el.getBoundingClientRect();
            if (rect.top > midY || rect.bottom < midY) continue;

            const sectionCenter = (rect.top + rect.bottom) / 2;
            const dist = Math.abs(sectionCenter - midY);
            if (dist < bestDist) {
                bestDist = dist;
                current = id;
            }
        }

        setActiveSectionId((prev) => (prev === current ? prev : current));
    }, [enabled, idsKey]);

    const activateSection = useCallback(
        (sectionId) => {
            setActiveSectionId(sectionId || null);
            lockUntilRef.current = Date.now() + lockMs;
        },
        [lockMs]
    );

    const clearActiveSection = useCallback(() => {
        setActiveSectionId(null);
        // Khóa ngắn: smooth scroll về đầu trang không bị gắn lại section giữa đường.
        lockUntilRef.current = Date.now() + lockMs;
    }, [lockMs]);

    useEffect(() => {
        if (!enabled) {
            setActiveSectionId(null);
            lockUntilRef.current = 0;
            return undefined;
        }

        let ticking = false;
        const onScrollOrResize = () => {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(() => {
                ticking = false;
                syncFromScroll();
            });
        };

        syncFromScroll();
        // Sections may mount after first paint (lazy data) — re-probe briefly.
        const retryTimers = [120, 400, 1000].map((ms) =>
            window.setTimeout(syncFromScroll, ms)
        );

        window.addEventListener('scroll', onScrollOrResize, { passive: true });
        window.addEventListener('resize', onScrollOrResize);
        return () => {
            retryTimers.forEach((id) => window.clearTimeout(id));
            window.removeEventListener('scroll', onScrollOrResize);
            window.removeEventListener('resize', onScrollOrResize);
        };
    }, [enabled, syncFromScroll]);

    return { activeSectionId, activateSection, clearActiveSection };
};
