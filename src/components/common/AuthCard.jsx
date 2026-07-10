import '../../assets/styles/AuthCardStyles.css';

// Khung dùng chung cho Login & Register — logo + tiêu đề + nội dung form.
const AuthCard = ({ title, subtitle, children }) => {
    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-card__logo">JOBLINK</div>
                {title && <h1 className="auth-card__title">{title}</h1>}
                {subtitle && <p className="auth-card__subtitle">{subtitle}</p>}
                {children}
            </div>
        </div>
    );
};

export default AuthCard;
