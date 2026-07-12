import AppLayout from '../components/common/AppLayout.jsx';
import Sidebar from '../components/common/Sidebar.jsx';
import Footer from '../components/common/Footer.jsx';
import ProfileMenu from '../components/common/ProfileMenu.jsx';
import { useAuth } from '../contexts/authContext.js';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes/path.js';
import {
    GridIcon,
    PlusSquareIcon,
    ListIcon,
    UsersIcon,
    SparklesIcon,
    ChartIcon,
    ChatIcon,
    StarIcon,
    BuildingIcon,
    SettingsIcon,
} from '../components/common/icons.jsx';

// Recruiter: Sidebar (sáng) + Footer, KHÔNG có Header (ảnh 5).
const NAV_ITEMS = [
    { path: ROUTES.RECRUITER_HOME, label: 'Tổng quan', icon: GridIcon },
    { path: ROUTES.RECRUITER_CREATE_JOB, label: 'Đăng tin', icon: PlusSquareIcon },
    { path: ROUTES.RECRUITER_MY_JOBS, label: 'Tin của tôi', icon: ListIcon },
    { path: ROUTES.RECRUITER_APPLICANTS, label: 'Ứng viên', icon: UsersIcon },
    { path: ROUTES.RECRUITER_AI_SUGGESTIONS, label: 'AI Gợi ý', icon: SparklesIcon },
    { path: ROUTES.RECRUITER_ANALYTICS, label: 'Thống kê', icon: ChartIcon },
    { path: ROUTES.RECRUITER_MESSAGES, label: 'Tin nhắn', icon: ChatIcon },
    { path: ROUTES.RECRUITER_TRUST_SCORE, label: 'Điểm uy tín', icon: StarIcon },
    { path: ROUTES.RECRUITER_ALL_JOBS, label: 'Tất cả các tin tuyển dụng', icon: ListIcon },
    { path: ROUTES.RECRUITER_SETTINGS, label: 'Cài đặt', icon: SettingsIcon },
    { path: ROUTES.RECRUITER_PROFILE, label: 'Hồ sơ nhà tuyển dụng', icon: BuildingIcon },
];

const RecruiterSidebarFooter = () => {
    const { auth, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate(ROUTES.LOGIN);
    };

    return (
        <ProfileMenu
            name={auth?.fullName}
            roleLabel="Nhà tuyển dụng"
            onLogout={handleLogout}
        />
    );
};

const RecruiterLayout = () => (
    <AppLayout
        sidebar={
            <Sidebar
                logoText="JobLink"
                items={NAV_ITEMS}
                footer={<RecruiterSidebarFooter />}
            />
        }
        footer={<Footer />}
    />
);

export default RecruiterLayout;
