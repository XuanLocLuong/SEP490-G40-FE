import AppLayout from '../components/common/AppLayout.jsx';
import Footer from '../components/common/Footer.jsx';
import GuestHeader from '../components/guest/GuestHeader.jsx';

// Guest: Header + Footer, không sidebar (ảnh 1 — landing page).
const GuestLayout = () => (
    <AppLayout header={<GuestHeader />} footer={<Footer />} />
);

export default GuestLayout;
