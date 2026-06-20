import axiosClient from './AxiosClient.jsx';

export const login = (data) => {
    return axiosClient.post('/auth/login', data);
};
export const register = (data) => {
    return axiosClient.post('/auth/register', data);
};
export const loginWithGoogle = (data) => {
    return axiosClient.post('/auth/google', data);
};