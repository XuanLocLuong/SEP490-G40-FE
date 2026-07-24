import AppLayout from '../components/common/AppLayout.jsx';
import Footer from '../components/common/Footer.jsx';
import RecruiterHeader from '../components/recruiter/RecruiterHeader.jsx';

// Recruiter: Header (top, giống Guest) + Footer, KHÔNG còn Sidebar nữa.
const RecruiterLayout = () => (
    <AppLayout
        header={<RecruiterHeader />}
        footer={<Footer />}
    />
);

export default RecruiterLayout;