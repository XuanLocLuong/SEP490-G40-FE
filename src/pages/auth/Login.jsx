import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as LoginApi } from '../../apis/AuthApi.jsx' ;
import { useAuth } from '../../contexts/authContext.js';
import {ROLE_ADMIN, ROLE_STAFF} from "../../utils/Constants.jsx";
import {Button} from "react-bootstrap";

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await LoginApi({ username, password });
            console.log("Thông tin đăng nhập được trả về:", res);
            login(res.data.data);
            if (res.data.data.role === ROLE_ADMIN) {
                navigate('/admin');
            }
            else if (res.data.data.role === ROLE_STAFF) {
                navigate('/staff');
            }
            else {
                navigate('/member');
            }
        } catch (err) {
            alert('Login failed', err);
        }
    };

    return (
        <div>
            <Button onClick={() => navigate("/")}>Home</Button>
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <input
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
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
            <p>
                Don’t have an account?{' '}
                <button onClick={() => navigate('/register')}>
                    Register
                </button>
            </p>

        </div>
    );
};

export default Login;
