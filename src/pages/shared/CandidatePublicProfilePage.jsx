import { Link, useLocation, useParams } from 'react-router-dom';
import { useCandidatePublicProfile } from '../../hooks/useCandidatePublicProfile.js';
import CandidateProfileHeader from '../../components/candidate/public/CandidateProfileHeader.jsx';
import CandidatePublicResume from '../../components/candidate/public/CandidatePublicResume.jsx';
import CandidateReviewsAccordion from '../../components/candidate/public/CandidateReviewsAccordion.jsx';
import CandidateNotFound from '../../components/candidate/public/CandidateNotFound.jsx';
import CandidateProfileSkeleton from '../../components/candidate/public/CandidateProfileSkeleton.jsx';
import '../../assets/styles/CandidatePublicProfile.css';

const CandidatePublicProfilePage = () => {
    const { candidateId } = useParams();
    const location = useLocation();
    const { profile, loading, notFound, error, loadProfile } = useCandidatePublicProfile(candidateId);

    const backTo = location.state?.backTo;
    const candidateUserId =
        location.state?.candidateUserId ?? location.state?.userId ?? null;
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
            <CandidatePublicResume profile={profile} />
            <CandidateReviewsAccordion userId={candidateUserId} />
        </div>
    );
};

export default CandidatePublicProfilePage;
