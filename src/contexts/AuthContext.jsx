import { createContext, useContext, useState, useCallback } from 'react';
import { getAuth, setAuth, clearAuth } from '../utils/Auth.jsx';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [auth, setAuthState] = useState(getAuth());

    const login = useCallback((authData) => {
        if (authData) {
            setAuth(authData);
            setAuthState(authData);
        }
    }, []);

    const logout = useCallback(() => {
        clearAuth();
        setAuthState(null);
    }, []);

    return (
        <AuthContext.Provider value={{ auth, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);