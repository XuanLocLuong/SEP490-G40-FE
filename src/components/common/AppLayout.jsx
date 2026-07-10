import { Outlet } from 'react-router-dom';
import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';

// Layout gốc dùng chung cho toàn bộ app. Mọi Layout theo role
// (GuestLayout, CandidateLayout, RecruiterLayout, InternalLayout...)
// đều chỉ là lớp mỏng gọi AppLayout với navItems khác nhau — tránh
// lặp lại Header/khung trang ở từng page như code cũ.
const AppLayout = ({ navItems = [] }) => {
    return (
        <div style={styles.page}>
            <Header />
            <div style={styles.body}>
                <Sidebar items={navItems} />
                <main style={styles.content}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

const styles = {
    page: {
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
    },
    body: {
        display: 'flex',
        flex: 1
    },
    content: {
        flex: 1,
        padding: 20
    }
};

export default AppLayout;
