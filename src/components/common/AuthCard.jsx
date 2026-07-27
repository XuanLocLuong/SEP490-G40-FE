import { Link } from 'react-router-dom';
import { ROUTES } from '../../routes/path.js';
import '../../assets/styles/AuthCardStyles.css';

// Khung dùng chung cho Login & Register — logo + tiêu đề + nội dung form.
const AuthCard = ({ title, subtitle, children }) => {
    return (
        <div className="auth-page">
            <div className="auth-card">
                <Link to={ROUTES.LANDING} className="auth-card__back">
                    ← Về trang chủ
                </Link>
                <Link to={ROUTES.LANDING} className="auth-card__logo" aria-label="Về trang chủ JobLink">
                    JOBLINK
                </Link>
                {title && <h1 className="auth-card__title">{title}</h1>}
                {subtitle && <p className="auth-card__subtitle">{subtitle}</p>}
                {children}
            </div>
        </div>
    );
};

export default AuthCard;
