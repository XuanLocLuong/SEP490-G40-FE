import {
    acceptApplication,
    fetchJobApplications,
    getRecruiterApplicationApiErrorMessage,
    isApplicationCancelledError,
    rejectApplication,
} from '../apis/RecruiterApplicationApi.jsx';
import { formatRelativeTime } from '../utils/formatters.js';

export { getRecruiterApplicationApiErrorMessage, isApplicationCancelledError };

export const APPLICATION_STATUS_FILTERS = [
    { value: 'PENDING', label: 'Chờ duyệt' },
    { value: 'ACCEPTED', label: 'Đã chấp nhận' },
    { value: 'REJECTED', label: 'Từ chối' },
    { value: 'HIRED', label: 'Đã tuyển' },
    { value: 'ALL', label: 'Tất cả' },
];

export const MATCH_BUCKETS = [
    {
        key: 'highMatch',
        title: 'Phù hợp cao',
        hint: '>80%',
        empty: 'Chưa có ứng viên',
    },
    {
        key: 'mediumMatch',
        title: 'Phù hợp khá',
        hint: '50–80%',
        empty: 'Chưa có ứng viên',
    },
    {
        key: 'lowMatch',
        title: 'Phù hợp thấp',
        hint: '<50%',
        empty: 'Chưa có ứng viên',
    },
    {
        key: 'criticalMismatch',
        title: 'Không đạt yêu cầu bắt buộc',
        hint: null,
        empty: 'Không có ứng viên không đạt yêu cầu bắt buộc',
    },
];

export const REJECTION_REASONS = [
    { value: 'INSUFFICIENT_EXPERIENCE', label: 'Chưa đủ kinh nghiệm yêu cầu' },
    { value: 'SKILL_MISMATCH', label: 'Kỹ năng chưa phù hợp' },
    { value: 'POSITION_FILLED', label: 'Vị trí tuyển dụng đã đủ người' },
    { value: 'CANDIDATE_WITHDREW', label: 'Ứng viên đã rút đơn' },
    { value: 'INVALID_PROFILE', label: 'Thông tin hồ sơ chưa hợp lệ' },
    { value: 'OFFER_DECLINED', label: 'Ứng viên từ chối nhận việc' },
    { value: 'OFFER_EXPIRED', label: 'Lời mời nhận việc đã hết hạn' },
    { value: 'OTHER', label: 'Lý do khác' },
];

export const getRejectionReasonLabel = (reason) => {
    if (!reason) return 'Chưa có lý do cụ thể';
    const found = REJECTION_REASONS.find((r) => r.value === reason);
    return found ? found.label : reason;
};

const STATUS_LABELS = {
    PENDING: 'Chờ duyệt',
    ACCEPTED: 'Đã chấp nhận – chờ xác nhận nhận việc',
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
    if (relative === 'Vừa đăng') return 'Vừa gửi';
    return relative.replace(/^Đăng /, '');
};

export const mapApplicationItem = (item) => ({
    id: item?.id ?? null,
    candidateId: item?.candidateId ?? null,
    candidateUserId: item?.candidateUserId ?? item?.candidate?.userId ?? null,
    candidateName: item?.candidateName || 'Ứng viên',
    candidateAvatar: item?.candidateAvatar || null,
    candidateEmail: item?.candidateEmail || null,
    candidatePhone: item?.candidatePhone || null,
    cvLink: item?.cvLink || item?.cvUrl || null,
    status: item?.status || null,
    appliedAt: item?.appliedAt || null,
    matchScore: item?.matchScore ?? null,
    scheduleScore: item?.scheduleScore ?? null,
    skillScore: item?.skillScore ?? null,
    distanceScore: item?.distanceScore ?? null,
    distanceKm: item?.distanceKm ?? null,
    trustScore: item?.trustScore ?? null,
    rejectReason: item?.rejectReason ?? null,
    note: item?.note ?? null,
    criticalMismatchReasons: Array.isArray(item?.criticalMismatchReasons)
        ? item.criticalMismatchReasons.filter(Boolean)
        : [],
});

const mapBucket = (list) =>
    Array.isArray(list) ? list.map(mapApplicationItem) : [];

export const mapApplicationsResponse = (data) => {
    const highMatch = mapBucket(data?.highMatch);
    const mediumMatch = mapBucket(data?.mediumMatch);
    const lowMatch = mapBucket(data?.lowMatch);
    const criticalMismatch = mapBucket(data?.criticalMismatch);
    const applications = mapBucket(data?.applications);
    return {
        jobId: data?.jobId ?? null,
        totalApplications: data?.totalApplications ?? 0,
        statusCounts: data?.statusCounts || data?.counts || {},
        highMatchCount: data?.highMatchCount ?? highMatch.length,
        mediumMatchCount: data?.mediumMatchCount ?? mediumMatch.length,
        lowMatchCount: data?.lowMatchCount ?? lowMatch.length,
        criticalMismatchCount: data?.criticalMismatchCount ?? criticalMismatch.length,
        highMatch,
        mediumMatch,
        lowMatch,
        criticalMismatch,
        applications,
    };
};

export const flattenApplicationBuckets = (buckets) => {
    const fromColumns = [
        ...(buckets.highMatch || []),
        ...(buckets.mediumMatch || []),
        ...(buckets.lowMatch || []),
        ...(buckets.criticalMismatch || []),
    ];
    if (fromColumns.length > 0) return fromColumns;
    return buckets.applications || [];
};

export const recruiterApplicationService = {
    getApplications: async (jobId, options = {}) => {
        const { status = 'PENDING' } = options;
        const params = {};
        if (status && status !== 'ALL') params.status = status;
        const res = await fetchJobApplications(jobId, params);
        return mapApplicationsResponse(res?.data?.data ?? {});
    },

    accept: (applicationId) => acceptApplication(applicationId),

    reject: (applicationId, { reason, note }) =>
        rejectApplication(applicationId, { reason, note: note?.trim() || undefined }),
};

export default recruiterApplicationService;
