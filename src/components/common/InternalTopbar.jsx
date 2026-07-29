import { SettingsIcon } from './icons.jsx';
import '../../assets/styles/InternalTopbarStyle.css';

// Topbar cho InternalLayout (Admin / Post Manager / Manual Check Team).
// Role nội bộ không dùng chuông thông báo — chỉ giữ Cài đặt.
const InternalTopbar = () => {
    return (
        <header className="internal-topbar">
            <div className="internal-topbar__actions">
                <button className="internal-topbar__icon-btn" aria-label="Cài đặt">
                    <SettingsIcon />
                </button>
            </div>
        </header>
    );
};

export default InternalTopbar;
