import AppLayout from '../components/common/AppLayout.jsx';
import InternalSidebar from '../components/common/InternalSidebar.jsx';
import InternalTopbar from '../components/common/InternalTopbar.jsx';
import { useAuth } from '../contexts/authContext.js';
import { useLogoutToLanding } from '../hooks/useLogoutToLanding.js';
import { USER_ROLES } from '../utils/Constants.jsx';
import { ROUTES } from '../routes/path.js';
import {
    ClipboardIcon,
    UsersIcon,
    ShieldIcon,
    AlertIcon,
    ChartIcon,
    SettingsIcon,
    LayersIcon,
    LockIcon,
} from '../components/common/icons.jsx';

// Internal: InternalSidebar (tối) + InternalTopbar, KHÔNG có Footer (ảnh 6/7/8).
//
// Lưu ý: 3 thiết kế gốc (Admin/Post Manager/Manual Check Team) không đồng
// nhất 100% về vị trí avatar/chip role ở topbar — mình gộp thống nhất:
// avatar + tên + logout luôn nằm cuối Sidebar (giống ảnh Admin), Topbar
// chỉ giữ icon cài đặt (không dùng chuông thông báo cho role nội bộ).
const CONFIG_BY_ROLE = {
    [USER_ROLES.ADMIN]: {
        title: 'JobLink',
        subtitle: 'Admin Console',
        variant: 'dark',
        roleLabel: 'Super Admin',
        items: [
            { path: ROUTES.ADMIN_HOME, label: 'Thống kê toàn hệ thống', icon: ChartIcon },
            {
                id: 'system-config',
                label: 'Cấu hình hệ thống',
                icon: SettingsIcon,
                children: [
                    { path: ROUTES.ADMIN_SKILLS, label: 'Kỹ năng', icon: LayersIcon },
                    { path: ROUTES.ADMIN_JOB_TYPES, label: 'Lĩnh vực', icon: LayersIcon },
                    { path: ROUTES.ADMIN_BUSINESS_TYPES, label: 'Loại hình DN', icon: ClipboardIcon },
                    { path: ROUTES.ADMIN_TRUST_SCORE_RULES, label: 'Điểm uy tín', icon: ShieldIcon },
                    { path: ROUTES.ADMIN_BLACKLIST_KEYWORDS, label: 'Cấu hình từ cấm', icon: LockIcon },
                    { path: ROUTES.ADMIN_SYSTEM_CONFIG, label: 'Cấu hình trọng số', icon: SettingsIcon },
                ],
            },
            {
                id: 'account',
                label: 'Tài khoản',
                icon: UsersIcon,
                children: [
                    { path: ROUTES.ADMIN_ACCOUNTS, label: 'Quản lý tài khoản', icon: UsersIcon },
                    { path: ROUTES.ADMIN_AUDIT_LOG, label: 'Nhật ký hoạt động', icon: ClipboardIcon },
                ],
            },
            { path: ROUTES.ADMIN_SETTINGS, label: 'Cài đặt', icon: SettingsIcon },
        ],
    },
    [USER_ROLES.POST_MANAGER]: {
        title: 'JobLink',
        subtitle: 'Post Management Portal',
        variant: 'dark',
        roleLabel: 'Post Manager',
        items: [
            { path: ROUTES.POST_MANAGER_ANALYTICS, label: 'Giám sát bài đăng', icon: ChartIcon },
            { path: ROUTES.POST_MANAGER_QUEUE, label: 'Hàng chờ kiểm duyệt', icon: ClipboardIcon },
            { path: ROUTES.POST_MANAGER_REPORTS, label: 'Báo cáo và khiếu nại', icon: AlertIcon },
            { path: ROUTES.POST_MANAGER_SETTINGS, label: 'Cài đặt', icon: SettingsIcon },
        ],
    },
    [USER_ROLES.MANUAL_CHECK_TEAM]: {
        title: 'JobLink',
        subtitle: 'Manual Verification Team Console',
        variant: 'verification',
        roleLabel: 'Manual Team',
        items: [
            { path: ROUTES.MANUAL_CHECK_VERIFICATION, label: 'Duyệt xác minh', icon: ShieldIcon },
            { path: ROUTES.MANUAL_CHECK_REVIEWS, label: 'Kiểm duyệt đánh giá', icon: AlertIcon },
            { path: ROUTES.MANUAL_CHECK_SETTINGS, label: 'Cài đặt', icon: SettingsIcon },
        ],
    },
};

const InternalLayout = () => {
    const { auth } = useAuth();
    const handleLogout = useLogoutToLanding();
    const config = CONFIG_BY_ROLE[auth?.role];

    if (!config) return null;

    return (
        <AppLayout
            header={<InternalTopbar />}
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
