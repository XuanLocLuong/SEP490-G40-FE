import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LogOutIcon } from './icons.jsx';
import { elevateOverlay, OVERLAY_CSS, claimOverlayZ } from '../../utils/overlayLayer.js';
import '../../assets/styles/ProfileMenuStyle.css';

// items: [{ label, path?, href?, icon?: Component }]
//   - path: route thật, render bằng NavLink
//   - href: chưa có trang, render bằng thẻ <a> thường (mặc định "#")
const ProfileMenu = ({
    name,
    roleLabel,
    avatarUrl = null,
    onLogout,
    items = [],
    extra = null,
    variant = 'sidebar',
}) => {
    const [open, setOpen] = useState(false);
    const [imgFailed, setImgFailed] = useState(false);
    const [menuZ, setMenuZ] = useState(null);
    const rootRef = useRef(null);
    const initial = name ? name.charAt(0).toUpperCase() : '?';
    const showAvatarImage = Boolean(avatarUrl) && !imgFailed;

    useEffect(() => {
        setImgFailed(false);
    }, [avatarUrl]);

    useEffect(() => {
        if (!open) {
            setMenuZ(null);
            return undefined;
        }

        if (variant === 'header') {
            elevateOverlay(OVERLAY_CSS.HEADER);
        } else {
            setMenuZ(claimOverlayZ());
        }

        const handleClickOutside = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open, variant]);

    const handleToggle = () => {
        setOpen((v) => {
            const next = !v;
            if (next) {
                if (variant === 'header') elevateOverlay(OVERLAY_CSS.HEADER);
                else setMenuZ(claimOverlayZ());
            }
            return next;
        });
    };

    return (
        <div
            className={`profile-menu profile-menu--${variant}`}
            ref={rootRef}
            style={menuZ != null ? { zIndex: menuZ, position: 'relative' } : undefined}
        >
            <button
                type="button"
                className="profile-menu__trigger"
                onClick={handleToggle}
                aria-expanded={open}
            >
                {showAvatarImage ? (
                    <img
                        src={avatarUrl}
                        alt=""
                        className="profile-menu__avatar profile-menu__avatar--image"
                        onError={() => setImgFailed(true)}
                    />
                ) : (
                    <span className="profile-menu__avatar" aria-hidden="true">
                        {initial}
                    </span>
                )}
                <span className="profile-menu__text">
                    <span className="profile-menu__name">{name}</span>
                    <span className="profile-menu__role">{roleLabel}</span>
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
                            <NavLink
                                key={item.label}
                                to={item.path}
                                className="profile-menu__item"
                                onClick={() => setOpen(false)}
                            >
                                {content}
                            </NavLink>
                        ) : (
                            <a
                                key={item.label}
                                href={item.href || '#'}
                                className="profile-menu__item"
                                onClick={() => setOpen(false)}
                            >
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
