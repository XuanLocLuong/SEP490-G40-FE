import AppLayout from '../components/common/AppLayout.jsx';
import Header from '../components/common/Header.jsx';
import Footer from '../components/common/Footer.jsx';
import Sidebar from '../components/common/Sidebar.jsx';
import { getCandidateSidebarItems } from '../components/common/sidebar/candidateSidebarConfig.js';

const CandidateLayout = () => (
    <AppLayout
        header={<Header />}
        sidebar={<Sidebar items={getCandidateSidebarItems()} />}
        footer={<Footer />}
    />
);

export default CandidateLayout;
