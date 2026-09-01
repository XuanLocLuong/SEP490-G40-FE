import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/authContext.js';
import { useLogoutToLanding } from '../../hooks/useLogoutToLanding.js';
import { useAutoHideHeader } from '../../hooks/useAutoHideHeader.js';
import { ROUTES } from '../../routes/path.js';
import ProfileMenu from '../common/ProfileMenu.jsx';
import NotificationBell from '../notifications/NotificationBell.jsx';
import ChatBell from '../chat/ChatBell.jsx';
import {
    PlusSquareIcon,
    ListIcon,
    UsersIcon,
    ChartIcon,
    BuildingIcon,
    SettingsIcon,
    MailIcon,
    StarIcon,
} from '../common/icons.jsx';
import SiteHeaderBrand from '../common/SiteHeaderBrand.jsx';
import '../../assets/styles/HeaderStyle.css';

const DROPDOWN_ITEMS = [
    { label: 'Đăng tin', path: ROUTES.RECRUITER_CREATE_JOB, icon: PlusSquareIcon },
    { label: 'Tin của tôi', path: ROUTES.RECRUITER_MY_JOBS, icon: ListIcon },
    { label: 'Ứng viên', path: ROUTES.RECRUITER_APPLICANTS, icon: UsersIcon },
    { label: 'Quản lý lời mời', path: ROUTES.RECRUITER_INVITATIONS, icon: MailIcon },
    { label: 'Thống kê', path: ROUTES.RECRUITER_ANALYTICS, icon: ChartIcon },
    { label: 'Điểm uy tín', path: ROUTES.RECRUITER_TRUST_SCORE, icon: StarIcon },
    { label: 'Hồ sơ nhà tuyển dụng', path: ROUTES.RECRUITER_PROFILE, icon: BuildingIcon },
    { label: 'Tài khoản và bảo mật', path: ROUTES.RECRUITER_SETTINGS, icon: SettingsIcon },
];

const RecruiterHeader = () => {
    const { auth } = useAuth();
    const handleLogout = useLogoutToLanding();
    const headerHidden = useAutoHideHeader();

    return (
        <header className={`site-header${headerHidden ? ' site-header--hidden' : ''}`}>
            <div className="site-header__inner">
                <div className="site-header__left">
                    <NavLink to={ROUTES.RECRUITER_HOME} className="site-header__logo">
                        <SiteHeaderBrand />
                    </NavLink>

                    <nav className="site-header__nav site-header__nav--role">
                        <NavLink to={ROUTES.TOP_RECRUITERS} className="site-header__nav-link">
                            Top Nhà Tuyển Dụng
                        </NavLink>
                    </nav>
                </div>

                <div className="site-header__right">
                    <ChatBell />
                    <NotificationBell />

                    <ProfileMenu
                        variant="header"
                        name={auth?.fullName}
                        roleLabel="Nhà tuyển dụng"
                        avatarUrl={auth?.profilePicture || null}
                        items={DROPDOWN_ITEMS}
                        onLogout={handleLogout}
                    />
                </div>
            </div>
        </header>
    );
};

export default RecruiterHeader;
