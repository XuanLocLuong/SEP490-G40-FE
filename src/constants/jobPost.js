/**
 * Hằng số dùng chung cho màn đăng tin tuyển dụng (recruiter).
 * Skill catalog: GET /api/v1/jobs/skills (không hardcode FE).
 * JobType catalog: GET /api/v1/jobs/types — JOB_TYPE_OPTIONS chỉ dùng fallback / format label.
 */

export const JOB_POST_ACTION = {
    SAVE_DRAFT: 'SAVE_DRAFT',
    SUBMIT: 'SUBMIT',
};

/** Fallback FE khi chưa load được danh mục active từ GET /api/v1/jobs/types. */
export const JOB_TYPE_OPTIONS = [
    { value: 'FNB_SERVICE', label: 'F&B & Dịch vụ' },
    { value: 'RETAIL', label: 'Bán hàng & Bán lẻ' },
    { value: 'LOGISTICS_DELIVERY', label: 'Kho vận & Giao hàng' },
    { value: 'EDUCATION', label: 'Giáo dục' },
    { value: 'EVENT_PROMOTION', label: 'Sự kiện & Promotion' },
    { value: 'OFFICE_CSA', label: 'Văn phòng & Chăm sóc khách hàng' },
    { value: 'FREELANCE', label: 'Freelance' },
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

export const ALL_DAY_VALUES = DAY_OF_WEEK_OPTIONS.map((d) => d.value);

/** Preset chọn nhanh ngày trong JobShiftFields */
export const DAY_PRESETS = [
    { id: 'weekday', label: 'T2–T6', days: ['2', '3', '4', '5', '6'] },
    { id: 'weekend', label: 'T7–CN', days: ['7', '8'] },
    { id: 'all', label: 'Cả tuần', days: ALL_DAY_VALUES },
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
