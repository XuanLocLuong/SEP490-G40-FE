import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/common/AppLayout.jsx';
import InternalSidebar from '../components/common/InternalSidebar.jsx';
import InternalTopbar from '../components/common/InternalTopbar.jsx';
import { useAuth } from '../contexts/authContext.js';
import { USER_ROLES } from '../utils/Constants.jsx';
import { ROUTES } from '../routes/path.js';
import {
    GridIcon,
    ClipboardIcon,
    UsersIcon,
    ShieldIcon,
    AlertIcon,
    ChartIcon,
    SettingsIcon,
    TrendingIcon,
} from '../components/common/icons.jsx';

// Internal: InternalSidebar (tối) + InternalTopbar, KHÔNG có Footer (ảnh 6/7/8).
//
// Lưu ý: 3 thiết kế gốc (Admin/Post Manager/Manual Check Team) không đồng
// nhất 100% về vị trí avatar/chip role ở topbar — mình gộp thống nhất:
// avatar + tên + logout luôn nằm cuối Sidebar (giống ảnh Admin), Topbar chỉ
// còn icon thông báo/cài đặt cho cả 3 role.
const CONFIG_BY_ROLE = {
    [USER_ROLES.ADMIN]: {
        title: 'JobLink',
        subtitle: 'Super Admin Console',
        variant: 'dark',
        roleLabel: 'Super Admin',
        items: [
            { path: ROUTES.ADMIN_HOME, label: 'Bảng điều khiển', icon: GridIcon },
            { path: ROUTES.ADMIN_SYSTEM_CONFIG, label: 'Cấu hình hệ thống', icon: SettingsIcon },
            { path: ROUTES.ADMIN_AUDIT_LOG, label: 'Nhật ký hoạt động', icon: ClipboardIcon },
            { path: ROUTES.ADMIN_ESCALATIONS, label: 'Sự cố leo thang', icon: AlertIcon },
            { path: ROUTES.ADMIN_ANALYTICS, label: 'Thống kê toàn hệ thống', icon: ChartIcon },
        ],
        actionButton: { label: '📊  Xuất báo cáo' },
    },
    [USER_ROLES.POST_MANAGER]: {
        title: 'JobLink Admin',
        subtitle: 'Management Portal',
        variant: 'dark',
        roleLabel: 'Post Manager',
        items: [
            { path: ROUTES.POST_MANAGER_HOME, label: 'Dashboard', icon: GridIcon },
            { path: ROUTES.POST_MANAGER_QUEUE, label: 'Hàng chờ kiểm duyệt', icon: ClipboardIcon },
            { path: ROUTES.POST_MANAGER_URGENT_JOBS, label: 'Tin tuyển gấp', icon: TrendingIcon },
            { path: ROUTES.POST_MANAGER_ANALYTICS, label: 'Thống kê toàn hệ thống', icon: ChartIcon },
            { path: ROUTES.POST_MANAGER_REPORTS, label: 'Báo cáo và khiếu nại', icon: AlertIcon },
            { path: ROUTES.POST_MANAGER_SETTINGS, label: 'Cài đặt', icon: SettingsIcon },
        ],
        actionButton: { label: '+ Tạo tin mới' },
    },
    [USER_ROLES.MANUAL_CHECK_TEAM]: {
        title: 'JobLink',
        subtitle: 'Manual Verification Team Console',
        variant: 'verification',
        roleLabel: 'Manual Team',
        items: [
            { path: ROUTES.MANUAL_CHECK_HOME, label: 'Dashboard', icon: GridIcon },
            { path: ROUTES.MANUAL_CHECK_ACCOUNTS, label: 'Quản lý tài khoản', icon: UsersIcon },
            { path: ROUTES.MANUAL_CHECK_VERIFICATION, label: 'Duyệt xác minh', icon: ShieldIcon },
            { path: ROUTES.MANUAL_CHECK_REPORTS, label: 'Uy tín & Khiếu nại', icon: AlertIcon },
        ],
    },
};

const InternalLayout = () => {
    const { auth, logout } = useAuth();
    const navigate = useNavigate();
    const config = CONFIG_BY_ROLE[auth?.role];

    const handleLogout = async () => {
        await logout();
        navigate(ROUTES.LOGIN);
    };

    if (!config) return null;

    return (
        <AppLayout
            header={<InternalTopbar hasNotification />}
            sidebar={
                <InternalSidebar
                    title={config.title}
                    subtitle={config.subtitle}
                    variant={config.variant}
                    items={config.items}
                    actionButton={config.actionButton}
                    userName={auth?.fullName}
                    userRoleLabel={config.roleLabel}
                    onLogout={handleLogout}
                />
            }
        />
    );
};

export default InternalLayout;
