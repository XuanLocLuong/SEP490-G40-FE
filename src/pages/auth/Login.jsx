import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as LoginApi, loginWithGoogle } from '../../apis/AuthApi.jsx';
import { useAuth } from '../../contexts/authContext.js';
import { ROLE_ADMIN, ROLE_STAFF } from '../../utils/Constants.jsx';
import { Button } from 'react-bootstrap';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [googleRole, setGoogleRole] = useState('CANDIDATE');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const redirectByRole = (role) => {
        if (role === ROLE_ADMIN || role === 'ADMIN') navigate('/admin');
        else if (role === ROLE_STAFF || role === 'POST_MANAGER' || role === 'MANUAL_CHECK_TEAM') navigate('/staff');
        else navigate('/member');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await LoginApi({ email, password });
            login(res.data.data);
            redirectByRole(res.data.data.role);
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
            login(res.data.data);
            redirectByRole(res.data.data.role);
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
                <Button onClick={() => navigate('/')}>Home</Button>
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

                {/* Chọn role trước khi đăng nhập Google (chỉ dùng lần đầu tạo tài khoản) */}
                <div>
                    <p>Đăng nhập bằng Google với vai trò:</p>
                    <label>
                        <input
                            type="radio"
                            value="CANDIDATE"
                            checked={googleRole === 'CANDIDATE'}
                            onChange={(e) => setGoogleRole(e.target.value)}
                        />
                        {' '}Ứng viên (Candidate)
                    </label>
                    {'  '}
                    <label>
                        <input
                            type="radio"
                            value="RECRUITER"
                            checked={googleRole === 'RECRUITER'}
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
                    <button onClick={() => navigate('/register')}>Register</button>
                </p>
            </div>
        </GoogleOAuthProvider>
    );
};

export default Login;
