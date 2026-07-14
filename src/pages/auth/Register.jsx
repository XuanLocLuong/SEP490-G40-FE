import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { register as RegisterApi, loginWithGoogle } from '../../apis/AuthApi.jsx';
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

    const [result, setResult] = useState(null); // { homePath, isNewAccount }
    const [secondsLeft, setSecondsLeft] = useState(AUTO_REDIRECT_SECONDS);

    const { login } = useAuth();
    const navigate = useNavigate();


    useEffect(() => {
        if (!result || result.isNewAccount) return; // tài khoản mới: không auto-chuyển, chờ xác thực email

        if (secondsLeft <= 0) {
            navigate(result.homePath);
            return;
        }

        const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
        return () => clearTimeout(timer);
    }, [result, secondsLeft, navigate]);

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
            setResult({ homePath: getHomePathByRole(authData.role), isNewAccount: authData.newAccount });
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
            setResult({ homePath: getHomePathByRole(authData.role), isNewAccount: authData.newAccount });
        } catch (err) {
            setError(getAuthErrorMessage(err));
        }
    };

    if (result) {
        const isNew = result.isNewAccount;

        // Tài khoản mới: BẮT BUỘC xác thực email trước, không cho chuyển trang
        // chủ ngay — không có nút/đếm ngược tự chuyển ở màn này nữa.
        if (isNew) {
            return (
                <AuthCard title="Kiểm tra email của bạn 📩" subtitle="Chỉ còn 1 bước nữa thôi!">
                    <p className="auth-card__notice">
                        Chúng tôi đã gửi email xác thực tới <strong>{email}</strong>.
                        Vui lòng mở hộp thư (kể cả mục Spam) và bấm vào liên kết xác thực
                        để hoàn tất đăng ký trước khi tiếp tục sử dụng JobLink.
                    </p>

                    <div className="auth-card__footer">
                        Đã xác thực xong?{' '}
                        <button className="auth-card__footer-link" onClick={() => navigate(ROUTES.LOGIN)}>
                            Quay lại đăng nhập
                        </button>
                    </div>
                </AuthCard>
            );
        }


        // Tài khoản đã tồn tại từ trước (VD Google login trùng tài khoản) — email
        // đã verified sẵn rồi nên cho chuyển trang chủ bình thường.
        return (
            <AuthCard title="Tài khoản đã tồn tại" subtitle="Bạn đã từng đăng ký tài khoản này trước đó — mình đăng nhập luôn cho bạn.">
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