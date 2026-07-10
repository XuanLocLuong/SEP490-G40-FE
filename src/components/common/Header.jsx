import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/authContext.js';
import { ROUTES } from '../../routes/path.js';

const Header = () => {
    const { auth, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate(ROUTES.LOGIN);
    };

    return (
        <div style={styles.header}>
            {auth ? (
                <>
                    <div>
                        {/* Backend chỉ trả fullName, không có username */}
                        <strong>{auth.fullName}</strong> ({auth.role})
                    </div>

                    <button onClick={handleLogout}>Logout</button>
                </>
            ) : (
                <>
                    <div>Guest</div>

                    <div>
                        <button
                            onClick={() => navigate(ROUTES.LOGIN)}
                            style={{ marginRight: '10px' }}
                        >
                            Login
                        </button>

                        <button onClick={() => navigate(ROUTES.REGISTER)}>
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
