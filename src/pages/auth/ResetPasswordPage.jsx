import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../../apis/AuthApi.jsx';
import AuthCard from '../../components/common/AuthCard.jsx';
import { LockIcon, EyeIcon, EyeOffIcon } from '../../components/common/icons.jsx';
import { ROUTES } from '../../routes/path.js';

const MIN_PASSWORD_LENGTH = 6;

const ResetPasswordPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = useMemo(() => searchParams.get('token')?.trim() || '', [searchParams]);

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password.length < MIN_PASSWORD_LENGTH) {
            setError(`Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`);
            return;
        }
        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }

        setLoading(true);
        try {
            await resetPassword({ token, newPassword: password });
            setSuccess(true);
        } catch (err) {
            const code = err?.response?.data?.message || err?.response?.data?.error;
            if (
                code === 'INVALID_PASSWORD_RESET_TOKEN' ||
                err?.response?.status === 400
            ) {
                setError('Liên kết không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu lại.');
            } else {
                setError('Không đặt lại được mật khẩu. Vui lòng thử lại.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <AuthCard
                title="Liên kết không hợp lệ"
                subtitle="Không tìm thấy mã đặt lại mật khẩu trong đường dẫn."
            >
                <button
                    type="button"
                    className="btn btn--primary btn--block"
                    onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
                >
                    Gửi lại liên kết
                </button>
                <div className="auth-card__footer">
                    <button
                        type="button"
                        className="auth-card__footer-link"
                        onClick={() => navigate(ROUTES.LOGIN)}
                    >
                        Về đăng nhập
                    </button>
                </div>
            </AuthCard>
        );
    }

    if (success) {
        return (
            <AuthCard
                title="Đặt lại mật khẩu thành công"
                subtitle="Bạn có thể đăng nhập bằng mật khẩu mới."
            >
                <button
                    type="button"
                    className="btn btn--primary btn--block"
                    onClick={() => navigate(ROUTES.LOGIN)}
                >
                    Đăng nhập ngay
                </button>
            </AuthCard>
        );
    }

    return (
        <AuthCard
            title="Tạo mật khẩu mới"
            subtitle="Nhập mật khẩu mới cho tài khoản của bạn."
        >
            {error && <div className="auth-card__error">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-field">
                    <label className="form-field__label" htmlFor="reset-password">
                        Mật khẩu mới
                    </label>
                    <div className="form-field__input-wrap">
                        <LockIcon className="form-field__icon" />
                        <input
                            id="reset-password"
                            className="form-field__input"
                            type={showPassword ? 'text' : 'password'}
                            placeholder={`Ít nhất ${MIN_PASSWORD_LENGTH} ký tự`}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="new-password"
                            minLength={MIN_PASSWORD_LENGTH}
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
                    <label className="form-field__label" htmlFor="reset-confirm">
                        Xác nhận mật khẩu
                    </label>
                    <div className="form-field__input-wrap">
                        <LockIcon className="form-field__icon" />
                        <input
                            id="reset-confirm"
                            className="form-field__input"
                            type={showConfirm ? 'text' : 'password'}
                            placeholder="Nhập lại mật khẩu mới"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            autoComplete="new-password"
                            minLength={MIN_PASSWORD_LENGTH}
                            required
                        />
                        <button
                            type="button"
                            className="form-field__toggle"
                            onClick={() => setShowConfirm((v) => !v)}
                            aria-label="Hiện/ẩn mật khẩu xác nhận"
                        >
                            {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    className="btn btn--primary btn--block"
                    disabled={loading}
                >
                    {loading ? 'Đang lưu...' : 'Đặt lại mật khẩu'}
                </button>
            </form>

            <div className="auth-card__footer">
                Liên kết hết hạn?{' '}
                <button
                    type="button"
                    className="auth-card__footer-link"
                    onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
                >
                    Gửi lại email
                </button>
            </div>
        </AuthCard>
    );
};

export default ResetPasswordPage;
