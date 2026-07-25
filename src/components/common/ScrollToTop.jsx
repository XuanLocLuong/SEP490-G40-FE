import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { HOME_SCROLL_STATE_KEY } from '../../utils/homeSections.js';

/**
 * Scroll to top on route change (pathname/search).
 * Skips when navigation asks to land on a homepage section.
 * Does not re-run when only location.state is cleared after that scroll.
 */
const ScrollToTop = () => {
    const location = useLocation();

    useEffect(() => {
        if (location.state?.[HOME_SCROLL_STATE_KEY]) return;
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        // Only react to URL changes — not state cleanup after section scroll.
        // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
    }, [location.pathname, location.search]);

    return null;
};

export default ScrollToTop;
