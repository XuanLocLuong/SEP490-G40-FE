import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/authContext.js';
import { getHomePathByRole, ROUTES } from './path.js';

/**
 * /register: giữ lại sau login để hiện màn thành công / tài khoản đã tồn tại.
 * /verify-email: giữ khi email chưa verified (resend).
 */
const canStayOnAuthPath = (pathname, auth) => {
    if (pathname === ROUTES.REGISTER) return true;
    if (pathname === ROUTES.VERIFY_EMAIL && auth.emailVerified !== true) return true;
    return false;
};

/** Chỉ cho guest — đã login thì đá về homepage đúng role. */
const GuestOnlyRoute = ({ children }) => {
    const { auth } = useAuth();
    const location = useLocation();

    if (auth && !canStayOnAuthPath(location.pathname, auth)) {
        return <Navigate to={getHomePathByRole(auth.role)} replace />;
    }

    return children ?? <Outlet />;
};

export default GuestOnlyRoute;
