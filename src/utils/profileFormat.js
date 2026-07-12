// Helper format hiển thị cho Candidate Profile.

export const GENDER_OPTIONS = [
    { value: 'MALE', label: 'Nam' },
    { value: 'FEMALE', label: 'Nữ' },
    { value: 'OTHER', label: 'Khác' },
];

export const EDUCATION_LEVEL_OPTIONS = [
    { value: 'HIGH_SCHOOL', label: 'Trung học phổ thông' },
    { value: 'VOCATIONAL', label: 'Trung cấp/Cao đẳng nghề' },
    { value: 'COLLEGE', label: 'Cao đẳng' },
    { value: 'UNIVERSITY', label: 'Đại học' },
];

export const getEducationLevelLabel = (value) => {
    if (!value) return '';
    const found = EDUCATION_LEVEL_OPTIONS.find((e) => e.value === value);
    return found ? found.label : value;
};

export const JOB_TYPE_OPTIONS = [
    { value: 'PART_TIME', label: 'Part-time' },
    { value: 'INTERNSHIP', label: 'Thực tập' },
    { value: 'FULL_TIME', label: 'Full-time' },
    { value: 'FREELANCE', label: 'Freelance' },
    { value: 'SEASONAL', label: 'Thời vụ' },
];

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
export const formatSalaryRange = ({ salaryMin, salaryMax, salaryUnit } = {}) => {
    const fmt = (n) => {
        if (n == null || n === '') return null;
        const num = Number(n);
        if (Number.isNaN(num)) return null;
        return num >= 1000 ? `${num / 1000}k` : String(num);
    };
    const min = fmt(salaryMin);
    const max = fmt(salaryMax);
    const unit = salaryUnit ? ` /${salaryUnit}` : '';
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
