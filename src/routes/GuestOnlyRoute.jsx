import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/authContext.js';
import { getHomePathByRole, ROUTES } from './path.js';

/** Trang auth vẫn cần giữ session tạm (vd. resend verify) nhưng chưa cho vào app. */
const AUTH_FLOW_PATHS = new Set([ROUTES.REGISTER, ROUTES.VERIFY_EMAIL]);

/** Chỉ cho guest — đã login thì đá về homepage đúng role. */
const GuestOnlyRoute = ({ children }) => {
    const { auth } = useAuth();
    const location = useLocation();

    if (auth) {
        // Register email/password: login ngay để gửi lại verify, nhưng phải ở lại
        // màn "Kiểm tra email" — không đá home khi email chưa xác thực.
        const stayOnAuthFlow =
            AUTH_FLOW_PATHS.has(location.pathname) && auth.emailVerified !== true;
        if (!stayOnAuthFlow) {
            return <Navigate to={getHomePathByRole(auth.role)} replace />;
        }
    }

    return children ?? <Outlet />;
};

export default GuestOnlyRoute;
