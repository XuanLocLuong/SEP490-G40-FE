import { useState, useCallback } from 'react';
import { getAuth, setAuth, clearAuth } from '../utils/Auth.jsx';
import { logout as logoutApi } from '../apis/AuthApi.jsx';
import { setSuppressSessionExpiredRedirect } from '../apis/AxiosClient.jsx';
import { AuthContext } from './authContext.js';
import { clearHomeSearchQuery } from '../utils/homeSearchStorage.js';

export const AuthProvider = ({ children }) => {
    const [auth, setAuthState] = useState(getAuth());

    const login = useCallback((authData) => {
        if (authData) {
            setAuth(authData);
            setAuthState(authData);
        }
    }, []);

    const updateProfile = useCallback((profileData) => {
        const currentAuth = getAuth();
        if (!currentAuth) return;

        const updated = { ...currentAuth, ...profileData };
        setAuth(updated);
        setAuthState(updated);
    }, []);

    const logout = useCallback(async () => {
        setSuppressSessionExpiredRedirect(true);
        try {
            await logoutApi();
        } catch (err) {
            console.warn('Logout API failed, clearing local session anyway.', err);
        } finally {
            clearHomeSearchQuery();
            clearAuth();
            setAuthState(null);
            // Giữ suppress thêm chút để in-flight 401 không đá về /login.
            window.setTimeout(() => setSuppressSessionExpiredRedirect(false), 1500);
        }
    }, []);

    const hasRole = useCallback(
        (...roles) => !!auth && roles.includes(auth.role),
        [auth]
    );

    return (
        <AuthContext.Provider value={{ auth, login, logout, hasRole, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
};
