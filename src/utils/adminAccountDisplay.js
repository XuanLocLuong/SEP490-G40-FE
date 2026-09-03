import { USER_ROLES } from './Constants.jsx';

/** Khớp BE AccountStatus: ACTIVE | BANNED */
export const ACCOUNT_STATUS = {
    ACTIVE: 'ACTIVE',
    BANNED: 'BANNED',
};

export const ACCOUNT_STATUS_LABELS = {
    ACTIVE: 'Đang hoạt động',
    BANNED: 'Đã khóa',
    // Alias cũ — chỉ để hiển thị an toàn nếu còn data cũ
    INACTIVE: 'Đã khóa',
    SUSPENDED: 'Đã khóa',
};

export const ACCOUNT_STATUS_OPTIONS = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: ACCOUNT_STATUS.ACTIVE, label: ACCOUNT_STATUS_LABELS.ACTIVE },
    { value: ACCOUNT_STATUS.BANNED, label: ACCOUNT_STATUS_LABELS.BANNED },
];

export const USER_ROLE_LABELS = {
    [USER_ROLES.CANDIDATE]: 'Ứng viên',
    [USER_ROLES.RECRUITER]: 'Nhà tuyển dụng',
    [USER_ROLES.ADMIN]: 'Admin',
    [USER_ROLES.POST_MANAGER]: 'Post Manager',
    [USER_ROLES.MANUAL_CHECK_TEAM]: 'Manual Check',
};

export const USER_ROLE_FILTER_OPTIONS = [
    { value: '', label: 'Tất cả role' },
    ...Object.entries(USER_ROLE_LABELS).map(([value, label]) => ({ value, label })),
];

/** Role được tạo qua POST /accounts/internal */
export const INTERNAL_STAFF_ROLES = [
    USER_ROLES.POST_MANAGER,
    USER_ROLES.MANUAL_CHECK_TEAM,
    USER_ROLES.ADMIN,
];

export const INTERNAL_STAFF_ROLE_OPTIONS = INTERNAL_STAFF_ROLES.map((value) => ({
    value,
    label: USER_ROLE_LABELS[value],
}));

/** Role tạo staff từ Dashboard Super Admin (theo handoff — không gồm Admin). */
export const DASHBOARD_STAFF_ROLES = [USER_ROLES.POST_MANAGER, USER_ROLES.MANUAL_CHECK_TEAM];

export const DASHBOARD_STAFF_ROLE_OPTIONS = DASHBOARD_STAFF_ROLES.map((value) => ({
    value,
    label: USER_ROLE_LABELS[value],
}));

export const DASHBOARD_STAFF_ROLE_FILTER_OPTIONS = [
    { value: '', label: 'Tất cả role' },
    ...DASHBOARD_STAFF_ROLE_OPTIONS,
];

/** Role được phép dùng thao tác Đổi role (không áp dụng Candidate/Recruiter/Admin). */
export const canChangeAccountRole = (currentRole) =>
    INTERNAL_STAFF_ROLES.includes(currentRole) && currentRole !== USER_ROLES.ADMIN;

/** Tài khoản role Admin: chỉ xem — không khóa / cấm / thu hồi phiên / đổi role. */
export const isViewOnlyAdminAccount = (role) => role === USER_ROLES.ADMIN;

/**
 * Dropdown đổi role: chỉ internal staff hợp lệ.
 * Candidate/Recruiter → [] (UI ẩn/disable nút Đổi role).
 */
export const getChangeRoleOptions = (currentRole) => {
    if (!canChangeAccountRole(currentRole)) return [];
    return INTERNAL_STAFF_ROLE_OPTIONS.filter((opt) => opt.value !== currentRole);
};

export const getAccountStatusLabel = (status) => ACCOUNT_STATUS_LABELS[status] || status || '—';

export const getUserRoleLabel = (role) => USER_ROLE_LABELS[role] || role || '—';

export const getAccountStatusTone = (status) => {
    switch (status) {
        case ACCOUNT_STATUS.ACTIVE:
            return 'active';
        case ACCOUNT_STATUS.BANNED:
        case 'INACTIVE':
        case 'SUSPENDED': // legacy
            return 'banned';
        default:
            return 'unknown';
    }
};

export const formatAccountDateTime = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString('vi-VN');
};

/** Actions status khả dụng theo status hiện tại (chỉ enum BE: ACTIVE <-> BANNED). */
export const getStatusActionsForAccount = (status) => {
    switch (status) {
        case ACCOUNT_STATUS.ACTIVE:
            return [
                { status: ACCOUNT_STATUS.BANNED, label: 'Khóa tài khoản', variant: 'danger' },
            ];
        case ACCOUNT_STATUS.BANNED:
        case 'INACTIVE':
        case 'SUSPENDED': // legacy
            return [
                { status: ACCOUNT_STATUS.ACTIVE, label: 'Mở khóa tài khoản', variant: 'primary' },
            ];
        default:
            return [];
    }
};
