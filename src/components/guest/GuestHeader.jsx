import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/authContext.js';
import { useLogoutToLanding } from '../../hooks/useLogoutToLanding.js';
import { useAutoHideHeader } from '../../hooks/useAutoHideHeader.js';
import { useHomeSectionSpy } from '../../hooks/useHomeSectionSpy.js';
import { ROUTES } from '../../routes/path.js';
import {
    CANDIDATE_HOME_NAV_ITEMS,
    HOME_SECTION_IDS,
    scrollToHomeSection,
} from '../../utils/homeSections.js';
import { setBookmarkReturnPath } from '../../utils/bookmarkStorage.js';
import { MenuIcon, XIcon } from '../common/icons.jsx';
import SiteHeaderBrand from '../common/SiteHeaderBrand.jsx';
import '../../assets/styles/HeaderStyle.css';

// Highlight tab for list pages like `/jobs?section=urgent`.
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
        // Featured list = `/jobs` without `section`
        return !currentSection;
    } catch {
        return false;
    }
};

const GuestHeader = () => {
    const { auth } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const handleLogout = useLogoutToLanding();
    const headerHidden = useAutoHideHeader();
    const [navOpen, setNavOpen] = useState(false);

    const isOnHome = location.pathname === ROUTES.LANDING;

    // Remove “JobLink gợi ý cho bạn” (requires login).
    const navItems = useMemo(
        () =>
            CANDIDATE_HOME_NAV_ITEMS.filter(
                (item) => item.id !== HOME_SECTION_IDS.SUGGESTIONS
            ),
        []
    );
    const sectionIds = useMemo(() => navItems.map((item) => item.id), [navItems]);
    const { activeSectionId, activateSection, clearActiveSection } = useHomeSectionSpy(
        sectionIds,
        { enabled: isOnHome }
    );

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

    const goLogin = () => {
        const returnPath = `${location.pathname}${location.search}${location.hash}`;
        if (
            returnPath &&
            returnPath !== ROUTES.LOGIN &&
            returnPath !== ROUTES.REGISTER
        ) {
            setBookmarkReturnPath(returnPath);
        }
        navigate(ROUTES.LOGIN, { state: { from: returnPath } });
    };

    const handleNavClick = (event, item) => {
        event.preventDefault();
        setNavOpen(false);

        // On landing (`/`): behave like candidate header (scroll to section).
        if (isOnHome) {
            activateSection(item.id);
            scrollToHomeSection(item.id, { behavior: 'smooth' });
            return;
        }

        // On list pages: navigate directly to the list route.
        if (item.listPath) {
            clearActiveSection();
            navigate(item.listPath);
        }
    };

    const renderNavLinks = (className) =>
        navItems.map((item) => {
            const active = isOnHome
                ? activeSectionId === item.id
                : isListPathActive(item.listPath, location.pathname, location.search);

            return (
                <a
                    key={item.id}
                    href={item.listPath || ROUTES.LANDING}
                    className={`${className}${active ? ' active' : ''}`}
                    onClick={(event) => handleNavClick(event, item)}
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
                        aria-controls="guest-header-drawer"
                        aria-label={navOpen ? 'Đóng menu' : 'Mở menu'}
                        onClick={() => setNavOpen((open) => !open)}
                    >
                        {navOpen ? <XIcon width={22} height={22} /> : <MenuIcon width={22} height={22} />}
                    </button>

                    <a
                        href={ROUTES.LANDING}
                        className="site-header__logo"
                        onClick={(e) => {
                            e.preventDefault();
                            setNavOpen(false);
                            clearActiveSection();
                            if (isOnHome) {
                                window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                                return;
                            }
                            navigate(ROUTES.LANDING);
                        }}
                    >
                        <SiteHeaderBrand />
                    </a>

                    <nav
                        className="site-header__nav site-header__nav--role site-header__nav--desktop"
                        aria-label="Khám phá việc làm"
                    >
                        {renderNavLinks('site-header__nav-link')}
                    </nav>
                </div>

                <div className="site-header__right">
                    {auth ? (
                        <>
                            <span className="site-header__user">
                                {auth.fullName}{' '}
                                <span className="site-header__role">
                                    ({auth.role})
                                </span>
                            </span>
                            <button
                                className="btn btn--ghost"
                                onClick={handleLogout}
                            >
                                Đăng xuất
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                className="btn btn--ghost"
                                onClick={goLogin}
                            >
                                Đăng nhập
                            </button>
                            <button
                                className="btn btn--primary"
                                onClick={() => navigate(ROUTES.REGISTER)}
                            >
                                Đăng ký
                            </button>
                        </>
                    )}
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
                        id="guest-header-drawer"
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

export default GuestHeader;
