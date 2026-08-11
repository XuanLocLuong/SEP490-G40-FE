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
        // Clear local trước để request landing tiếp theo không mang Bearer đã revoke.
        const accessToken = getAuth()?.token;
        clearHomeSearchQuery();
        clearAuth();
        setAuthState(null);
        try {
            if (accessToken) {
                await logoutApi(accessToken);
            }
        } catch (err) {
            console.warn('Logout API failed, local session already cleared.', err);
        } finally {
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
