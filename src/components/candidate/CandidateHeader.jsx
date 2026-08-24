import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { getProfile } from '../../apis/CandidateProfileApi.jsx';
import { useAuth } from '../../contexts/authContext.js';
import { useLogoutToLanding } from '../../hooks/useLogoutToLanding.js';
import { useAutoHideHeader } from '../../hooks/useAutoHideHeader.js';
import { useHomeSectionSpy } from '../../hooks/useHomeSectionSpy.js';
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
    ReviewsIcon,
    EyeIcon,
    MenuIcon,
    XIcon,
} from '../common/icons.jsx';
import {
    CANDIDATE_HOME_NAV_ITEMS,
    HOME_SCROLL_STATE_KEY,
    scrollToHomeSection,
} from '../../utils/homeSections.js';
import { buildInvitationsFromCurrentLocation } from '../../utils/invitationNavReturn.js';
import SiteHeaderBrand from '../common/SiteHeaderBrand.jsx';
import '../../assets/styles/HeaderStyle.css';

const HOME_SECTION_IDS_LIST = CANDIDATE_HOME_NAV_ITEMS.map((item) => item.id);

const BASE_DROPDOWN_ITEMS = [
    { label: 'Hồ sơ của tôi', path: ROUTES.CANDIDATE_PROFILE, icon: FileTextIcon },
    { label: 'Tổng điểm uy tín', path: ROUTES.CANDIDATE_TRUST_SCORE, icon: StarIcon },
    { label: 'Đánh giá nhận được', path: ROUTES.CANDIDATE_REVIEWS, icon: ReviewsIcon },
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
    const { activeSectionId, activateSection, clearActiveSection } = useHomeSectionSpy(
        HOME_SECTION_IDS_LIST,
        { enabled: isOnHome }
    );
    const [navOpen, setNavOpen] = useState(false);

    const dropdownItems = useMemo(
        () =>
            BASE_DROPDOWN_ITEMS.map((item) => {
                if (item.path !== ROUTES.CANDIDATE_INVITATIONS) return item;
                const state = buildInvitationsFromCurrentLocation(location);
                return state ? { ...item, state } : item;
            }),
        [location],
    );

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

    useEffect(() => {
        setNavOpen(false);
    }, [location.pathname, location.search]);

    useEffect(() => {
        if (!navOpen) return undefined;
        const onKey = (e) => {
            if (e.key === 'Escape') setNavOpen(false);
        };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [navOpen]);

    const handleHomeNavClick = (event, item) => {
        event.preventDefault();
        setNavOpen(false);

        if (isOnHome) {
            activateSection(item.id);
            scrollToHomeSection(item.id, { behavior: 'smooth' });
            return;
        }

        if (item.listPath) {
            clearActiveSection();
            navigate(item.listPath);
            return;
        }

        // No list page yet (Top employers) → homepage + one-shot scroll via state
        activateSection(item.id);
        navigate(ROUTES.CANDIDATE_HOME, {
            state: { [HOME_SCROLL_STATE_KEY]: item.id },
        });
    };

    const renderNavLinks = (className) =>
        CANDIDATE_HOME_NAV_ITEMS.map((item) => {
            const href = item.listPath || ROUTES.CANDIDATE_HOME;
            const active = isOnHome
                ? activeSectionId === item.id
                : isListPathActive(item.listPath, location.pathname, location.search);

            return (
                <a
                    key={item.id}
                    href={href}
                    className={`${className}${active ? ' active' : ''}`}
                    onClick={(event) => handleHomeNavClick(event, item)}
                >
                    {item.label}
                </a>
            );
        });

    return (
        <header
            className={`site-header${headerHidden ? ' site-header--hidden' : ''}${
                navOpen ? ' site-header--nav-open' : ''
            }`}
        >
            <div className="site-header__inner">
                <div className="site-header__left">
                    <button
                        type="button"
                        className="site-header__menu-btn"
                        aria-expanded={navOpen}
                        aria-controls="candidate-header-drawer"
                        aria-label={navOpen ? 'Đóng menu' : 'Mở menu'}
                        onClick={() => setNavOpen((open) => !open)}
                    >
                        {navOpen ? <XIcon width={22} height={22} /> : <MenuIcon width={22} height={22} />}
                    </button>

                    <NavLink
                        to={ROUTES.CANDIDATE_HOME}
                        className="site-header__logo"
                        onClick={() => {
                            setNavOpen(false);
                            clearActiveSection();
                            if (isOnHome) {
                                window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                            }
                        }}
                    >
                        <SiteHeaderBrand />
                    </NavLink>

                    <nav
                        className="site-header__nav site-header__nav--role site-header__nav--desktop"
                        aria-label="Khám phá việc làm"
                    >
                        {renderNavLinks('site-header__nav-link')}
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
                        items={dropdownItems}
                        onLogout={() => {
                            handleLogout();
                            navigate(ROUTES.LANDING);
                        }}
                    />
                </div>
            </div>

            {navOpen ? (
                <>
                    <button
                        type="button"
                        className="site-header__drawer-backdrop"
                        aria-label="Đóng menu"
                        onClick={() => setNavOpen(false)}
                    />
                    <nav
                        id="candidate-header-drawer"
                        className="site-header__drawer"
                        aria-label="Khám phá việc làm"
                    >
                        {renderNavLinks('site-header__drawer-link')}
                    </nav>
                </>
            ) : null}
        </header>
    );
};

export default CandidateHeader;
