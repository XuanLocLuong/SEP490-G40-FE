import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register as RegisterApi } from '../../apis/AuthApi.jsx';
import { useAuth } from '../../contexts/authContext.js';
import { getHomePathByRole, ROUTES } from '../../routes/path.js';
import { USER_ROLES } from '../../utils/Constants.jsx';
import { Button } from 'react-bootstrap';

// Backend (RegisterRequestDTO) CHỈ nhận { email, password, role }.
// - Không có username/fullName/phone ở bước đăng ký — fullName tạm = email
//   phía BE, user cập nhật sau ở trang Profile (chưa có API, xem reference).
// - role bắt buộc và chỉ được CANDIDATE hoặc RECRUITER khi tự đăng ký công khai
//   (AuthService.parsePublicRole ném lỗi với role khác).
const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState(USER_ROLES.CANDIDATE);
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

        try {
            const res = await RegisterApi({ email, password, role });
            const authData = res.data.data;
            login(authData);
            navigate(getHomePathByRole(authData.role));
        } catch (err) {
            const message = err.response?.data?.message;
            setError(message || 'Đăng ký thất bại. Vui lòng thử lại.');
        }
    };

    return (
        <div>
            <Button onClick={() => navigate(ROUTES.LANDING)}>Home</Button>
            <h2>Register</h2>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <br />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <br />

                <input
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
                <br />

                <div>
                    <label>
                        <input
                            type="radio"
                            value={USER_ROLES.CANDIDATE}
                            checked={role === USER_ROLES.CANDIDATE}
                            onChange={(e) => setRole(e.target.value)}
                        />
                        {' '}Ứng viên (Candidate)
                    </label>
                    {'  '}
                    <label>
                        <input
                            type="radio"
                            value={USER_ROLES.RECRUITER}
                            checked={role === USER_ROLES.RECRUITER}
                            onChange={(e) => setRole(e.target.value)}
                        />
                        {' '}Nhà tuyển dụng (Recruiter)
                    </label>
                </div>
                <br />

                <button type="submit">Register</button>
            </form>

            <p>
                Already have an account?{' '}
                <button onClick={() => navigate(ROUTES.LOGIN)}>Login</button>
            </p>
        </div>
    );
};

export default Register;
