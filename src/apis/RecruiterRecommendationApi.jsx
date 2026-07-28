import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const RECOMMENDATION_BASE = `${API_PREFIX}/recommendation`;
const RECRUITER_BASE = `${API_PREFIX}/recruiter`;

const unwrapData = (response) => response?.data?.data ?? null;

const INVITATION_SKIP_REASON_MESSAGES = {
    ALREADY_APPLIED: 'Ứng viên đã nộp hồ sơ vào tin tuyển dụng này.',
    ALREADY_INVITED: 'Ứng viên đã được gửi lời mời trước đó.',
    SCHEDULE_CONFLICT: 'Ứng viên đang có lịch làm việc bị trùng.',
    CANDIDATE_NOT_FOUND: 'Không tìm thấy hồ sơ ứng viên.',
    CANDIDATE_NOT_AVAILABLE: 'Ứng viên hiện không sẵn sàng nhận việc.',
    CANDIDATE_NOT_OPEN_TO_WORK: 'Ứng viên hiện không mở trạng thái tìm việc.',
    CANDIDATE_INACTIVE: 'Tài khoản ứng viên không còn hoạt động.',
    EMAIL_NOT_VERIFIED: 'Ứng viên chưa xác thực email.',
    INVALID_CANDIDATE: 'Hồ sơ ứng viên không hợp lệ.',
};

export const getInvitationSkipReasonMessage = (
    reason,
    fallback = 'Không thể gửi lời mời cho ứng viên này.'
) => INVITATION_SKIP_REASON_MESSAGES[reason] || reason || fallback;

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
        ...INVITATION_SKIP_REASON_MESSAGES,
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
