import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../../contexts/authContext.js';
import { getAccountMenuByRole } from './accountMenuConfig.js';
import UserAvatar from '../UserAvatar.jsx';
import { ChevronDownIcon } from '../icons.jsx';
import './accountMenuSidebar.css';

const displayName = (name) => name?.trim() || 'Bạn';

const AccountMenuSidebar = ({ activePath }) => {
    const { auth } = useAuth();
    const menu = getAccountMenuByRole(auth?.role);
    const [expanded, setExpanded] = useState(() =>
        Object.fromEntries((menu.sections || []).map((s) => [s.id, true]))
    );

    const toggleSection = (id) => {
        setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <aside className="account-menu-sidebar">
            <div className="account-menu-sidebar__profile">
                <UserAvatar src={auth?.profilePicture} name={auth?.fullName} size={48} />
                <div className="account-menu-sidebar__profile-info">
                    <p className="account-menu-sidebar__name">{displayName(auth?.fullName)}</p>
                </div>
            </div>

            <nav className="account-menu-sidebar__nav">
                {(menu.sections || []).map((section) => {
                    const SectionIcon = section.icon;
                    const isExpanded = expanded[section.id];

                    return (
                        <div key={section.id} className="account-menu-sidebar__section">
                            <button
                                type="button"
                                className="account-menu-sidebar__section-head"
                                onClick={() => toggleSection(section.id)}
                            >
                                <SectionIcon className="account-menu-sidebar__icon" />
                                <span>{section.label}</span>
                                <ChevronDownIcon
                                    className={`account-menu-sidebar__chevron${isExpanded ? ' account-menu-sidebar__chevron--open' : ''}`}
                                />
                            </button>

                            {isExpanded && (
                                <ul className="account-menu-sidebar__sublist">
                                    {section.items.map((item) => (
                                        <li key={item.path}>
                                            <NavLink
                                                to={item.path}
                                                className={({ isActive }) =>
                                                    'account-menu-sidebar__sublink' +
                                                    (isActive ? ' account-menu-sidebar__sublink--active' : '')
                                                }
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
                    const isActive = activePath === item.path;

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={`account-menu-sidebar__link${isActive ? ' account-menu-sidebar__link--active' : ''}`}
                        >
                            {ItemIcon && <ItemIcon className="account-menu-sidebar__icon" />}
                            <span>{item.label}</span>
                        </NavLink>
                    );
                })}
            </nav>
        </aside>
    );
};

export default AccountMenuSidebar;
