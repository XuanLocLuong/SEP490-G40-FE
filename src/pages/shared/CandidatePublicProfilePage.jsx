import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCandidatePublicProfile } from '../../hooks/useCandidatePublicProfile.js';
import { CANDIDATE_PROFILE_TABS } from '../../utils/candidatePublicProfileConstants.js';
import CandidateProfileHeader from '../../components/candidate/public/CandidateProfileHeader.jsx';
import CandidateProfileTabs from '../../components/candidate/public/CandidateProfileTabs.jsx';
import CandidateNotFound from '../../components/candidate/public/CandidateNotFound.jsx';
import CandidateProfileSkeleton from '../../components/candidate/public/CandidateProfileSkeleton.jsx';
import '../../assets/styles/CandidatePublicProfile.css';

const CandidatePublicProfilePage = () => {
    const { candidateId } = useParams();
    const { profile, loading, notFound, error, loadProfile } = useCandidatePublicProfile(candidateId);
    const [activeTab, setActiveTab] = useState(CANDIDATE_PROFILE_TABS.PERSONAL);

    if (loading) {
        return <CandidateProfileSkeleton />;
    }

    if (notFound) {
        return <CandidateNotFound />;
    }

    if (error || !profile) {
        return (
            <div className="cpp-page">
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
