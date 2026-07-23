import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/authContext.js';
import { useLogoutToLanding } from '../../hooks/useLogoutToLanding.js';
import { useAutoHideHeader } from '../../hooks/useAutoHideHeader.js';
import { ROUTES } from '../../routes/path.js';
import ProfileMenu from '../common/ProfileMenu.jsx';
import {
    FileTextIcon,
    MailIcon,
    BellIcon,
    SettingsIcon,
    ChatIcon,
    ClockIcon,
} from '../common/icons.jsx';
import '../../assets/styles/HeaderStyle.css';

const DROPDOWN_ITEMS = [
    { label: 'Hồ sơ của tôi', path: ROUTES.CANDIDATE_PROFILE, icon: FileTextIcon },
    { label: 'Lời mời', path: ROUTES.CANDIDATE_INVITATIONS, icon: MailIcon },
    { label: 'Lịch sử ứng tuyển', path: ROUTES.CANDIDATE_APPLICATION_HISTORY, icon: ClockIcon },
];

const CandidateHeader = () => {
    const { auth } = useAuth();
    const navigate = useNavigate();
    const handleLogout = useLogoutToLanding();
    const headerHidden = useAutoHideHeader();

    return (
        <header className={`site-header${headerHidden ? ' site-header--hidden' : ''}`}>
            <div className="site-header__inner">
                <div className="site-header__left">
                    <NavLink to={ROUTES.CANDIDATE_HOME} className="site-header__logo">
                        JOBLINK
                    </NavLink>

                    <nav className="site-header__nav site-header__nav--role">
                        <NavLink to={ROUTES.CANDIDATE_AI_SUGGESTIONS} className="site-header__nav-link">
                            AI Gợi ý
                        </NavLink>
                        <a href="#" className="site-header__nav-link">
                            Tin tuyển gấp
                        </a>
                        <a href="#" className="site-header__nav-link">
                            Top Recruiter
                        </a>
                    </nav>
                </div>

                <div className="site-header__right">
                    <NavLink to={ROUTES.CANDIDATE_SETTINGS} className="site-header__icon-btn" aria-label="Cài đặt">
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
                        roleLabel="Sinh viên"
                        items={DROPDOWN_ITEMS}
                        onLogout={() => {
                            handleLogout();
                            navigate(ROUTES.LANDING);
                        }}
                        extra={
                            <a href="#" className="sidebar-profile__trust">
                                ★ Tổng điểm Trust Score
                            </a>
                        }
                    />
                </div>
            </div>
        </header>
    );
};

export default CandidateHeader;
