import AppLayout from '../components/common/AppLayout.jsx';
import Sidebar from '../components/common/Sidebar.jsx';
import Footer from '../components/common/Footer.jsx';
import ProfileMenu from '../components/common/ProfileMenu.jsx';
import { useAuth } from '../contexts/authContext.js';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes/path.js';
import {
    HomeIcon,
    SparklesIcon,
    FileTextIcon,
    MailIcon,
    ChatIcon,
    BellIcon,
    SettingsIcon,
    ClockIcon,
} from '../components/common/icons.jsx';

// Candidate: Sidebar (sáng) + Footer, KHÔNG có Header (ảnh 4).
const NAV_ITEMS = [
    { path: ROUTES.CANDIDATE_HOME, label: 'Trang chủ', icon: HomeIcon },
    { path: ROUTES.CANDIDATE_AI_SUGGESTIONS, label: 'AI Gợi ý', icon: SparklesIcon },
    { path: ROUTES.CANDIDATE_PROFILE, label: 'Hồ sơ của tôi', icon: FileTextIcon },
    { path: ROUTES.CANDIDATE_INVITATIONS, label: 'Lời mời', icon: MailIcon },
    { path: ROUTES.CANDIDATE_MESSAGES, label: 'Tin nhắn', icon: ChatIcon },
    { path: ROUTES.CANDIDATE_NOTIFICATIONS, label: 'Thông báo', icon: BellIcon },
    { path: ROUTES.CANDIDATE_SETTINGS, label: 'Cài đặt', icon: SettingsIcon },
    { path: ROUTES.CANDIDATE_APPLICATION_HISTORY, label: 'Lịch sử ứng tuyển', icon: ClockIcon },
];

const CandidateSidebarFooter = () => {
    const { auth, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate(ROUTES.LOGIN);
    };

    return (
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
    );
};

const CandidateLayout = () => (
    <AppLayout
        sidebar={<Sidebar items={NAV_ITEMS} footer={<CandidateSidebarFooter />} />}
        footer={<Footer />}
    />
);

export default CandidateLayout;

