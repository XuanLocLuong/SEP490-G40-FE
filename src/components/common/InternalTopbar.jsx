import { BellIcon, SettingsIcon } from './icons.jsx';
import '../../assets/styles/InternalTopbarStyle.css';

// Topbar dùng cho InternalLayout (Admin/Post Manager/Manual Check Team).
// hasNotification: true -> chấm đỏ trên icon chuông (ảnh 6/7 đều có báo có
// việc chờ xử lý).
const InternalTopbar = ({ hasNotification = false }) => {
    return (
        <header className="internal-topbar">
            <div className="internal-topbar__actions">
                <button className="internal-topbar__icon-btn" aria-label="Thông báo">
                    <BellIcon />
                    {hasNotification && <span className="internal-topbar__dot" />}
                </button>
                <button className="internal-topbar__icon-btn" aria-label="Cài đặt">
                    <SettingsIcon />
                </button>
            </div>
        </header>
    );
};

export default InternalTopbar;
