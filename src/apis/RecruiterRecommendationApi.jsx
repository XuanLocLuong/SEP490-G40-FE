import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const RECOMMENDATION_BASE = `${API_PREFIX}/recommendation`;
const RECRUITER_BASE = `${API_PREFIX}/recruiter`;

const unwrapData = (response) => response?.data?.data ?? null;

export const getRecruiterRecommendationErrorMessage = (
    error,
    fallback = 'Có lỗi xảy ra'
) => {
    const message = error?.response?.data?.message || error?.message;
    const messages = {
        JOB_INFORMATION_INCOMPLETE:
            'Tin tuyển dụng chưa đủ thông tin để JobLink tìm ứng viên phù hợp.',
        JOB_NOT_FOUND: 'Tin tuyển dụng không tồn tại hoặc không còn mở.',
        JOB_ACCESS_DENIED: 'Bạn không có quyền xem gợi ý cho tin tuyển dụng này.',
        JOB_FULL: 'Tin tuyển dụng đã đủ số lượng ứng viên.',
        ALREADY_APPLIED: 'Ứng viên đã nộp hồ sơ vào tin tuyển dụng này.',
        ALREADY_INVITED: 'Ứng viên đã được gửi lời mời trước đó.',
        SCHEDULE_CONFLICT: 'Ứng viên đang có lịch làm việc bị trùng.',
    };

    return messages[message] || message || fallback;
};

export const fetchRecommendedCandidates = async (jobId, page = 0, size = 10) => {
    const response = await axiosClient.get(
        `${RECOMMENDATION_BASE}/${jobId}/candidate-recommendations`,
        { params: { page, size } }
    );
    return unwrapData(response);
};

export const sendCandidateInvitation = async (jobId, payload) => {
    const response = await axiosClient.post(
        `${RECRUITER_BASE}/jobs/${jobId}/invitations`,
        payload
    );
    return unwrapData(response);
};
