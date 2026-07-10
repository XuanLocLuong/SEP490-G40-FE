import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { register as RegisterApi, loginWithGoogle } from '../../apis/AuthApi.jsx';
import { useAuth } from '../../contexts/authContext.js';
import { getHomePathByRole, ROUTES } from '../../routes/path.js';
import { USER_ROLES } from '../../utils/Constants.jsx';
import AuthCard from '../../components/common/AuthCard.jsx';
import {
    MailIcon,
    LockIcon,
    EyeIcon,
    EyeOffIcon,
    GraduationCapIcon,
    BuildingIcon,
    CheckCircleIcon,
} from '../../components/common/icons.jsx';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Backend (RegisterRequestDTO) CHỈ nhận { email, password, role }.
// role bắt buộc, chỉ nhận CANDIDATE/RECRUITER khi tự đăng ký công khai.
const Register = () => {
    const [role, setRole] = useState(USER_ROLES.CANDIDATE);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [error, setError] = useState('');

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }
        if (!agreed) {
            setError('Bạn cần đồng ý với Điều khoản sử dụng và Chính sách bảo mật.');
            return;
        }

        try {
            const res = await RegisterApi({ email, password, role });
            const authData = res.data.data;
            login(authData);
            navigate(getHomePathByRole(authData.role));
        } catch (err) {
            setError(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setError('');
        try {
            const res = await loginWithGoogle({ idToken: credentialResponse.credential, role });
            const authData = res.data.data;
            login(authData);
            navigate(getHomePathByRole(authData.role));
        } catch (err) {
            setError('Đăng ký bằng Google thất bại. Vui lòng thử lại.');
        }
    };

    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <AuthCard
                title="Bạn là ai?"
                subtitle="Chọn vai trò để bắt đầu trải nghiệm"
            >
                {error && <div className="auth-card__error">{error}</div>}

                <div className="role-select">
                    <button
                        type="button"
                        className={'role-card' + (role === USER_ROLES.CANDIDATE ? ' role-card--active' : '')}
                        onClick={() => setRole(USER_ROLES.CANDIDATE)}
                    >
                        {role === USER_ROLES.CANDIDATE && (
                            <CheckCircleIcon className="role-card__check" />
                        )}
                        <GraduationCapIcon className="role-card__icon" />
                        <div className="role-card__title">Ứng viên</div>
                        <div className="role-card__desc">
                            Tìm việc part-time phù hợp với lịch trình hàng ngày
                        </div>
                    </button>

                    <button
                        type="button"
                        className={'role-card' + (role === USER_ROLES.RECRUITER ? ' role-card--active' : '')}
                        onClick={() => setRole(USER_ROLES.RECRUITER)}
                    >
                        {role === USER_ROLES.RECRUITER && (
                            <CheckCircleIcon className="role-card__check" />
                        )}
                        <BuildingIcon className="role-card__icon" />
                        <div className="role-card__title">Nhà tuyển dụng</div>
                        <div className="role-card__desc">
                            Đăng tin và tìm nhân viên nhanh chóng
                        </div>
                    </button>
                </div>

                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Đăng ký Google bị huỷ hoặc thất bại.')}
                />

                <div className="auth-divider">HOẶC</div>

                <form onSubmit={handleSubmit}>
                    <div className="form-field">
                        <label className="form-field__label">Email</label>
                        <div className="form-field__input-wrap">
                            <MailIcon className="form-field__icon" />
                            <input
                                className="form-field__input"
                                type="email"
                                placeholder="Nhập email của bạn"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-field">
                        <label className="form-field__label">Mật khẩu</label>
                        <div className="form-field__input-wrap">
                            <LockIcon className="form-field__icon" />
                            <input
                                className="form-field__input"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Tạo mật khẩu"
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

                    <div className="form-field">
                        <label className="form-field__label">Xác nhận mật khẩu</label>
                        <div className="form-field__input-wrap">
                            <LockIcon className="form-field__icon" />
                            <input
                                className="form-field__input"
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="Nhập lại mật khẩu"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="form-field__toggle"
                                onClick={() => setShowConfirmPassword((v) => !v)}
                                aria-label="Hiện/ẩn mật khẩu"
                            >
                                {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                        </div>
                    </div>

                    <label className="form-checkbox">
                        <input
                            type="checkbox"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                        />
                        <span>
                            Tôi đồng ý với <a href="#">Điều khoản sử dụng</a> và{' '}
                            <a href="#">Chính sách bảo mật</a> của JobLink.
                        </span>
                    </label>

                    <button type="submit" className="btn btn--primary btn--block">
                        Tạo tài khoản
                    </button>
                </form>

                <div className="auth-card__footer">
                    Đã có tài khoản?{' '}
                    <button className="auth-card__footer-link" onClick={() => navigate(ROUTES.LOGIN)}>
                        Đăng nhập
                    </button>
                </div>
            </AuthCard>
        </GoogleOAuthProvider>
    );
};

export default Register;
