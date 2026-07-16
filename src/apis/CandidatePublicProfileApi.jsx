import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const publicProfilePath = (candidateId) =>
    `${API_PREFIX}/candidates/${candidateId}/public-profile`;

export const getApiErrorMessage = (error, fallback = 'Có lỗi xảy ra') =>
    error?.response?.data?.message || error?.message || fallback;

export const isCandidateNotFoundError = (error) =>
    error?.response?.status === 404 &&
    error?.response?.data?.message === 'CANDIDATE_NOT_FOUND';

export const getCandidatePublicProfile = (candidateId) =>
    axiosClient.get(publicProfilePath(candidateId));

export default {
    getCandidatePublicProfile,
    getApiErrorMessage,
    isCandidateNotFoundError,
};
