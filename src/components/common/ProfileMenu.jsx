import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LogOutIcon } from './icons.jsx';
import '../../assets/styles/ProfileMenuStyle.css';

// items: [{ label, path?, href?, icon?: Component }]
//   - path: route thật, render bằng NavLink
//   - href: chưa có trang, render bằng thẻ <a> thường (mặc định "#")
const ProfileMenu = ({ name, roleLabel, onLogout, items = [], extra = null, variant = 'sidebar' }) => {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    const initial = name ? name.charAt(0).toUpperCase() : '?';

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`profile-menu profile-menu--${variant}`} ref={rootRef}>
            <button
                type="button"
                className="profile-menu__trigger"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
            >
                <span className="sidebar-profile__avatar">{initial}</span>
                <span className="profile-menu__text">
                    <span className="sidebar-profile__name">{name}</span>
                    <span className="sidebar-profile__role">{roleLabel}</span>
                </span>
            </button>

            {open && (
                <div className="profile-menu__dropdown">
                    {items.map((item) => {
                        const Icon = item.icon;
                        const content = (
                            <>
                                {Icon && <Icon className="profile-menu__item-icon" />}
                                {item.label}
                            </>
                        );
                        return item.path ? (
                            <NavLink key={item.label} to={item.path} className="profile-menu__item">
                                {content}
                            </NavLink>
                        ) : (
                            <a key={item.label} href={item.href || '#'} className="profile-menu__item">
                                {content}
                            </a>
                        );
                    })}

                    {extra && <div className="profile-menu__extra">{extra}</div>}

                    <button className="profile-menu__logout" onClick={onLogout}>
                        <LogOutIcon />
                        Đăng xuất
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProfileMenu;