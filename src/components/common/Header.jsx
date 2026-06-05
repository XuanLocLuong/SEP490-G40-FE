import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';

const Header = () => {
    const { auth, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div style={styles.header}>
            {auth ? (
                <>
                    <div>
                        <strong>{auth.username}</strong> ({auth.role})
                    </div>

                    <button onClick={handleLogout}>Logout</button>
                </>
            ) : (
                <>
                    <div>Guest</div>

                    <div>
                        <button
                            onClick={() => navigate('/login')}
                            style={{ marginRight: '10px' }}
                        >
                            Login
                        </button>

                        <button
                            onClick={() => navigate('/register')}
                        >
                            Register
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

const styles = {
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '12px 20px',
        background: '#eee'
    }
};

export default Header;