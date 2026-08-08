import { Link } from 'react-router-dom';
import { SettingsIcon } from './icons.jsx';
import { useAuth } from '../../contexts/authContext.js';
import { getSettingsPathByRole } from '../../routes/path.js';
import '../../assets/styles/InternalTopbarStyle.css';

// Topbar cho InternalLayout (Admin / Post Manager / Manual Check Team).
// Role nội bộ không dùng chuông thông báo — chỉ giữ Cài đặt → UC-07 / đổi mật khẩu.
const InternalTopbar = () => {
    const { auth } = useAuth();
    const settingsPath = getSettingsPathByRole(auth?.role);

    return (
        <header className="internal-topbar">
            <div className="internal-topbar__actions">
                <Link
                    to={settingsPath}
                    className="internal-topbar__icon-btn"
                    aria-label="Cài đặt tài khoản"
                    title="Cài đặt tài khoản"
                >
                    <SettingsIcon />
                </Link>
            </div>
        </header>
    );
};

export default InternalTopbar;
