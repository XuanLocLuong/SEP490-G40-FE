import { useEffect, useRef, useState } from 'react';
import { LogOutIcon } from './icons.jsx';
import '../../assets/styles/ProfileMenuStyle.css';

// Click vào avatar/tên -> mở dropdown chứa nút Đăng xuất.
// Dùng làm "footer" của Sidebar (Candidate/Recruiter).
const ProfileMenu = ({ name, roleLabel, onLogout, extra = null }) => {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    const initial = name ? name.charAt(0).toUpperCase() : '?';

    // Đóng dropdown khi bấm ra ngoài.
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
        <div className="profile-menu" ref={rootRef}>
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
                    <button className="profile-menu__logout" onClick={onLogout}>
                        <LogOutIcon />
                        Đăng xuất
                    </button>
                </div>
            )}

            {extra}
        </div>
    );
};

export default ProfileMenu;
