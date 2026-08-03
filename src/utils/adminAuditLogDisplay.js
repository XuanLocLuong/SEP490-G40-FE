import { getAccountStatusLabel, getUserRoleLabel } from './adminAccountDisplay.js';

export const AUDIT_RESULT = {
    SUCCESS: 'SUCCESS',
    FAILURE: 'FAILURE',
    FAILED: 'FAILED',
    DENIED: 'DENIED',
    ERROR: 'ERROR',
};

export const AUDIT_RESULT_LABELS = {
    SUCCESS: 'Thành công',
    FAILURE: 'Thất bại',
    FAILED: 'Thất bại',
    DENIED: 'Từ chối',
    ERROR: 'Lỗi',
};

export const AUDIT_RESULT_OPTIONS = [
    { value: '', label: 'Tất cả kết quả' },
    { value: 'SUCCESS', label: 'Thành công' },
    { value: 'FAILURE', label: 'Thất bại' },
    { value: 'DENIED', label: 'Từ chối' },
    { value: 'ERROR', label: 'Lỗi' },
];

export const AUDIT_ACTION_LABELS = {
    CHANGE_ACCOUNT_STATUS: 'Đổi trạng thái tài khoản',
    REVOKE_SESSIONS: 'Thu hồi phiên đăng nhập',
    CREATE_INTERNAL_STAFF: 'Tạo staff nội bộ',
    CHANGE_PRIMARY_ROLE: 'Đổi role',
    UPDATE_SYSTEM_CONFIGURATION: 'Cập nhật cấu hình hệ thống',
};

export const AUDIT_ACTION_OPTIONS = [
    { value: '', label: 'Tất cả hành động' },
    { value: 'CHANGE_ACCOUNT_STATUS', label: AUDIT_ACTION_LABELS.CHANGE_ACCOUNT_STATUS },
    { value: 'REVOKE_SESSIONS', label: AUDIT_ACTION_LABELS.REVOKE_SESSIONS },
    { value: 'CREATE_INTERNAL_STAFF', label: AUDIT_ACTION_LABELS.CREATE_INTERNAL_STAFF },
    { value: 'CHANGE_PRIMARY_ROLE', label: AUDIT_ACTION_LABELS.CHANGE_PRIMARY_ROLE },
    { value: 'UPDATE_SYSTEM_CONFIGURATION', label: AUDIT_ACTION_LABELS.UPDATE_SYSTEM_CONFIGURATION },
];

export const AUDIT_TARGET_TYPE_OPTIONS = [
    { value: '', label: 'Tất cả đối tượng' },
    { value: 'User', label: 'User' },
    { value: 'SYSTEM_CONFIG', label: 'System config' },
];

export const getAuditActionLabel = (action) => AUDIT_ACTION_LABELS[action] || action || '—';

export const getAuditResultLabel = (result) => AUDIT_RESULT_LABELS[result] || result || '—';

export const getAuditResultTone = (result) => {
    const value = String(result || '').toUpperCase();
    if (value === 'SUCCESS') return 'success';
    if (value === 'DENIED') return 'warning';
    if (value === 'FAILURE' || value === 'FAILED' || value === 'ERROR') return 'danger';
    return 'unknown';
};

export const getAuditActorDisplay = (log) => {
    const name = log?.actorName?.trim();
    if (!name || name === 'System/Unknown') {
        return {
            name: 'System/Unknown',
            email: log?.actorEmail || '',
            isSystem: true,
        };
    }
    return {
        name,
        email: log?.actorEmail || '',
        isSystem: false,
    };
};

export const getAuditActorInitials = (name) => {
    const text = String(name || '').trim();
    if (!text || text === 'System/Unknown') return 'SY';
    const parts = text.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
};

export const formatAuditDateTime = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString('vi-VN');
};

/** date input YYYY-MM-DD → ISO Instant start/end of day (local). */
export const toAuditInstantFromDate = (dateValue, endOfDay = false) => {
    if (!dateValue) return undefined;
    const suffix = endOfDay ? 'T23:59:59.999' : 'T00:00:00.000';
    const date = new Date(`${dateValue}${suffix}`);
    if (Number.isNaN(date.getTime())) return undefined;
    return date.toISOString();
};

const AUDIT_VALUE_FIELD_LABELS = {
    status: 'Trạng thái',
    role: 'Role',
    email: 'Email',
    reason: 'Lý do',
    fullName: 'Họ tên',
    phone: 'Số điện thoại',
};

/** Parse BE oldValue/newValue (object hoặc JSON string) thành object thuần. */
export const parseAuditValuePayload = (raw) => {
    if (raw == null || raw === '') return null;
    if (typeof raw === 'object') {
        if (Array.isArray(raw)) return { value: raw };
        return raw;
    }
    const text = String(raw).trim();
    if (!text) return null;
    try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
        return { value: parsed };
    } catch {
        return { value: text };
    }
};

export const formatAuditFieldValue = (key, value) => {
    if (value == null || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Có' : 'Không';
    if (typeof value === 'object') {
        try {
            return JSON.stringify(value);
        } catch {
            return String(value);
        }
    }
    const text = String(value);
    if (key === 'status') return getAccountStatusLabel(text);
    if (key === 'role') return getUserRoleLabel(text);
    return text;
};

/**
 * Chuẩn hóa old/new value thành danh sách { label, value } để hiển thị (không raw JSON).
 * Trả về [] nếu không có dữ liệu.
 */
export const getAuditValueEntries = (raw) => {
    const payload = parseAuditValuePayload(raw);
    if (!payload) return [];

    return Object.entries(payload).map(([key, value]) => ({
        key,
        label: AUDIT_VALUE_FIELD_LABELS[key] || key,
        value: formatAuditFieldValue(key, value),
    }));
};

export const tryFormatJsonValue = (raw) => {
    if (raw == null || raw === '') return null;
    if (typeof raw === 'object') {
        try {
            return JSON.stringify(raw, null, 2);
        } catch {
            return String(raw);
        }
    }
    const text = String(raw);
    try {
        return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
        return text;
    }
};
