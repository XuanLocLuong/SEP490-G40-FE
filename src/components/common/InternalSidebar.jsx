import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDownIcon, LogOutIcon } from './icons.jsx';
import '../../assets/styles/InternalSidebarStyle.css';

// Sidebar tối dùng chung cho 3 role nội bộ (ảnh 6, 7, 8).
// variant: 'dark' (Admin/Post Manager) | 'verification' (Manual Check Team,
// nền xanh nhạt hơn theo đúng ảnh 6) — chỉ khác màu nền, cấu trúc giống nhau.
//
// items hỗ trợ 2 dạng:
// - link phẳng: { path, label, icon }
// - nhóm expand: { id, label, icon, children: [{ path, label, icon }] }
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
    const location = useLocation();
    const [openGroups, setOpenGroups] = useState({});

    // Tự mở nhóm khi đang đứng ở 1 route con (vào trực tiếp / reload vẫn thấy đúng).
    useEffect(() => {
        setOpenGroups((prev) => {
            const next = { ...prev };
            let changed = false;

            items.forEach((item) => {
                if (!item?.children?.length || !item.id) return;
                const childActive = item.children.some(
                    (child) =>
                        location.pathname === child.path ||
                        location.pathname.startsWith(`${child.path}/`)
                );
                if (childActive && !next[item.id]) {
                    next[item.id] = true;
                    changed = true;
                }
            });

            return changed ? next : prev;
        });
    }, [items, location.pathname]);

    const toggleGroup = (groupId) => {
        setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
    };

    const renderLink = ({ path, label, icon: Icon }, { nested = false } = {}) => (
        <NavLink
            key={path}
            to={path}
            end
            className={({ isActive }) =>
                [
                    'internal-sidebar__link',
                    nested ? 'internal-sidebar__link--nested' : '',
                    isActive ? 'internal-sidebar__link--active' : '',
                ]
                    .filter(Boolean)
                    .join(' ')
            }
        >
            {Icon && <Icon className="internal-sidebar__icon" />}
            <span>{label}</span>
        </NavLink>
    );

    return (
        <aside className={`internal-sidebar internal-sidebar--${variant}`}>
            <div className="internal-sidebar__brand">
                <div className="internal-sidebar__title">{title}</div>
                {subtitle && <div className="internal-sidebar__subtitle">{subtitle}</div>}
            </div>

            <nav className="internal-sidebar__nav">
                {items.map((item) => {
                    if (item.children?.length) {
                        const groupId = item.id || item.label;
                        const GroupIcon = item.icon;
                        const isOpen = Boolean(openGroups[groupId]);
                        const childActive = item.children.some(
                            (child) =>
                                location.pathname === child.path ||
                                location.pathname.startsWith(`${child.path}/`)
                        );

                        return (
                            <div key={groupId} className="internal-sidebar__group">
                                <button
                                    type="button"
                                    className={
                                        'internal-sidebar__group-toggle' +
                                        (childActive ? ' internal-sidebar__group-toggle--active' : '') +
                                        (isOpen ? ' internal-sidebar__group-toggle--open' : '')
                                    }
                                    onClick={() => toggleGroup(groupId)}
                                    aria-expanded={isOpen}
                                >
                                    {GroupIcon && <GroupIcon className="internal-sidebar__icon" />}
                                    <span className="internal-sidebar__group-label">{item.label}</span>
                                    <ChevronDownIcon
                                        className={
                                            'internal-sidebar__chevron' +
                                            (isOpen ? ' internal-sidebar__chevron--open' : '')
                                        }
                                    />
                                </button>

                                <div
                                    className={
                                        'internal-sidebar__group-panel' +
                                        (isOpen ? ' internal-sidebar__group-panel--open' : '')
                                    }
                                >
                                    <div className="internal-sidebar__group-children">
                                        {item.children.map((child) =>
                                            renderLink(child, { nested: true })
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    return renderLink(item);
                })}
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
