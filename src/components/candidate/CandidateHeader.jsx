import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { getProfile } from '../../apis/CandidateProfileApi.jsx';
import { useAuth } from '../../contexts/authContext.js';
import { useLogoutToLanding } from '../../hooks/useLogoutToLanding.js';
import { useAutoHideHeader } from '../../hooks/useAutoHideHeader.js';
import { ROUTES } from '../../routes/path.js';
import ProfileMenu from '../common/ProfileMenu.jsx';
import NotificationBell from '../notifications/NotificationBell.jsx';
import ChatBell from '../chat/ChatBell.jsx';
import {
    FileTextIcon,
    MailIcon,
    SettingsIcon,
    ClockIcon,
    StarIcon,
    EyeIcon,
} from '../common/icons.jsx';
import {
    CANDIDATE_HOME_NAV_ITEMS,
    HOME_SCROLL_STATE_KEY,
    scrollToHomeSection,
} from '../../utils/homeSections.js';
import '../../assets/styles/HeaderStyle.css';

const DROPDOWN_ITEMS = [
    { label: 'Hồ sơ của tôi', path: ROUTES.CANDIDATE_PROFILE, icon: FileTextIcon },
    { label: 'Tổng điểm Trust Score', path: ROUTES.CANDIDATE_TRUST_SCORE, icon: StarIcon },
    { label: 'Tài khoản và bảo mật', path: ROUTES.CANDIDATE_SETTINGS, icon: SettingsIcon },
    { label: 'Lời mời', path: ROUTES.CANDIDATE_INVITATIONS, icon: MailIcon },
    { label: 'Lịch sử ứng tuyển', path: ROUTES.CANDIDATE_APPLICATION_HISTORY, icon: ClockIcon },
    { label: 'Lịch sử tương tác', path: ROUTES.CANDIDATE_INTERACTIONS, icon: EyeIcon },
];

const isListPathActive = (listPath, pathname, search) => {
    if (!listPath) return false;
    try {
        const target = new URL(listPath, 'http://local.invalid');
        if (target.pathname !== pathname) return false;
        const targetSection = target.searchParams.get('section');
        const currentSection = new URLSearchParams(search).get('section');
        if (targetSection) {
            return currentSection === targetSection;
        }
        // Featured list = /jobs without section=
        return !currentSection;
    } catch {
        return false;
    }
};

const CandidateHeader = () => {
    const { auth, updateProfile } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const handleLogout = useLogoutToLanding();
    const headerHidden = useAutoHideHeader();
    const isOnHome = location.pathname === ROUTES.CANDIDATE_HOME;
    const [activeHomeSection, setActiveHomeSection] = useState(null);

    // Sync avatar từ /candidate/profile vào auth (login thường không có profilePicture).
    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const res = await getProfile();
                const picture = res?.data?.data?.profilePicture || null;
                if (cancelled || !picture) return;
                updateProfile?.({ profilePicture: picture });
            } catch {
                // Giữ chữ cái nếu không tải được profile.
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [updateProfile]);

    const handleHomeNavClick = (event, item) => {
        event.preventDefault();

        if (isOnHome) {
            setActiveHomeSection(item.id);
            scrollToHomeSection(item.id);
            return;
        }

        if (item.listPath) {
            setActiveHomeSection(null);
            navigate(item.listPath);
            return;
        }

        // No list page yet (Top employers) → homepage + one-shot scroll via state
        setActiveHomeSection(item.id);
        navigate(ROUTES.CANDIDATE_HOME, {
            state: { [HOME_SCROLL_STATE_KEY]: item.id },
        });
    };

    return (
        <header className={`site-header${headerHidden ? ' site-header--hidden' : ''}`}>
            <div className="site-header__inner">
                <div className="site-header__left">
                    <NavLink
                        to={ROUTES.CANDIDATE_HOME}
                        className="site-header__logo"
                        onClick={() => setActiveHomeSection(null)}
                    >
                        JOBLINK
                    </NavLink>

                    <nav className="site-header__nav site-header__nav--role" aria-label="Khám phá việc làm">
                        {CANDIDATE_HOME_NAV_ITEMS.map((item) => {
                            const href = item.listPath || ROUTES.CANDIDATE_HOME;
                            const active = isOnHome
                                ? activeHomeSection === item.id
                                : isListPathActive(item.listPath, location.pathname, location.search);

                            return (
                                <a
                                    key={item.id}
                                    href={href}
                                    className={`site-header__nav-link${active ? ' active' : ''}`}
                                    onClick={(event) => handleHomeNavClick(event, item)}
                                >
                                    {item.label}
                                </a>
                            );
                        })}
                    </nav>
                </div>

                <div className="site-header__right">
                    <ChatBell />
                    <NotificationBell />

                    <ProfileMenu
                        variant="header"
                        name={auth?.fullName}
                        roleLabel="Ứng viên"
                        avatarUrl={auth?.profilePicture || null}
                        items={DROPDOWN_ITEMS}
                        onLogout={() => {
                            handleLogout();
                            navigate(ROUTES.LANDING);
                        }}
                    />
                </div>
            </div>
        </header>
    );
};

export default CandidateHeader;
