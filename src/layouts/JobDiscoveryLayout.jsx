import AppLayout from '../components/common/AppLayout.jsx';
import Header from '../components/common/Header.jsx';
import Footer from '../components/common/Footer.jsx';
import CandidateHeader from '../components/candidate/CandidateHeader.jsx';
import RecruiterHeader from '../components/recruiter/RecruiterHeader.jsx';
import { useAuth } from '../contexts/authContext.js';
import { USER_ROLES } from '../utils/Constants.jsx';

/**
 * Public job pages keep their shareable URLs.
 * Logged-in candidate/recruiter keep their role header (incl. chat); guests use public header.
 */
const JobDiscoveryLayout = () => {
    const { auth } = useAuth();
    const isCandidate = auth?.role === USER_ROLES.CANDIDATE;
    const isRecruiter = auth?.role === USER_ROLES.RECRUITER;

    const header = isCandidate ? (
        <CandidateHeader />
    ) : isRecruiter ? (
        <RecruiterHeader />
    ) : (
        <Header />
    );

    return <AppLayout header={header} footer={<Footer />} />;
};

export default JobDiscoveryLayout;
