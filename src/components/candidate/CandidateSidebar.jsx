import Sidebar from '../common/Sidebar.jsx';
import ProfileMenu from '../common/ProfileMenu.jsx';
import { useAuth } from '../../contexts/authContext.js';
import { useLogoutToLanding } from '../../hooks/useLogoutToLanding.js';
import { ROUTES } from '../../routes/path.js';
import {
    HomeIcon,
    SparklesIcon,
    FileTextIcon,
    MailIcon,
    ChatIcon,
    BellIcon,
    SettingsIcon,
    ClockIcon,
} from '../common/icons.jsx';

const CANDIDATE_NAV_ITEMS = [
    { path: ROUTES.CANDIDATE_HOME, label: 'Trang chủ', icon: HomeIcon },
    { path: ROUTES.CANDIDATE_AI_SUGGESTIONS, label: 'AI Gợi ý', icon: SparklesIcon },
    { path: ROUTES.CANDIDATE_PROFILE, label: 'Hồ sơ của tôi', icon: FileTextIcon },
    { path: ROUTES.CANDIDATE_INVITATIONS, label: 'Lời mời', icon: MailIcon },
    { path: ROUTES.CANDIDATE_MESSAGES, label: 'Tin nhắn', icon: ChatIcon },
    { path: ROUTES.CANDIDATE_NOTIFICATIONS, label: 'Thông báo', icon: BellIcon },
    { path: ROUTES.CANDIDATE_SETTINGS, label: 'Cài đặt', icon: SettingsIcon },
    { path: ROUTES.CANDIDATE_APPLICATION_HISTORY, label: 'Lịch sử ứng tuyển', icon: ClockIcon },
];

const CandidateSidebar = () => {
    const { auth } = useAuth();
    const handleLogout = useLogoutToLanding();

    return (
        <Sidebar
            items={CANDIDATE_NAV_ITEMS}
            footer={
                <ProfileMenu
                    name={auth?.fullName}
                    roleLabel="Sinh viên"
                    onLogout={handleLogout}
                    extra={
                        <a href="#" className="sidebar-profile__trust">
                            ★ Tổng điểm Trust Score
                        </a>
                    }
                />
            }
        />
    );
};

export default CandidateSidebar;
