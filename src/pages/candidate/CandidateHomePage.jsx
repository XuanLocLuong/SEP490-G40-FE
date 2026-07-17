import { useAuth } from '../../contexts/authContext.js';
import JobDiscoveryHome from '../../components/landing/JobDiscoveryHome.jsx';

const CandidateHomePage = () => {
    const { auth } = useAuth();
    const displayName = auth?.fullName?.trim() || 'bạn';

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
