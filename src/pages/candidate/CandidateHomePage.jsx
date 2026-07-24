import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/authContext.js';
import JobDiscoveryHome from '../../components/landing/JobDiscoveryHome.jsx';
import {
    HOME_SCROLL_STATE_KEY,
    scrollToHomeSectionWhenReady,
} from '../../utils/homeSections.js';
import { ROUTES } from '../../routes/path.js';

const CandidateHomePage = () => {
    const { auth } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const displayName = auth?.fullName?.trim() || 'bạn';

    useEffect(() => {
        const sectionId = location.state?.[HOME_SCROLL_STATE_KEY];

        if (sectionId) {
            scrollToHomeSectionWhenReady(sectionId);
            // Clear one-shot state without changing pathname (avoids ScrollToTop re-fire).
            navigate(ROUTES.CANDIDATE_HOME, { replace: true, state: {} });
            return;
        }

        // Strip stale #hash from older builds so reload does not jump down.
        if (location.hash) {
            navigate(ROUTES.CANDIDATE_HOME, { replace: true });
            window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        }
        // location.key: run once per navigation entry
    }, [location.key, navigate]); // eslint-disable-next-line react-hooks/exhaustive-deps -- read state/hash from this entry only

    return (
        <JobDiscoveryHome
            className="landing-page--candidate"
            showWhySection={false}
            showBookmarkRedirect={false}
            heroTitle={`Xin chào, ${displayName}`}
            heroSubtitle=""
            featuredSize={4}
            featuredCompact
            showCandidateSections
        />
    );
};

export default CandidateHomePage;
