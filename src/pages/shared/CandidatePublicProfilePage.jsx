import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useCandidatePublicProfile } from '../../hooks/useCandidatePublicProfile.js';
import { CANDIDATE_PROFILE_TABS } from '../../utils/candidatePublicProfileConstants.js';
import CandidateProfileHeader from '../../components/candidate/public/CandidateProfileHeader.jsx';
import CandidateProfileTabs from '../../components/candidate/public/CandidateProfileTabs.jsx';
import CandidateNotFound from '../../components/candidate/public/CandidateNotFound.jsx';
import CandidateProfileSkeleton from '../../components/candidate/public/CandidateProfileSkeleton.jsx';
import '../../assets/styles/CandidatePublicProfile.css';

const CandidatePublicProfilePage = () => {
    const { candidateId } = useParams();
    const location = useLocation();
    const { profile, loading, notFound, error, loadProfile } = useCandidatePublicProfile(candidateId);
    const [activeTab, setActiveTab] = useState(CANDIDATE_PROFILE_TABS.PERSONAL);

    const backTo = location.state?.backTo;
    const showBackToApplicants =
        backTo?.path && typeof backTo.label === 'string' && backTo.label.trim().length > 0;

    const backLink = showBackToApplicants ? (
        <Link to={backTo.path} className="cpp-back-link">
            ← {backTo.label}
        </Link>
    ) : null;

    if (loading) {
        return (
            <>
                {backLink ? <div className="cpp-page cpp-page--back-only">{backLink}</div> : null}
                <CandidateProfileSkeleton />
            </>
        );
    }

    if (notFound) {
        return (
            <>
                {backLink ? <div className="cpp-page cpp-page--back-only">{backLink}</div> : null}
                <CandidateNotFound />
            </>
        );
    }

    if (error || !profile) {
        return (
            <div className="cpp-page">
                {backLink}
                <div className="cpp-card cpp-error-state">
                    <p>{error || 'Không tải được hồ sơ ứng viên.'}</p>
                    <button type="button" className="btn btn--primary" onClick={loadProfile}>
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="cpp-page">
            {backLink}
            <CandidateProfileHeader profile={profile} />
            <CandidateProfileTabs
                profile={profile}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />
        </div>
    );
};

export default CandidatePublicProfilePage;
