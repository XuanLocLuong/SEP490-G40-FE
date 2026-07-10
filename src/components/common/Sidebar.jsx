import { NavLink } from 'react-router-dom';
import '../../assets/styles/SidebarStyle.css';

// Sidebar "sáng" dùng cho Candidate & Recruiter (ảnh 4, ảnh 5).
// - items: [{ path, label, icon: Component, badge? }]
// - footer: node tuỳ chọn render dưới cùng (vd: profile card của Candidate)
const Sidebar = ({ logoText = 'JOBLINK', items = [], footer = null }) => {
    if (items.length === 0) return null;

    return (
        <aside className="app-sidebar">
            <div className="app-sidebar__logo">{logoText}</div>

            <nav className="app-sidebar__nav">
                {items.map(({ path, label, icon: Icon, badge }) => (
                    <NavLink
                        key={path}
                        to={path}
                        end
                        className={({ isActive }) =>
                            'app-sidebar__link' + (isActive ? ' app-sidebar__link--active' : '')
                        }
                    >
                        {Icon && <Icon className="app-sidebar__icon" />}
                        <span className="app-sidebar__label">{label}</span>
                        {badge != null && <span className="app-sidebar__badge">{badge}</span>}
                    </NavLink>
                ))}
            </nav>

            {footer && <div className="app-sidebar__footer">{footer}</div>}
        </aside>
    );
};

export default Sidebar;
