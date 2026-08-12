import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { toast } from 'react-toastify';
import {
    register as RegisterApi,
    loginWithGoogle,
    resendVerificationEmail,
} from '../../apis/AuthApi.jsx';
import { useAuth } from '../../contexts/authContext.js';
import { getHomePathByRole, ROUTES } from '../../routes/path.js';
import { USER_ROLES } from '../../utils/Constants.jsx';
import AuthCard from '../../components/common/AuthCard.jsx';
import { getAuthErrorMessage } from '../../utils/authErrorMessages.js';
import {
    MailIcon,
    LockIcon,
    EyeIcon,
    EyeOffIcon,
    GraduationCapIcon,
    BuildingIcon,
    CheckCircleIcon,
    UserCircleIcon,
    PhoneIcon,
} from '../../components/common/icons.jsx';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const AUTO_REDIRECT_SECONDS = 10;

// Backend (RegisterRequestDTO) nhận { email, fullName, phone, password, role }.
// role bắt buộc, chỉ nhận CANDIDATE/RECRUITER khi tự đăng ký công khai.
// Giờ chỉ cần đúng 10 số: 0 + 9 số bất kỳ, hoặc +84 + 9 số bất kỳ.
const PHONE_REGEX = /^(\+84|0)\d{9}$/;

