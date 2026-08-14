import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { forgotPassword } from '../../apis/AuthApi.jsx';
import AuthCard from '../../components/common/AuthCard.jsx';
import { MailIcon } from '../../components/common/icons.jsx';
import { ROUTES } from '../../routes/path.js';

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await forgotPassword({ email: email.trim() });
            setSubmitted(true);
        } catch {
            setError('Không gửi được yêu cầu. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <AuthCard
                title="Kiểm tra email của bạn"
                subtitle="Nếu địa chỉ email tồn tại trên hệ thống, chúng tôi đã gửi liên kết đặt lại mật khẩu. Liên kết có hiệu lực trong 1 giờ."
            >
                <button
                    type="button"
                    className="btn btn--primary btn--block"
                    onClick={() => navigate(ROUTES.LOGIN, { state: location.state })}
                >
                    Quay về đăng nhập
                </button>
            </AuthCard>
        );
    }

    return (
        <AuthCard
            title="Quên mật khẩu"
            subtitle="Nhập email đã đăng ký. Chúng tôi sẽ gửi liên kết để tạo mật khẩu mới."
        >
            {error && <div className="auth-card__error">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-field">
                    <label className="form-field__label" htmlFor="forgot-email">
                        Email
                    </label>
                    <div className="form-field__input-wrap">
                        <MailIcon className="form-field__icon" />
                        <input
                            id="forgot-email"
                            className="form-field__input"
                            type="email"
                            placeholder="nhap@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="btn btn--primary btn--block"
                    disabled={loading}
                >
                    {loading ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
                </button>
            </form>

            <div className="auth-card__footer">
                Nhớ mật khẩu rồi?{' '}
                <button
                    type="button"
                    className="auth-card__footer-link"
                    onClick={() => navigate(ROUTES.LOGIN, { state: location.state })}
                >
                    Đăng nhập
                </button>
            </div>
        </AuthCard>
    );
};

export default ForgotPasswordPage;
