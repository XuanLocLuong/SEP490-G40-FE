import { useEffect, useState } from 'react';

/**
 * Ẩn header khi cuộn xuống, hiện lại khi cuộn lên (kể cả chưa về đầu trang).
 * Ở gần đầu trang luôn hiện.
 */
export const useAutoHideHeader = ({ delta = 8, topReveal = 24 } = {}) => {
    const [hidden, setHidden] = useState(false);

    useEffect(() => {
        let lastY = window.scrollY;
        let ticking = false;

        const update = () => {
            const y = window.scrollY;
            const diff = y - lastY;

            if (y <= topReveal) {
                setHidden(false);
            } else if (diff > delta) {
                setHidden(true);
            } else if (diff < -delta) {
                setHidden(false);
            }

            lastY = y;
            ticking = false;
        };

        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(update);
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [delta, topReveal]);

    return hidden;
};
