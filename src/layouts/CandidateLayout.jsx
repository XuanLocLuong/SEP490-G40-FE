import AppLayout from '../components/common/AppLayout.jsx';
import Footer from '../components/common/Footer.jsx';
import CandidateSidebar from '../components/candidate/CandidateSidebar.jsx';

// Candidate: Sidebar (sáng) + Footer, KHÔNG có Header (ảnh 4).
const CandidateLayout = () => (
    <AppLayout
        sidebar={<CandidateSidebar />}
        footer={<Footer />}
    />
);

export default CandidateLayout;