const Register = () => {
    const [role, setRole] = useState(USER_ROLES.CANDIDATE);
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [result, setResult] = useState(null); // { homePath, needsEmailVerification, email, isNewAccount }
    const [secondsLeft, setSecondsLeft] = useState(AUTO_REDIRECT_SECONDS);
    const [resending, setResending] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    const { login, auth, logout } = useAuth();
    const navigate = useNavigate();

    // Clear session rồi vào /login — tránh GuestOnlyRoute đá về home role.
    const goToLogin = async () => {
        if (auth) {
            await logout();
        }
        navigate(ROUTES.LOGIN, { replace: true });
    };

    // Đã login mà mở /register (không phải vừa xong form) → về home role.
    useEffect(() => {
        if (auth && !result) {
            navigate(getHomePathByRole(auth.role), { replace: true });
        }
    }, [auth, result, navigate]);

    const buildAuthResult = (authData, fallbackEmail = '', { fromGoogle = false } = {}) => {
        const isNewAccount = Boolean(authData.newAccount);
        // Google: chỉ bắt verify khi BE ghi rõ emailVerified === false.
        // Email/password: mọi lần đăng ký mà email chưa verified đều hiện màn kiểm tra email
        // (không phụ thuộc field newAccount — BE có thể bỏ/đổi tên field).
        const needsEmailVerification = fromGoogle
            ? isNewAccount && authData.emailVerified === false
            : authData.emailVerified !== true;

        return {
            homePath: getHomePathByRole(authData.role),
            isNewAccount,
            needsEmailVerification,
            email: authData.email || fallbackEmail || '',
        };
    };


    useEffect(() => {
        if (!result || result.needsEmailVerification) return;

        if (secondsLeft <= 0) {
            navigate(result.homePath);
            return;
        }

        const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
        return () => clearTimeout(timer);
    }, [result, secondsLeft, navigate]);

    useEffect(() => {
        if (resendCooldown <= 0) return undefined;
        const timer = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    const handleResendVerification = async () => {
        if (resending || resendCooldown > 0) return;
        setResending(true);
        setError('');
        try {
            await resendVerificationEmail();
            toast.success('Đã gửi lại email xác thực. Kiểm tra hộp thư (kể cả Spam) — liên kết khoảng 24 giờ.');
            setResendCooldown(60);
        } catch (err) {
            const code = err?.response?.data?.message || err?.response?.data?.code;
            if (code === 'EMAIL_ALREADY_VERIFIED') {
                toast.info('Email đã được xác thực. Bạn có thể đăng nhập.');
                navigate(ROUTES.LOGIN);
                return;
            }
            setError(getAuthErrorMessage(err));
            toast.error(getAuthErrorMessage(err));
        } finally {
            setResending(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }

        if (!PHONE_REGEX.test(phone.trim())) {
            setError('Số điện thoại không hợp lệ (VD: 0912345678 hoặc +84912345678).');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await RegisterApi({
                email,
                password,
                role,
                fullName: fullName.trim(),
                phone: phone.trim(),
            });
            const authData = res.data.data;
            login(authData);
            setResult(buildAuthResult(authData, email));
        } catch (err) {
            setError(getAuthErrorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setError('');
        try {
            const res = await loginWithGoogle({ idToken: credentialResponse.credential, role });
            const authData = res.data.data;
            login(authData);
            setResult(buildAuthResult(authData, authData.email || '', { fromGoogle: true }));
        } catch (err) {
            setError(getAuthErrorMessage(err));
        }
    };

    if (result) {
        // Chỉ bắt xác thực email khi cần (password chưa verify). Google thường bỏ qua.
        if (result.needsEmailVerification) {
            return (
                <AuthCard
                    title="Kiểm tra email của bạn"
                    subtitle="Chỉ còn 1 bước nữa thôi!"
                    guestBack
                >
                    {error ? <div className="auth-card__error">{error}</div> : null}
                    <p className="auth-card__notice">
                        Chúng tôi đã gửi email xác thực tới{' '}
                        <strong>{result.email || 'địa chỉ email của bạn'}</strong>.
                        Vui lòng mở hộp thư (kể cả mục Spam) và bấm vào liên kết xác thực
                        để hoàn tất đăng ký trước khi tiếp tục sử dụng JobLink.
                    </p>

                    <button
                        type="button"
                        className="btn btn--primary btn--block"
                        onClick={handleResendVerification}
                        disabled={resending || resendCooldown > 0}
                    >
                        {resending
                            ? 'Đang gửi lại...'
                            : resendCooldown > 0
                              ? `Gửi lại sau ${resendCooldown}s`
                              : 'Gửi lại email xác thực'}
                    </button>

                    <div className="auth-card__footer">
                        Đã xác thực xong?{' '}
                        <button type="button" className="auth-card__footer-link" onClick={goToLogin}>
                            Quay lại đăng nhập
                        </button>
                    </div>
                </AuthCard>
            );
        }


        // Google / tài khoản đã verified — cho vào app luôn.
        return (
            <AuthCard
                title={result.isNewAccount ? 'Đăng ký thành công' : 'Tài khoản đã tồn tại'}
                subtitle={
                    result.isNewAccount
                        ? 'Email của bạn đã được xác thực. Bạn có thể bắt đầu sử dụng JobLink.'
                        : 'Bạn đã từng đăng ký tài khoản này trước đó — mình đăng nhập luôn cho bạn.'
                }
            >
                <button
                    className="btn btn--primary btn--block"
                    onClick={() => navigate(result.homePath)}
                >
                    Đến trang chủ
                </button>
                <div className="auth-card__footer">
                    Tự động chuyển sau {secondsLeft}s...
                </div>
            </AuthCard>
        );
    }

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
                        <label className="form-field__label">Họ và tên</label>
                        <div className="form-field__input-wrap">
                            <UserCircleIcon className="form-field__icon" />
                            <input
                                className="form-field__input"
                                type="text"
                                placeholder="Nhập họ và tên"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-field">
                        <label className="form-field__label">Số điện thoại</label>
                        <div className="form-field__input-wrap">
                            <PhoneIcon className="form-field__icon" />
                            <input
                                className="form-field__input"
                                type="tel"
                                placeholder="VD: 0912345678"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                            />
                        </div>
                    </div>

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
                                minLength={6}
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
                                minLength={6}
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

                    <button type="submit" className="btn btn--primary btn--block" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <span className="btn-spinner" aria-hidden="true" />
                                Đang tạo tài khoản...
                            </>
                        ) : (
                            'Tạo tài khoản'
                        )}
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