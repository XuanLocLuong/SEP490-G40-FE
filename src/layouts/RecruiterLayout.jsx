import AppLayout from '../components/common/AppLayout.jsx';
import Header from '../components/common/Header.jsx';
import Footer from '../components/common/Footer.jsx';
import Sidebar from '../components/common/Sidebar.jsx';
import { getRecruiterSidebarItems } from '../components/common/sidebar/recruiterSidebarConfig.js';

const RecruiterLayout = () => (
    <AppLayout
        header={<Header />}
        sidebar={<Sidebar items={getRecruiterSidebarItems()} />}
        footer={<Footer />}
    />
);

export default RecruiterLayout;
