import AppLayout from '../components/common/AppLayout.jsx';
import { ROUTES } from '../routes/path.js';

// TODO: bổ sung thêm item khi các trang tương ứng được code
// (Profile, Applications, Recommendations... theo screen inventory đã tổng hợp).
const navItems = [
    { path: ROUTES.CANDIDATE_HOME, label: 'Trang chủ' },
];

const CandidateLayout = () => <AppLayout navItems={navItems} />;

export default CandidateLayout;
