import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/authContext.js';
import { useLogoutToLanding } from '../../hooks/useLogoutToLanding.js';
import { useAutoHideHeader } from '../../hooks/useAutoHideHeader.js';
import { ROUTES } from '../../routes/path.js';
import '../../assets/styles/HeaderStyle.css';

// Header dùng cho GuestLayout.
const Header = () => {
    const { auth } = useAuth();
    const navigate = useNavigate();
    const handleLogout = useLogoutToLanding();
    const headerHidden = useAutoHideHeader();

    return (
        <header className={`site-header${headerHidden ? ' site-header--hidden' : ''}`}>
            <div className="site-header__inner">
                <div className="site-header__left">
                    <NavLink to={ROUTES.LANDING} className="site-header__logo">
                        JOBLINK
                    </NavLink>

                    <nav className="site-header__nav">
                        <NavLink to={ROUTES.JOB_LIST} className="site-header__nav-link">
                            Việc làm
                        </NavLink>
                        <NavLink to={ROUTES.LANDING} className="site-header__nav-link">
                            Công ty
                        </NavLink>
                    </nav>
                </div>

                <div className="site-header__right">
                    {auth ? (
                        <>
                            <span className="site-header__user">
                                {auth.fullName}{' '}
                                <span className="site-header__role">({auth.role})</span>
                            </span>
                            <button className="btn btn--ghost" onClick={handleLogout}>
                                Đăng xuất
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                className="btn btn--ghost"
                                onClick={() => navigate(ROUTES.LOGIN)}
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

export default Header;
