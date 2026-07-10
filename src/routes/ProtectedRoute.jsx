import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/authContext.js';
import { ROUTES, getHomePathByRole } from './path.js';

// Bọc quanh 1 Layout (không phải từng Page) — xem cách dùng trong AppRouter.jsx.
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { auth } = useAuth();

    if (!auth) {
        return <Navigate to={ROUTES.LOGIN} replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(auth.role)) {
        // Đăng nhập rồi nhưng sai role -> đá về đúng trang chủ của role đó,
        // không đá về "/" chung chung như trước (dễ gây redirect loop).
        return <Navigate to={getHomePathByRole(auth.role)} replace />;
    }

    return children;
};

export default ProtectedRoute;
