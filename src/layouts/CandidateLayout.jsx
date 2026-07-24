import AppLayout from '../components/common/AppLayout.jsx';
import Footer from '../components/common/Footer.jsx';
import CandidateHeader from '../components/candidate/CandidateHeader.jsx';

// Candidate: Header (top, giống Guest) + Footer, KHÔNG còn Sidebar nữa.
const CandidateLayout = () => (
    <AppLayout
        header={<CandidateHeader />}
        footer={<Footer />}
    />
);

export default CandidateLayout;