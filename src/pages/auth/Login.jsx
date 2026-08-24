import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { login as LoginApi, loginWithGoogle } from '../../apis/AuthApi.jsx';
import { useAuth } from '../../contexts/authContext.js';
import { ROUTES } from '../../routes/path.js';
import { USER_ROLES } from '../../utils/Constants.jsx';
import { resolvePostLoginPath } from '../../utils/authRedirect.js';
import {
    clearSessionExpiredFlag,
    peekSessionExpiredMessage,
} from '../../utils/sessionExpiredStorage.js';
import {
    clearEmailVerificationNotice,
    peekEmailVerificationNotice,
} from '../../utils/emailVerificationNoticeStorage.js';
import { getAuthErrorMessage } from '../../utils/authErrorMessages.js';
import AuthCard from '../../components/common/AuthCard.jsx';
import EmailVerificationSentCard from '../../components/auth/EmailVerificationSentCard.jsx';
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon } from '../../components/common/icons.jsx';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [googleRole, setGoogleRole] = useState(USER_ROLES.CANDIDATE);
    const [error, setError] = useState('');
    const [emailNotice, setEmailNotice] = useState(() => peekEmailVerificationNotice());

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const dismissEmailNotice = () => {
        clearEmailVerificationNotice();
        setEmailNotice(null);
    };

    useEffect(() => {
        const message = peekSessionExpiredMessage();
        if (!message) return undefined;

        setError(message);

        // Delay clear so React StrictMode remount vẫn còn flag để gắn lại lỗi trên form.
        const timer = window.setTimeout(() => clearSessionExpiredFlag(), 800);
        return () => window.clearTimeout(timer);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        clearSessionExpiredFlag();
        try {
            const res = await LoginApi({ email, password });
            const authData = res.data.data;
            login(authData);
            clearEmailVerificationNotice();
            navigate(resolvePostLoginPath(authData.role, location.state), { replace: true });
        } catch (err) {
            setError(getAuthErrorMessage(err, { loginFallback: true }));
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setError('');
        clearSessionExpiredFlag();
        try {
            const res = await loginWithGoogle({
                idToken: credentialResponse.credential,
                role: googleRole,
            });
            const authData = res.data.data;
            login(authData);
            clearEmailVerificationNotice();
            navigate(resolvePostLoginPath(authData.role, location.state), { replace: true });
        } catch (err) {
            setError(getAuthErrorMessage(err, { loginFallback: true }));
        }
    };

    if (emailNotice) {
        return (
            <EmailVerificationSentCard
                email={emailNotice.email}
                onGoToLogin={dismissEmailNotice}
            />
        );
    }

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
                                onClick={() =>
                                    navigate(ROUTES.FORGOT_PASSWORD, {
                                        state: location.state,
                                    })
                                }
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
