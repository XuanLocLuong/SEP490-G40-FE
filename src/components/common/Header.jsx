import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/authContext.js';
import { ROUTES } from '../../routes/path.js';
import '../../assets/styles/HeaderStyle.css';

// Header dùng cho GuestLayout. Nội dung link "Việc làm / Công ty" chỉ là
// placeholder điều hướng — trang đích (Landing Page) KHÔNG thuộc task này,
// để nguyên link trỏ về "/" cho tới khi task Landing Page được code.
const Header = () => {
    const { auth, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate(ROUTES.LOGIN);
    };

    return (
        <header className="site-header">
            <div className="site-header__inner">
                <div className="site-header__left">
                    <NavLink to={ROUTES.LANDING} className="site-header__logo">
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
