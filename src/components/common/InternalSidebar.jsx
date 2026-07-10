import { NavLink } from 'react-router-dom';
import { LogOutIcon } from './icons.jsx';
import '../../assets/styles/InternalSidebarStyle.css';

// Sidebar tối dùng chung cho 3 role nội bộ (ảnh 6, 7, 8).
// variant: 'dark' (Admin/Post Manager) | 'verification' (Manual Check Team,
// nền xanh nhạt hơn theo đúng ảnh 6) — chỉ khác màu nền, cấu trúc giống nhau.
//
// Lưu ý: 3 ảnh thiết kế gốc không đồng nhất 100% (topbar mỗi ảnh có
// icon/chip khác nhau) — mình gộp lại thành 1 pattern chung nhất quán:
// profile + logout luôn nằm cuối Sidebar, Topbar chỉ còn icon thông báo/cài đặt.
const InternalSidebar = ({
                             title = 'JobLink',
                             subtitle,
                             variant = 'dark',
                             items = [],
                             actionButton,
                             userName,
                             userRoleLabel,
                             onLogout,
                         }) => {
    return (
        <aside className={`internal-sidebar internal-sidebar--${variant}`}>
            <div className="internal-sidebar__brand">
                <div className="internal-sidebar__title">{title}</div>
                {subtitle && <div className="internal-sidebar__subtitle">{subtitle}</div>}
            </div>

            <nav className="internal-sidebar__nav">
                {items.map(({ path, label, icon: Icon }) => (
                    <NavLink
                        key={path}
                        to={path}
                        end
                        className={({ isActive }) =>
                            'internal-sidebar__link' + (isActive ? ' internal-sidebar__link--active' : '')
                        }
                    >
                        {Icon && <Icon className="internal-sidebar__icon" />}
                        <span>{label}</span>
                    </NavLink>
                ))}
            </nav>

            {actionButton && (
                <button className="internal-sidebar__action" onClick={actionButton.onClick}>
                    {actionButton.label}
                </button>
            )}

            {(userName || onLogout) && (
                <div className="internal-sidebar__profile">
                    <div className="internal-sidebar__avatar">
                        {userName ? userName.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="internal-sidebar__profile-text">
                        <div className="internal-sidebar__profile-name">{userName}</div>
                        <div className="internal-sidebar__profile-role">{userRoleLabel}</div>
                    </div>
                    {onLogout && (
                        <button
                            className="internal-sidebar__logout"
                            onClick={onLogout}
                            aria-label="Đăng xuất"
                        >
                            <LogOutIcon />
                        </button>
                    )}
                </div>
            )}
        </aside>
    );
};

export default InternalSidebar;
