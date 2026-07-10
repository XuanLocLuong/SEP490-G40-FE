import { NavLink } from 'react-router-dom';

// Sidebar dùng chung cho mọi role — chỉ nhận danh sách item để render,
// không tự biết role nào cả. Mỗi Layout (Candidate/Recruiter/Internal...)
// tự quyết định truyền items gì vào.
const Sidebar = ({ items = [] }) => {
    if (items.length === 0) return null;

    return (
        <aside style={styles.sidebar}>
            <nav style={styles.nav}>
                {items.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        style={({ isActive }) => ({
                            ...styles.link,
                            ...(isActive ? styles.linkActive : {})
                        })}
                    >
                        {item.label}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
};

const styles = {
    sidebar: {
        width: 220,
        borderRight: '1px solid #ddd',
        padding: '16px 12px',
        background: '#fafafa'
    },
    nav: {
        display: 'flex',
        flexDirection: 'column',
        gap: 4
    },
    link: {
        padding: '8px 10px',
        borderRadius: 6,
        textDecoration: 'none',
        color: '#333'
    },
    linkActive: {
        background: '#e3e3e3',
        fontWeight: 'bold'
    }
};

export default Sidebar;
