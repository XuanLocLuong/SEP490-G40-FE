import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as LoginApi, loginWithGoogle } from '../../apis/AuthApi.jsx';
import { useAuth } from '../../contexts/authContext.js';
import { getHomePathByRole, ROUTES } from '../../routes/path.js';
import { USER_ROLES } from '../../utils/Constants.jsx';
import { Button } from 'react-bootstrap';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [googleRole, setGoogleRole] = useState(USER_ROLES.CANDIDATE);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await LoginApi({ email, password });
            const authData = res.data.data;
            login(authData);
            navigate(getHomePathByRole(authData.role));
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
            navigate(getHomePathByRole(authData.role));
        } catch (err) {
            setError('Đăng nhập bằng Google thất bại. Vui lòng thử lại.');
        }
    };

    const handleGoogleError = () => {
        setError('Đăng nhập Google bị huỷ hoặc thất bại.');
    };

    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <div>
                <Button onClick={() => navigate(ROUTES.LANDING)}>Home</Button>
                <h2>Login</h2>

                {error && <p style={{ color: 'red' }}>{error}</p>}

                <form onSubmit={handleSubmit}>
                    <input
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <br />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <br />
                    <button type="submit">Login</button>
                </form>

                <hr />

                {/* Role chỉ dùng khi tài khoản Google chưa từng tồn tại (BE tự tạo mới) */}
                <div>
                    <p>Đăng nhập bằng Google với vai trò (chỉ áp dụng lần đầu tạo tài khoản):</p>
                    <label>
                        <input
                            type="radio"
                            value={USER_ROLES.CANDIDATE}
                            checked={googleRole === USER_ROLES.CANDIDATE}
                            onChange={(e) => setGoogleRole(e.target.value)}
                        />
                        {' '}Ứng viên (Candidate)
                    </label>
                    {'  '}
                    <label>
                        <input
                            type="radio"
                            value={USER_ROLES.RECRUITER}
                            checked={googleRole === USER_ROLES.RECRUITER}
                            onChange={(e) => setGoogleRole(e.target.value)}
                        />
                        {' '}Nhà tuyển dụng (Recruiter)
                    </label>
                </div>

                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                />

                <p>
                    Don't have an account?{' '}
                    <button onClick={() => navigate(ROUTES.REGISTER)}>Register</button>
                </p>
            </div>
        </GoogleOAuthProvider>
    );
};

export default Login;
