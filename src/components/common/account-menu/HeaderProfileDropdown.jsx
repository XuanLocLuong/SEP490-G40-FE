import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import UserAvatar from '../UserAvatar.jsx';
import { ChevronDownIcon, LogOutIcon } from '../icons.jsx';

const displayName = (name) => name?.trim() || 'Bạn';

const HeaderProfileDropdown = ({ name, avatarUrl, menu, onLogout }) => {
    const [open, setOpen] = useState(false);
    const [expanded, setExpanded] = useState(() =>
        Object.fromEntries((menu.sections || []).map((s) => [s.id, true]))
    );
    const rootRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleSection = (id) => {
        setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="header-profile-menu" ref={rootRef}>
            <button
                type="button"
                className={`header-profile-menu__trigger${open ? ' header-profile-menu__trigger--open' : ''}`}
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
            >
                <UserAvatar src={avatarUrl} name={name} size={36} />
                <span className="header-profile-menu__name">{displayName(name)}</span>
                <ChevronDownIcon className="header-profile-menu__chevron" />
            </button>

            {open && (
                <div className="header-profile-menu__dropdown">
                    {(menu.sections || []).map((section) => {
                        const SectionIcon = section.icon;
                        const isExpanded = expanded[section.id];

                        return (
                            <div key={section.id} className="header-profile-menu__section">
                                <button
                                    type="button"
                                    className="header-profile-menu__section-head"
                                    onClick={() => toggleSection(section.id)}
                                >
                                    <SectionIcon />
                                    <span>{section.label}</span>
                                    <ChevronDownIcon
                                        className={`header-profile-menu__section-chevron${isExpanded ? ' header-profile-menu__section-chevron--open' : ''}`}
                                    />
                                </button>

                                {isExpanded && (
                                    <ul className="header-profile-menu__sublist">
                                        {section.items.map((item) => (
                                            <li key={item.path}>
                                                <NavLink
                                                    to={item.path}
                                                    className="header-profile-menu__sublink"
                                                    onClick={() => setOpen(false)}
                                                >
                                                    {item.label}
                                                </NavLink>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        );
                    })}

                    {(menu.items || []).map((item) => {
                        const ItemIcon = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className="header-profile-menu__link"
                                onClick={() => setOpen(false)}
                            >
                                {ItemIcon && <ItemIcon />}
                                <span>{item.label}</span>
                            </NavLink>
                        );
                    })}

                    <div className="header-profile-menu__divider" />

                    <button
                        type="button"
                        className="header-profile-menu__logout"
                        onClick={() => {
                            setOpen(false);
                            onLogout();
                        }}
                    >
                        <LogOutIcon />
                        Đăng xuất
                    </button>
                </div>
            )}
        </div>
    );
};

export default HeaderProfileDropdown;
