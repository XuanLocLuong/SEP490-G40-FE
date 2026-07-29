import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/authContext.js';
import { useLogoutToLanding } from '../../hooks/useLogoutToLanding.js';
import { useAutoHideHeader } from '../../hooks/useAutoHideHeader.js';
import { ROUTES } from '../../routes/path.js';
import {
    CANDIDATE_HOME_NAV_ITEMS,
    HOME_SECTION_IDS,
    scrollToHomeSection,
} from '../../utils/homeSections.js';
import { setBookmarkReturnPath } from '../../utils/bookmarkStorage.js';
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

    const isOnHome = location.pathname === ROUTES.LANDING;
    const [activeHomeSection, setActiveHomeSection] = useState(null);

    // Remove “JobLink gợi ý cho bạn” (requires login).
    const navItems = useMemo(
        () =>
            CANDIDATE_HOME_NAV_ITEMS.filter(
                (item) => item.id !== HOME_SECTION_IDS.SUGGESTIONS
            ),
        []
    );

    const goLogin = () => {
        const returnPath = `${location.pathname}${location.search}`;
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

        // On landing (`/`): behave like candidate header (scroll to section).
        if (isOnHome) {
            setActiveHomeSection(item.id);
            scrollToHomeSection(item.id);
            return;
        }

        // On list pages: navigate directly to the list route.
        if (item.listPath) {
            setActiveHomeSection(null);
            navigate(item.listPath);
        }
    };

    return (
        <header
            className={`site-header${
                headerHidden ? ' site-header--hidden' : ''
            }`}
        >
            <div className="site-header__inner">
                <div className="site-header__left">
                    <a
                        href={ROUTES.LANDING}
                        className="site-header__logo"
                        onClick={(e) => {
                            e.preventDefault();
                            setActiveHomeSection(null);
                            navigate(ROUTES.LANDING);
                        }}
                    >
                        JOBLINK
                    </a>

                    <nav
                        className="site-header__nav site-header__nav--role"
                        aria-label="Khám phá việc làm"
                    >
                        {navItems.map((item) => {
                            const active = isOnHome
                                ? activeHomeSection === item.id
                                : isListPathActive(
                                      item.listPath,
                                      location.pathname,
                                      location.search
                                  );

                            return (
                                <a
                                    key={item.id}
                                    href={item.listPath || ROUTES.LANDING}
                                    className={`site-header__nav-link${
                                        active ? ' active' : ''
                                    }`}
                                    onClick={(event) => handleNavClick(event, item)}
                                >
                                    {item.label}
                                </a>
                            );
                        })}
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
        </header>
    );
};

export default GuestHeader;

