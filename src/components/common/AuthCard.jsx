import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/authContext.js';
import { ROUTES, getHomePathByRole } from '../../routes/path.js';
import '../../assets/styles/AuthCardStyles.css';

// Khung dùng chung cho Login & Register — logo + tiêu đề + nội dung form.
// guestBack: màn verify/check-email — clear session rồi về Landing guest (không về home role).
const AuthCard = ({ title, subtitle, children, guestBack = false }) => {
    const { auth, logout } = useAuth();
    const navigate = useNavigate();
    const homePath = auth?.role ? getHomePathByRole(auth.role) : ROUTES.LANDING;

    const handleGuestBack = async (e) => {
        if (!guestBack) return;
        e.preventDefault();
        if (auth) {
            await logout();
        }
        navigate(ROUTES.LANDING, { replace: true });
    };

    const backProps = guestBack
        ? { href: ROUTES.LANDING, onClick: handleGuestBack }
        : { to: homePath };

    const BackTag = guestBack ? 'a' : Link;

    return (
        <div className="auth-page">
            <div className="auth-card">
                <BackTag {...backProps} className="auth-card__back">
                    ← Về trang chủ
                </BackTag>
                <BackTag {...backProps} className="auth-card__logo" aria-label="Về trang chủ JobLink">
                    JOBLINK
                </BackTag>
                {title && <h1 className="auth-card__title">{title}</h1>}
                {subtitle && <p className="auth-card__subtitle">{subtitle}</p>}
                {children}
            </div>
        </div>
    );
};

export default AuthCard;
