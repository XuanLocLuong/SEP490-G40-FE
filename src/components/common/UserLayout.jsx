import { Outlet } from 'react-router-dom';

const UserLayout = () => {
    return (
        <div className="user-layout">
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};
export default UserLayout;