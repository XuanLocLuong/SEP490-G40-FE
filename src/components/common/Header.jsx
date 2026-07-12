import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/authContext.js';
import { getAccountMenuByRole } from './account-menu/accountMenuConfig.js';
import { ROUTES, getHomePathByRole } from '../../routes/path.js';
import HeaderProfileDropdown from './account-menu/HeaderProfileDropdown.jsx';
import '../../assets/styles/HeaderStyle.css';

const Header = () => {
    const { auth, logout } = useAuth();
    const navigate = useNavigate();

    const homePath = auth ? getHomePathByRole(auth.role) : ROUTES.LANDING;
    const menu = auth ? getAccountMenuByRole(auth.role) : null;

    const handleLogout = async () => {
        await logout();
        navigate(ROUTES.LOGIN);
    };

    return (
        <header className="site-header">
            <div className="site-header__inner">
                <div className="site-header__left">
                    <NavLink to={homePath} className="site-header__logo">
                        JOBLINK
                    </NavLink>

                    <nav className="site-header__nav">
                        <NavLink to={ROUTES.LANDING} className="site-header__nav-link">
                            Việc làm
                        </NavLink>
                        <NavLink to={ROUTES.LANDING} className="site-header__nav-link">
                            Công ty
                        </NavLink>
                    </nav>
                </div>

                <div className="site-header__right">
                    {auth ? (
                        <HeaderProfileDropdown
                            name={auth.fullName}
                            avatarUrl={auth.profilePicture}
                            menu={menu}
                            onLogout={handleLogout}
                        />
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
