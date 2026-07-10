import { useAuth } from '../contexts/authContext.js';
import { USER_ROLES } from '../utils/Constants.jsx';
import { ROUTES } from '../routes/path.js';
import AppLayout from '../components/common/AppLayout.jsx';

// 3 role nội bộ (Admin, Post Manager, Manual Check Team) đều là dashboard
// nội bộ giống nhau về mặt khung layout, chỉ khác nav item — nên dùng
// chung 1 layout, đổi nav theo role thay vì tạo 3 layout gần như y hệt nhau.
// TODO: bổ sung thêm nav item khi các trang con (queue, accounts, analytics...) được code.
const NAV_BY_ROLE = {
    [USER_ROLES.ADMIN]: [
        { path: ROUTES.ADMIN_HOME, label: 'Admin Dashboard' },
    ],
    [USER_ROLES.POST_MANAGER]: [
        { path: ROUTES.POST_MANAGER_HOME, label: 'Post Manager Dashboard' },
    ],
    [USER_ROLES.MANUAL_CHECK_TEAM]: [
        { path: ROUTES.MANUAL_CHECK_HOME, label: 'Manual Verification Dashboard' },
    ],
};

const InternalLayout = () => {
    const { auth } = useAuth();
    const navItems = NAV_BY_ROLE[auth?.role] || [];

    return <AppLayout navItems={navItems} />;
};

export default InternalLayout;
