import AppLayout from '../components/common/AppLayout.jsx';
import Header from '../components/common/Header.jsx';
import Footer from '../components/common/Footer.jsx';
import CandidateHeader from '../components/candidate/CandidateHeader.jsx';
import { useAuth } from '../contexts/authContext.js';
import { USER_ROLES } from '../utils/Constants.jsx';

/**
 * Public job pages keep their shareable URLs.
 * Candidates see the same top header as other candidate pages; guests keep the public header.
 */
const JobDiscoveryLayout = () => {
    const { auth } = useAuth();
    const isCandidate = auth?.role === USER_ROLES.CANDIDATE;

    return (
        <AppLayout
            header={isCandidate ? <CandidateHeader /> : <Header />}
            footer={<Footer />}
        />
    );
};

export default JobDiscoveryLayout;
