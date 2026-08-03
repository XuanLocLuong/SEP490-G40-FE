import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import JobDiscoveryHome from '../../components/landing/JobDiscoveryHome.jsx';
import { consumeHomeSectionScrollState } from '../../utils/homeSections.js';
import { ROUTES } from '../../routes/path.js';

const LandingPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
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
    }, [location.key, navigate]); // eslint-disable-next-line react-hooks/exhaustive-deps -- read state/hash from this entry only

    return <JobDiscoveryHome showWhySection showBookmarkRedirect />;
};

export default LandingPage;
