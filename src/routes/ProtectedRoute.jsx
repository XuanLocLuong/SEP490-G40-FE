import { Navigate } from 'react-router-dom';
import {useAuth} from "../contexts/AuthContext.jsx";
const ProtectedRoute = ({
                            children,
                            allowedRoles = []
                        }) => {

    const { auth } = useAuth();

    if (!auth) {
        return <Navigate to="/login" replace />;
    }

    if (
        allowedRoles.length > 0 &&
        !allowedRoles.includes(auth.role)
    ) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;