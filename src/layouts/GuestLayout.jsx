import AppLayout from '../components/common/AppLayout.jsx';

// Guest không có sidebar — nav chính nằm ở Header (Login/Register).
const GuestLayout = () => <AppLayout navItems={[]} />;

export default GuestLayout;
