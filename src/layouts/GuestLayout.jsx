import AppLayout from '../components/common/AppLayout.jsx';
import Header from '../components/common/Header.jsx';
import Footer from '../components/common/Footer.jsx';

// Guest: Header + Footer, không sidebar (ảnh 1 — landing page).
const GuestLayout = () => (
    <AppLayout header={<Header />} footer={<Footer />} />
);

export default GuestLayout;
