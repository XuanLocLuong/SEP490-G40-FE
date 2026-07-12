import { useState, useCallback } from 'react';
import { getAuth, setAuth, clearAuth } from '../utils/Auth.jsx';
import { logout as logoutApi } from '../apis/AuthApi.jsx';
import { AuthContext } from './authContext.js';

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
        try {
            await logoutApi();
        } catch (err) {
            console.warn('Logout API failed, clearing local session anyway.', err);
        } finally {
            clearAuth();
            setAuthState(null);
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
