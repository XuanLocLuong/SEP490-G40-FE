import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/authContext.js';
import { useLogoutToLanding } from '../../hooks/useLogoutToLanding.js';
import { useAutoHideHeader } from '../../hooks/useAutoHideHeader.js';
import { ROUTES } from '../../routes/path.js';
import ProfileMenu from '../common/ProfileMenu.jsx';
import {
    PlusSquareIcon,
    ListIcon,
    UsersIcon,
    ChartIcon,
    BuildingIcon,
    SettingsIcon,
    ChatIcon,
    BellIcon,
} from '../common/icons.jsx';
import '../../assets/styles/HeaderStyle.css';

const DROPDOWN_ITEMS = [
    { label: 'Đăng tin', path: ROUTES.RECRUITER_CREATE_JOB, icon: PlusSquareIcon },
    { label: 'Tin của tôi', path: ROUTES.RECRUITER_MY_JOBS, icon: ListIcon },
    { label: 'Ứng viên', path: ROUTES.RECRUITER_APPLICANTS, icon: UsersIcon },
    { label: 'Thống kê', path: ROUTES.RECRUITER_ANALYTICS, icon: ChartIcon },
    { label: 'Tất cả tin tuyển dụng', path: ROUTES.RECRUITER_ALL_JOBS, icon: ListIcon },
    { label: 'Hồ sơ nhà tuyển dụng', path: ROUTES.RECRUITER_PROFILE, icon: BuildingIcon },
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
                        JOBLINK
                    </NavLink>

                    <nav className="site-header__nav site-header__nav--role">
                        <NavLink to={ROUTES.RECRUITER_AI_SUGGESTIONS} className="site-header__nav-link">
                            AI Gợi ý
                        </NavLink>
                        <a href="#" className="site-header__nav-link">
                            Top Recruiter
                        </a>
                    </nav>
                </div>

                <div className="site-header__right">
                    <NavLink to={ROUTES.RECRUITER_SETTINGS} className="site-header__icon-btn" aria-label="Cài đặt">
                        <SettingsIcon />
                    </NavLink>
                    <a href="#" className="site-header__icon-btn" aria-label="Tin nhắn">
                        <ChatIcon />
                    </a>
                    <a href="#" className="site-header__icon-btn" aria-label="Thông báo">
                        <BellIcon />
                    </a>

                    <ProfileMenu
                        variant="header"
                        name={auth?.fullName}
                        roleLabel="Nhà tuyển dụng"
                        items={DROPDOWN_ITEMS}
                        onLogout={handleLogout}
                    />
                </div>
            </div>
        </header>
    );
};

export default RecruiterHeader;
