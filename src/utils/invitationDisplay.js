/** Giờ hết hạn mặc định theo BE (INVITATION_EXPIRATION_HOURS). */
export const INVITATION_EXPIRATION_HOURS = 72;

export const INVITATION_TABS = [
    { id: 'SENT', label: 'Chờ phản hồi', status: 'SENT' },
    { id: 'ACCEPTED', label: 'Đã chấp nhận', status: 'ACCEPTED' },
    { id: 'REJECTED', label: 'Đã từ chối', status: 'REJECTED' },
    {
        id: 'INACTIVE',
        label: 'Không còn hiệu lực',
        // BE InvitationStatus không có CANCELLED (gửi → 400 typeMismatch).
        statuses: ['EXPIRED', 'INVALIDATED'],
    },
];

/** Status gộp tab "Không còn hiệu lực" — chỉ enum BE nhận trên GET /invitations/me. */
export const INACTIVE_STATUSES = ['EXPIRED', 'INVALIDATED'];

export const getInvitationStatusLabel = (status) => {
    switch (status) {
        case 'SENT':
            return 'Chờ phản hồi';
        case 'ACCEPTED':
            return 'Đã chấp nhận';
        case 'REJECTED':
            return 'Đã từ chối';
        case 'EXPIRED':
            return 'Hết hạn';
        case 'CANCELLED':
            return 'Đã hủy';
        case 'INVALIDATED':
            return 'Không còn hiệu lực';
        default:
            return status || '—';
    }
};

/**
 * Đếm ngược còn lại đến hết hạn (72h từ sentAt).
 * Chỉ meaningful khi status === SENT.
 */
export const getInvitationRemainingLabel = (sentAt, expirationHours = INVITATION_EXPIRATION_HOURS) => {
    if (!sentAt) return null;
    const sent = new Date(sentAt);
    if (Number.isNaN(sent.getTime())) return null;

    const expiresAt = sent.getTime() + expirationHours * 60 * 60 * 1000;
    const remainingMs = expiresAt - Date.now();
    if (remainingMs <= 0) return 'Đã hết hạn';

    const totalMinutes = Math.ceil(remainingMs / 60000);
    if (totalMinutes < 60) return `Còn ${totalMinutes} phút`;

    const totalHours = Math.ceil(remainingMs / (60 * 60 * 1000));
    if (totalHours < 24) return `Còn ${totalHours} tiếng`;

    const days = Math.ceil(totalHours / 24);
    return `Còn ${days} ngày`;
};

export const formatInvitationSentAt = (sentAt) => {
    if (!sentAt) return '';
    const date = new Date(sentAt);
    if (Number.isNaN(date.getTime())) return '';

    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'Gửi vừa xong';
    if (minutes < 60) return `Gửi ${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Gửi ${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `Gửi ${days} ngày trước`;
    return `Gửi ${date.toLocaleDateString('vi-VN')}`;
};

export const formatMatchScore = (score) => {
    if (score == null || Number.isNaN(Number(score))) return null;
    return `${Math.round(Number(score))}% phù hợp`;
};
