import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register as RegisterApi } from '../../apis/AuthApi.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import {Button} from "react-bootstrap";

const Register = () => {
    const [form, setForm] = useState({
        username: '',
        password: '',
        fullName: '',
        email: '',
        phone: ''
    });

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await RegisterApi(form);
            // backend trả token + role => login luôn
            login(res.data);
            navigate('/');
        } catch (err) {
            alert('Register failed', err);
        }
    };

    return (
        <div>
            <Button onClick={() => navigate("/")}>Home</Button>
            <h2>Register</h2>

            <form onSubmit={handleSubmit}>
                <input
                    name="username"
                    placeholder="Username"
                    onChange={handleChange}
                    required
                />
                <br />

                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    onChange={handleChange}
                    required
                />
                <br />

                <input
                    name="fullName"
                    placeholder="Full Name"
                    onChange={handleChange}
                    required
                />
                <br />

                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    onChange={handleChange}
                    required
                />
                <br />

                <input
                    name="phone"
                    placeholder="Phone (optional)"
                    onChange={handleChange}
                />
                <br />

                <button type="submit">Register</button>
            </form>

            <p>
                Already have an account?{' '}
                <button onClick={() => navigate('/login')}>
                    Login
                </button>
            </p>
        </div>
    );
};

export default Register;