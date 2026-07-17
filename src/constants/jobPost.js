/**
 * Hằng số dùng chung cho màn đăng tin tuyển dụng (recruiter).
 * Skill catalog lấy từ data.sql — BE chưa có API public cho recruiter.
 */

export const JOB_POST_ACTION = {
    SAVE_DRAFT: 'SAVE_DRAFT',
    SUBMIT: 'SUBMIT',
};

export const JOB_TYPES = [
    { value: 'PART_TIME', label: 'Part-time' },
    { value: 'FULL_TIME', label: 'Full-time' },
    { value: 'INTERN', label: 'Thực tập' },
    { value: 'SEASONAL', label: 'Thời vụ' },
];

/** BE: "2"=T2 … "8"=CN (CandidateSchedule_BusinessRules) */
export const DAY_OF_WEEK_OPTIONS = [
    { value: '2', label: 'T2' },
    { value: '3', label: 'T3' },
    { value: '4', label: 'T4' },
    { value: '5', label: 'T5' },
    { value: '6', label: 'T6' },
    { value: '7', label: 'T7' },
    { value: '8', label: 'CN' },
];

export const SKILLS_CATALOG = [
    { id: 1, name: 'Pha chế' },
    { id: 2, name: 'Thu ngân' },
    { id: 3, name: 'Phục vụ' },
    { id: 4, name: 'Giao tiếp' },
    { id: 5, name: 'Tiếng Anh' },
    { id: 6, name: 'Bán hàng' },
    { id: 7, name: 'Quản lý kho' },
    { id: 8, name: 'Tin học văn phòng' },
];

export const EDITABLE_JOB_STATUSES = ['DRAFT', 'REVISION_REQUESTED'];

export const JOB_STATUS_LABELS = {
    DRAFT: 'Bản nháp',
    PENDING_REVIEW: 'Chờ duyệt',
    OPEN: 'Đang tuyển',
    CLOSED: 'Đã đóng',
    REJECTED: 'Bị từ chối',
    BLOCKED: 'Bị khóa',
    REVISION_REQUESTED: 'Cần chỉnh sửa',
};
