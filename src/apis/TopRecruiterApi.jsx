import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const TOP_RECRUITERS_BASE = `${API_PREFIX}/top-recruiters`;

const unwrapList = (response) => {
    const data = response?.data?.data;
    return Array.isArray(data) ? data : [];
};

/** GET /api/v1/top-recruiters — UC-54 public ranking (guest + candidate). */
export const fetchTopRecruiters = async () => {
    const response = await axiosClient.get(TOP_RECRUITERS_BASE);
    return unwrapList(response);
};

const TOP_RECRUITER_ERROR_MESSAGES = {
    TOP_RECRUITER_RANKING_UNAVAILABLE:
        'Bảng xếp hạng nhà tuyển dụng hiện không khả dụng. Vui lòng thử lại sau.',
    TOP_RECRUITER_RANKING_CONFIGURATION_INVALID:
        'Bảng xếp hạng nhà tuyển dụng đang được cấu hình lại. Vui lòng thử lại sau.',
};

export const getTopRecruiterErrorMessage = (error, fallback = 'Không thể tải danh sách nhà tuyển dụng.') => {
    const message = error?.response?.data?.message;
    if (message && TOP_RECRUITER_ERROR_MESSAGES[message]) {
        return TOP_RECRUITER_ERROR_MESSAGES[message];
    }
    if (error?.response?.status === 503) {
        return TOP_RECRUITER_ERROR_MESSAGES.TOP_RECRUITER_RANKING_UNAVAILABLE;
    }
    return fallback;
};
