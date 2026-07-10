import AppLayout from '../components/common/AppLayout.jsx';
import { ROUTES } from '../routes/path.js';

// TODO: bổ sung Create Job / My Hosted Jobs / Applicants... khi các trang đó được code.
const navItems = [
    { path: ROUTES.RECRUITER_HOME, label: 'Trang chủ' },
];

const RecruiterLayout = () => <AppLayout navItems={navItems} />;

export default RecruiterLayout;
