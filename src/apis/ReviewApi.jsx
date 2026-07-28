import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

/** POST /applications/{applicationId}/reviews */
export const submitApplicationReview = (applicationId, body) =>
    axiosClient.post(`${API_PREFIX}/applications/${applicationId}/reviews`, body);
