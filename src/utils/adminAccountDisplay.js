import { USER_ROLES } from './Constants.jsx';

export const ACCOUNT_STATUS = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    SUSPENDED: 'SUSPENDED',
    BANNED: 'BANNED',
};

export const ACCOUNT_STATUS_LABELS = {
    ACTIVE: 'Đang hoạt động',
    INACTIVE: 'Không hoạt động',
    SUSPENDED: 'Tạm khóa',
    BANNED: 'Cấm vĩnh viễn',
};

export const ACCOUNT_STATUS_OPTIONS = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: ACCOUNT_STATUS.ACTIVE, label: ACCOUNT_STATUS_LABELS.ACTIVE },
    { value: ACCOUNT_STATUS.INACTIVE, label: ACCOUNT_STATUS_LABELS.INACTIVE },
    { value: ACCOUNT_STATUS.SUSPENDED, label: ACCOUNT_STATUS_LABELS.SUSPENDED },
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

/** Role có thể gán khi đổi role (hạn chế CANDIDATE ↔ RECRUITER: không hiện 2 role public nếu đang là staff, và ngược lại giữ đủ nhưng warn). */
export const getChangeRoleOptions = (currentRole) => {
    const all = Object.entries(USER_ROLE_LABELS).map(([value, label]) => ({ value, label }));
    // Product: cho đổi sang staff / admin; hạn chế đổi thẳng CANDIDATE ↔ RECRUITER
    if (currentRole === USER_ROLES.CANDIDATE || currentRole === USER_ROLES.RECRUITER) {
        return all.filter(
            (opt) =>
                opt.value === currentRole ||
                INTERNAL_STAFF_ROLES.includes(opt.value)
        );
    }
    return all.filter((opt) => opt.value !== USER_ROLES.CANDIDATE && opt.value !== USER_ROLES.RECRUITER);
};

export const getAccountStatusLabel = (status) => ACCOUNT_STATUS_LABELS[status] || status || '—';

export const getUserRoleLabel = (role) => USER_ROLE_LABELS[role] || role || '—';

export const getAccountStatusTone = (status) => {
    switch (status) {
        case ACCOUNT_STATUS.ACTIVE:
            return 'active';
        case ACCOUNT_STATUS.SUSPENDED:
            return 'suspended';
        case ACCOUNT_STATUS.BANNED:
            return 'banned';
        case ACCOUNT_STATUS.INACTIVE:
            return 'inactive';
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

/** Actions status khả dụng theo status hiện tại */
export const getStatusActionsForAccount = (status) => {
    switch (status) {
        case ACCOUNT_STATUS.ACTIVE:
        case ACCOUNT_STATUS.INACTIVE:
            return [
                { status: ACCOUNT_STATUS.SUSPENDED, label: 'Tạm khóa', variant: 'warning' },
                { status: ACCOUNT_STATUS.BANNED, label: 'Cấm vĩnh viễn', variant: 'danger' },
            ];
        case ACCOUNT_STATUS.SUSPENDED:
            return [
                { status: ACCOUNT_STATUS.ACTIVE, label: 'Mở khóa (Restore)', variant: 'primary' },
                { status: ACCOUNT_STATUS.BANNED, label: 'Cấm vĩnh viễn', variant: 'danger' },
            ];
        case ACCOUNT_STATUS.BANNED:
            return [
                { status: ACCOUNT_STATUS.ACTIVE, label: 'Gỡ cấm (Unban)', variant: 'primary' },
            ];
        default:
            return [];
    }
};
