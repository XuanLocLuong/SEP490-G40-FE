import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/authContext.js';
import { ROUTES } from '../routes/path.js';

/** Đăng xuất rồi về Landing — dùng chung cho mọi layout. */
export const useLogoutToLanding = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    return useCallback(async () => {
        await logout();
        navigate(ROUTES.LANDING, { replace: true });
    }, [logout, navigate]);
};
