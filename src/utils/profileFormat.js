// Helper format hiển thị cho Candidate Profile.
export { JOB_TYPE_OPTIONS } from '../constants/jobPost.js';
import { JOB_TYPE_OPTIONS } from '../constants/jobPost.js';

export const GENDER_OPTIONS = [
    { value: 'MALE', label: 'Nam' },
    { value: 'FEMALE', label: 'Nữ' },
    { value: 'OTHER', label: 'Khác' },
];

/** Fallback khớp enum BE EducationLevel khi GET /education-levels lỗi. */
export const EDUCATION_LEVEL_OPTIONS = [
    { value: 'THCS', label: 'THCS', order: 1 },
    { value: 'THPT', label: 'THPT', order: 2 },
    { value: 'TRUNG_CAP', label: 'Trung cấp', order: 3 },
    { value: 'CAO_DANG', label: 'Cao đẳng', order: 4 },
    { value: 'DAI_HOC', label: 'Đại học', order: 5 },
    { value: 'SAU_DAI_HOC', label: 'Sau đại học', order: 6 },
];

export const getEducationLevelLabel = (value, options = EDUCATION_LEVEL_OPTIONS) => {
    if (!value) return '';
    const code = String(value).trim();
    const found = options.find(
        (e) => e.value === code || String(e.value).toUpperCase() === code.toUpperCase()
    );
    return found ? found.label : code;
};

export const getGenderLabel = (value) => {
    if (!value) return '';
    const found = GENDER_OPTIONS.find((g) => g.value === value || g.label === value);
    return found ? found.label : value;
};

export const getJobTypeLabel = (value) => {
    if (!value) return '';
    const found = JOB_TYPE_OPTIONS.find((t) => t.value === value || t.label === value);
    return found ? found.label : value;
};

// Chuyển giá trị ngày bất kỳ (ISO, timestamp) -> dd/MM/yyyy. Rỗng => ''.
export const formatDate = (value) => {
    if (!value) return '';
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        const [year, month, day] = value.slice(0, 10).split('-');
        return `${day}/${month}/${year}`;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(date);
};

// dd/MM/yyyy hoặc ISO -> yyyy-MM-dd cho <input type="date">.
export const toDateInputValue = (value) => {
    if (!value) return '';
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        return value.slice(0, 10);
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
};

// MM/yyyy cho hiển thị khoảng thời gian kinh nghiệm.
export const formatMonthYear = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('vi-VN', { month: '2-digit', year: 'numeric' }).format(date);
};

export const toMonthInputValue = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 7);
};

// Định dạng lương "25k - 30k /giờ". Không có dữ liệu => ''.
// salaryUnit nếu còn trong data cũ sẽ bị bỏ qua — luôn hiển thị /giờ.
export const formatSalaryRange = ({ salaryMin, salaryMax } = {}) => {
    const fmt = (n) => {
        if (n == null || n === '') return null;
        const num = Number(n);
        if (Number.isNaN(num)) return null;
        return num >= 1000 ? `${num / 1000}k` : String(num);
    };
    const min = fmt(salaryMin);
    const max = fmt(salaryMax);
    const unit = ' /giờ';
    if (min && max) return `${min} - ${max}${unit}`;
    if (min) return `Từ ${min}${unit}`;
    if (max) return `Đến ${max}${unit}`;
    return '';
};

// Lấy chữ cái đầu làm avatar fallback khi chưa có ảnh.
export const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    const last = parts[parts.length - 1] || '';
    return last.charAt(0).toUpperCase() || '?';
};

export const clampPercent = (value) => {
    const num = Number(value);
    if (Number.isNaN(num)) return 0;
    return Math.max(0, Math.min(100, Math.round(num)));
};

// Kiểm tra URL avatar có phải là ảnh thật do người dùng upload không (loại bỏ các link mặc định/placeholder từ BE)
export const isValidAvatarUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    if (!trimmed) return false;
    const lower = trimmed.toLowerCase();
    if (
        lower === 'null' ||
        lower === 'undefined' ||
        lower === 'none' ||
        lower === 'default' ||
        lower.includes('default-avatar') ||
        lower.includes('default_avatar') ||
        lower.includes('assets/default')
    ) {
        return false;
    }
    return (
        trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('blob:') ||
        trimmed.startsWith('data:')
    );
};
