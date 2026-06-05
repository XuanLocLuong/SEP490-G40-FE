export const getAuth = () => {
    const data = localStorage.getItem('auth');
    return data ? JSON.parse(data) : null;
};

export const setAuth = (auth) => {
    localStorage.setItem('auth', JSON.stringify(auth));
};

export const clearAuth = () => {
    localStorage.removeItem('auth');
};