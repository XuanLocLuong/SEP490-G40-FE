import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axiosClient, { API_PREFIX } from '../../apis/AxiosClient.jsx';
import AuthCard from '../../components/common/AuthCard.jsx';
import { useAuth } from '../../contexts/authContext.js';
import { ROUTES } from '../../routes/path.js';

// Trang này người dùng bấm vào từ email xác thực. Thay vì tự verify ngay khi
// vừa load trang, bắt người dùng bấm nút "Xác thực tài khoản" chủ động —
// xong thì tự đóng (chuyển về trang chủ) sau vài giây.
const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('idle'); // idle | verifying | success | error
    const navigate = useNavigate();
    const { auth, logout } = useAuth();
    const token = searchParams.get('token');

    // Clear session rồi vào /login — tránh GuestOnlyRoute đá về home role.
    const goToLogin = async () => {
        if (auth) {
            await logout();
        }
        navigate(ROUTES.LOGIN, { replace: true });
    };

    const handleVerify = async () => {
        if (!token) return;
        setStatus('verifying');
        try {
            await axiosClient.get(`${API_PREFIX}/auth/verify-email`, { params: { token } });
            setStatus('success');
        } catch {
            setStatus('error');
        }
    };

    if (!token) {
        return (
            <AuthCard
                title="Liên kết không hợp lệ"
                subtitle="Không tìm thấy mã xác thực trong đường dẫn."
                guestBack
            >
                <button type="button" className="btn btn--primary btn--block" onClick={goToLogin}>
                    Về trang đăng nhập
                </button>
            </AuthCard>
        );
    }

    if (status === 'success') {
        return (
            <AuthCard
                title="🎉 Xác thực email thành công"
                subtitle="Tài khoản của bạn đã được kích hoạt thành công."
                guestBack
            >
                <div
                    style={{
                        textAlign: 'center',
                        marginBottom: '20px',
                        color: '#666',
                        lineHeight: 1.6,
                    }}
                >
                    Vui lòng quay trở lại trang đăng nhập để đăng nhập vào hệ thống.
                    <br />
                    Bạn có thể đóng tab này nếu không còn sử dụng.
                </div>

                <button type="button" className="btn btn--primary btn--block" onClick={goToLogin}>
                    Quay về đăng nhập
                </button>
            </AuthCard>
        );
    }

    if (status === 'error') {
        return (
            <AuthCard
                title="Xác thực thất bại"
                subtitle="Liên kết không hợp lệ hoặc đã hết hạn (24 giờ)."
                guestBack
            >
                <button type="button" className="btn btn--primary btn--block" onClick={goToLogin}>
                    Về trang đăng nhập
                </button>
            </AuthCard>
        );
    }

    return (
        <AuthCard
            title="Xác thực tài khoản"
            subtitle="Bấm nút bên dưới để hoàn tất xác thực email của bạn."
            guestBack
        >
            <button
                type="button"
                className="btn btn--primary btn--block"
                onClick={handleVerify}
                disabled={status === 'verifying'}
            >
                {status === 'verifying' ? 'Đang xác thực...' : 'Xác thực tài khoản'}
            </button>
        </AuthCard>
    );
};

export default VerifyEmail;
