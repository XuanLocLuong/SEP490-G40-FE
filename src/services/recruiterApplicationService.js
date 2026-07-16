import {
    acceptApplication,
    fetchJobApplications,
    getRecruiterApplicationApiErrorMessage,
    rejectApplication,
} from '../apis/RecruiterApplicationApi.jsx';
import { formatRelativeTime } from '../utils/formatters.js';

export { getRecruiterApplicationApiErrorMessage };

export const APPLICATION_STATUS_FILTERS = [
    { value: 'PENDING', label: 'Chờ duyệt' },
    { value: 'ACCEPTED', label: 'Đã mời' },
    { value: 'REJECTED', label: 'Từ chối' },
    { value: 'HIRED', label: 'Đã tuyển' },
    { value: 'ALL', label: 'Tất cả' },
];

export const APPLICATION_SORT_OPTIONS = [
    { value: 'appliedAt,desc', label: 'Mới nhất' },
    { value: 'appliedAt,asc', label: 'Cũ nhất' },
];

export const REJECTION_REASONS = [
    { value: 'INSUFFICIENT_EXPERIENCE', label: 'Không đủ kinh nghiệm' },
    { value: 'SKILL_MISMATCH', label: 'Kỹ năng không phù hợp' },
    { value: 'INVALID_PROFILE', label: 'Hồ sơ chưa đầy đủ' },
    { value: 'POSITION_FILLED', label: 'Đã đủ vị trí' },
    { value: 'OTHER', label: 'Khác' },
];

const STATUS_LABELS = {
    PENDING: 'Chờ duyệt',
    ACCEPTED: 'Đã mời – chờ ứng viên xác nhận',
    REJECTED: 'Đã từ chối',
    HIRED: 'Đã tuyển',
    COMPLETED: 'Đã hoàn thành',
    CANCELLED: 'Đã huỷ',
};

const STATUS_TONES = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    HIRED: 'hired',
    COMPLETED: 'hired',
    CANCELLED: 'muted',
};

export const getApplicationStatusLabel = (status) => STATUS_LABELS[status] || status || '—';

export const getApplicationStatusTone = (status) => STATUS_TONES[status] || 'muted';

export const formatAppliedRelativeTime = (isoString) => {
    if (!isoString) return '—';
    const relative = formatRelativeTime(isoString);
    if (!relative) return '—';
    return relative.replace(/^Đăng /, 'Ứng tuyển ');
};

export const mapApplicationItem = (item) => ({
    id: item?.id ?? null,
    candidateId: item?.candidateId ?? null,
    candidateName: item?.candidateName || 'Ứng viên',
    candidateAvatar: item?.candidateAvatar || null,
    status: item?.status || null,
    appliedAt: item?.appliedAt || null,
});

export const mapApplicationsPage = (data) => ({
    content: Array.isArray(data?.content) ? data.content.map(mapApplicationItem) : [],
    totalPages: data?.totalPages ?? 0,
    totalElements: data?.totalElements ?? 0,
    currentPage: data?.currentPage ?? 0,
    pageSize: data?.pageSize ?? 12,
});

const buildListParams = ({ status, sort, page, size }) => {
    const params = { page, size };
    if (status && status !== 'ALL') {
        params.status = status;
    }
    if (sort) {
        const [sortBy, direction] = sort.split(',');
        params.sort = `${sortBy},${direction}`;
    }
    return params;
};

export const recruiterApplicationService = {
    getApplications: async (jobId, options = {}) => {
        const { status = 'PENDING', sort = 'appliedAt,desc', page = 0, size = 12 } = options;
        const res = await fetchJobApplications(jobId, buildListParams({ status, sort, page, size }));
        return mapApplicationsPage(res?.data?.data ?? {});
    },

    accept: (applicationId) => acceptApplication(applicationId),

    reject: (applicationId, { reason, note }) =>
        rejectApplication(applicationId, { reason, note: note?.trim() || undefined }),
};

export default recruiterApplicationService;
