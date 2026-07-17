import { NavLink, useLocation } from 'react-router-dom';
import '../../assets/styles/SidebarStyle.css';

const isNavItemActive = (path, location) => {
    const [pathname, search = ''] = path.split('?');
    if (location.pathname !== pathname) return false;
    if (!search) {
        // Plain /jobs should not stay active when ?section= is set.
        return !location.search || location.search === '?';
    }
    const expected = new URLSearchParams(search);
    const actual = new URLSearchParams(location.search);
    for (const [key, value] of expected.entries()) {
        if (actual.get(key) !== value) return false;
    }
    return true;
};

// Sidebar "sáng" dùng cho Candidate & Recruiter (ảnh 4, ảnh 5).
// - items: [{ path, label, icon: Component, badge? }]
// - footer: node tuỳ chọn render dưới cùng (vd: profile card của Candidate)
const Sidebar = ({ logoText = 'JOBLINK', items = [], footer = null }) => {
    const location = useLocation();

    if (items.length === 0) return null;

    return (
        <aside className="app-sidebar">
            <div className="app-sidebar__logo">{logoText}</div>

            <nav className="app-sidebar__nav">
                {items.map(({ path, label, icon: Icon, badge }) => {
                    const active = isNavItemActive(path, location);
                    return (
                        <NavLink
                            key={path}
                            to={path}
                            end
                            className={() =>
                                'app-sidebar__link' + (active ? ' app-sidebar__link--active' : '')
                            }
                        >
                            {Icon && <Icon className="app-sidebar__icon" />}
                            <span className="app-sidebar__label">{label}</span>
                            {badge != null && <span className="app-sidebar__badge">{badge}</span>}
                        </NavLink>
                    );
                })}
            </nav>

            {footer && <div className="app-sidebar__footer">{footer}</div>}
        </aside>
    );
};

export default Sidebar;
