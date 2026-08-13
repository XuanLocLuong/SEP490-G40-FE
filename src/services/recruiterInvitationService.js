import {
    fetchJobInvitations,
    getRecruiterInvitationApiErrorMessage,
} from '../apis/RecruiterInvitationApi.jsx';
import { formatRelativeTime } from '../utils/formatters.js';

export { getRecruiterInvitationApiErrorMessage };

export const INVITATION_STATUS_FILTERS = [
    { value: 'SENT', label: 'Chờ phản hồi' },
    { value: 'ACCEPTED', label: 'Đã nhận' },
    { value: 'REJECTED', label: 'Từ chối' },
    { value: 'INVALIDATED', label: 'Không còn hiệu lực' },
    { value: 'ALL', label: 'Tất cả' },
];

const STATUS_LABELS = {
    SENT: 'Chờ phản hồi',
    ACCEPTED: 'Đã nhận lời mời',
    REJECTED: 'Ứng viên từ chối',
    EXPIRED: 'Hết hạn',
    CANCELLED: 'Đã hủy',
    INVALIDATED: 'Không còn hiệu lực',
};

const STATUS_TONES = {
    SENT: 'pending',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    EXPIRED: 'muted',
    CANCELLED: 'muted',
    INVALIDATED: 'muted',
};

export const getInvitationStatusLabel = (status) => STATUS_LABELS[status] || status || '—';

export const getInvitationStatusTone = (status) => STATUS_TONES[status] || 'muted';

export const formatInvitationSentTime = (isoString) => {
    if (!isoString) return '—';
    const relative = formatRelativeTime(isoString);
    if (!relative) return '—';
    return relative.replace(/^Đăng /, 'Gửi ');
};

export const mapInvitationItem = (item) => ({
    id: item?.invitationId ?? null,
    candidateId: item?.candidateId ?? null,
    candidateUserId: item?.candidateUserId ?? null,
    candidateName: item?.candidateName || 'Ứng viên',
    candidateAvatar: item?.candidateAvatar || null,
    status: item?.status || null,
    sentAt: item?.sentAt || null,
    respondedAt: item?.respondedAt || null,
    matchScore: item?.matchScore ?? null,
    message: item?.message || '',
});

export const mapInvitationsPage = (data) => ({
    content: Array.isArray(data?.content) ? data.content.map(mapInvitationItem) : [],
    totalPages: data?.totalPages ?? 0,
    totalElements: data?.totalElements ?? 0,
    currentPage: data?.currentPage ?? 0,
    pageSize: data?.pageSize ?? 10,
});

const buildListParams = ({ status, page, size }) => {
    const params = { page, size };
    if (status && status !== 'ALL') {
        params.status = status;
    }
    return params;
};

const unwrapData = (response) => response?.data?.data ?? response?.data;

export const getInvitations = async (jobId, { status, page = 0, size = 12 } = {}) => {
    const res = await fetchJobInvitations(jobId, buildListParams({ status, page, size }));
    return mapInvitationsPage(unwrapData(res));
};
