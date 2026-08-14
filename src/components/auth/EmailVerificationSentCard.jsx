import AuthCard from '../common/AuthCard.jsx';

const EmailVerificationSentCard = ({
    email,
    error,
    onGoToLogin,
    onResend,
    resending = false,
    resendCooldown = 0,
}) => (
    <AuthCard title="Kiểm tra email của bạn" subtitle="Chỉ còn 1 bước nữa thôi!" guestBack>
        {error ? <div className="auth-card__error">{error}</div> : null}
        <p className="auth-card__notice">
            Chúng tôi đã gửi email xác thực tới{' '}
            <strong>{email || 'địa chỉ email của bạn'}</strong>.
            Vui lòng mở hộp thư (kể cả mục Spam) và bấm vào liên kết xác thực
            để hoàn tất đăng ký trước khi tiếp tục sử dụng JobLink.
        </p>

        {onResend ? (
            <button
                type="button"
                className="btn btn--primary btn--block"
                onClick={onResend}
                disabled={resending || resendCooldown > 0}
            >
                {resending
                    ? 'Đang gửi lại...'
                    : resendCooldown > 0
                      ? `Gửi lại sau ${resendCooldown}s`
                      : 'Gửi lại email xác thực'}
            </button>
        ) : null}

        <div className="auth-card__footer">
            Đã xác thực xong?{' '}
            <button type="button" className="auth-card__footer-link" onClick={onGoToLogin}>
                Quay lại đăng nhập
            </button>
        </div>
    </AuthCard>
);

export default EmailVerificationSentCard;
