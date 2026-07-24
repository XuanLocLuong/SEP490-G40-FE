import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/authContext.js';
import { getHomePathByRole } from './path.js';

/** Chỉ cho guest — đã login thì đá về homepage đúng role. */
const GuestOnlyRoute = ({ children }) => {
    const { auth } = useAuth();

    if (auth) {
        return <Navigate to={getHomePathByRole(auth.role)} replace />;
    }

    return children;
};

export default GuestOnlyRoute;
