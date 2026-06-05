import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {ROLE_ADMIN, ROLE_MEMBER, ROLE_STAFF} from '../utils/constants';

import Login from '../pages/auth/Login';
import AdminPage from '../pages/admin/AdminPage';
import StaffPage from '../pages/staff/StaffPage';
import HomePage from '../pages/common/HomePage';
import ProtectedRoute from './ProtectedRoute';
import Register from "../pages/auth/register.jsx";
import MemberPage from "../pages/member/MemberPage.jsx";

const AppRouter = () => {
    const { auth } = useAuth();

    const getRedirectPath = () => {
        if (!auth) return '/';
        if (auth.role === ROLE_ADMIN) return '/admin';
        if (auth.role === ROLE_STAFF) return '/staff';
        if (auth.role === ROLE_MEMBER) return '/member';
        return '/home';
    };

    return (
        <Routes>
            <Route path="/" element={<HomePage />} />

            <Route path="/login" element={<Login />} />

            <Route path="/register" element={<Register />} />

            <Route
                path="/admin"
                element={
                    <ProtectedRoute
                        allowedRoles={[ROLE_ADMIN]}
                    >
                        <AdminPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/staff"
                element={
                    <ProtectedRoute
                        allowedRoles={[ROLE_STAFF]}
                    >
                        <StaffPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/home"
                element={
                    <ProtectedRoute>
                        <HomePage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/member"
                element={
                    <ProtectedRoute
                        allowedRoles={[ROLE_MEMBER]}
                    >
                        <MemberPage />
                    </ProtectedRoute>
                }
            />

            <Route path="*" element={<Navigate to={getRedirectPath()} />} />
        </Routes>
    );
};

export default AppRouter;