import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { login as LoginApi, loginWithGoogle } from '../../apis/AuthApi.jsx';
import { useAuth } from '../../contexts/authContext.js';
import { getHomePathByRole, ROUTES } from '../../routes/path.js';
import { USER_ROLES } from '../../utils/Constants.jsx';
import { consumeBookmarkReturnPath } from '../../utils/bookmarkStorage.js';
import AuthCard from '../../components/common/AuthCard.jsx';
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon } from '../../components/common/icons.jsx';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const resolvePostLoginPath = (role, locationState) => {
    const saved = consumeBookmarkReturnPath();
    if (saved && saved.startsWith('/')) return saved;

    const from = locationState?.from;
    if (typeof from === 'string' && from.startsWith('/')) return from;
    if (from?.pathname) {
        return `${from.pathname}${from.search || ''}`;
    }

    return getHomePathByRole(role);
};

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [googleRole, setGoogleRole] = useState(USER_ROLES.CANDIDATE);
    const [error, setError] = useState('');

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await LoginApi({ email, password });
            const authData = res.data.data;
            login(authData);
            navigate(resolvePostLoginPath(authData.role, location.state), { replace: true });
        } catch (err) {
            setError('Đăng nhập thất bại. Vui lòng kiểm tra lại email/mật khẩu.');
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setError('');
        try {
            const res = await loginWithGoogle({
                idToken: credentialResponse.credential,
                role: googleRole,
            });
            const authData = res.data.data;
            login(authData);
            navigate(resolvePostLoginPath(authData.role, location.state), { replace: true });
        } catch (err) {
            setError('Đăng nhập bằng Google thất bại. Vui lòng thử lại.');
        }
    };

    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <AuthCard title="Chào mừng trở lại 👋">
                {error && <div className="auth-card__error">{error}</div>}

                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Đăng nhập Google bị huỷ hoặc thất bại.')}
                />

                {/* Role chỉ áp dụng nếu Google account đăng nhập lần đầu (BE tự tạo mới) */}
                <div style={{ margin: '10px 0 4px', fontSize: 13 }}>
                    <label style={{ marginRight: 16 }}>
                        <input
                            type="radio"
                            checked={googleRole === USER_ROLES.CANDIDATE}
                            onChange={() => setGoogleRole(USER_ROLES.CANDIDATE)}
                        />{' '}
                        Ứng viên
                    </label>
                    <label>
                        <input
                            type="radio"
                            checked={googleRole === USER_ROLES.RECRUITER}
                            onChange={() => setGoogleRole(USER_ROLES.RECRUITER)}
                        />{' '}
                        Nhà tuyển dụng
                    </label>
                </div>

                <div className="auth-divider">HOẶC</div>

                <form onSubmit={handleSubmit}>
                    <div className="form-field">
                        <label className="form-field__label">Email</label>
                        <div className="form-field__input-wrap">
                            <MailIcon className="form-field__icon" />
                            <input
                                className="form-field__input"
                                type="email"
                                placeholder="nhap@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-field">
                        <label className="form-field__label">
                            Mật khẩu
                            <button
                                type="button"
                                className="form-field__link"
                                onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
                            >
                                Quên mật khẩu?
                            </button>
                        </label>
                        <div className="form-field__input-wrap">
                            <LockIcon className="form-field__icon" />
                            <input
                                className="form-field__input"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Nhập mật khẩu"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="form-field__toggle"
                                onClick={() => setShowPassword((v) => !v)}
                                aria-label="Hiện/ẩn mật khẩu"
                            >
                                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn btn--primary btn--block">
                        Đăng nhập
                    </button>
                </form>

                <div className="auth-card__footer">
                    Chưa có tài khoản?{' '}
                    <button className="auth-card__footer-link" onClick={() => navigate(ROUTES.REGISTER)}>
                        Đăng ký ngay
                    </button>
                </div>
            </AuthCard>
        </GoogleOAuthProvider>
    );
};

export default Login;
