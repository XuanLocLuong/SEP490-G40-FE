import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import JobDiscoveryHome from '../../components/landing/JobDiscoveryHome.jsx';
import { useAuth } from '../../contexts/authContext.js';
import { consumeHomeSectionScrollState } from '../../utils/homeSections.js';
import { clearSessionExpiredFlag } from '../../utils/sessionExpiredStorage.js';
import { ROUTES, getHomePathByRole } from '../../routes/path.js';

const LandingPage = () => {
    const { auth } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        // Không để flag “hết hạn” từ lần trước bám khi vào Landing.
        clearSessionExpiredFlag();
    }, []);

    // Đã login mà vào `/` (vd. sau Google / link “Về trang chủ”) → đá về home đúng role.
    useEffect(() => {
        if (!auth?.role) return;
        navigate(getHomePathByRole(auth.role), { replace: true });
    }, [auth?.role, navigate]);

    useEffect(() => {
        if (auth?.role) return;

        if (
            consumeHomeSectionScrollState({
                location,
                navigate,
                homePath: ROUTES.LANDING,
            })
        ) {
            return;
        }
        if (location.hash) {
            navigate(ROUTES.LANDING, { replace: true });
            window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        }
        // location.key: run once per navigation entry
        // eslint-disable-next-line react-hooks/exhaustive-deps -- read state/hash from this entry only
    }, [location.key, navigate, auth?.role]);

    if (auth?.role) {
        return null;
    }

    return <JobDiscoveryHome showWhySection showBookmarkRedirect />;
};

export default LandingPage;
