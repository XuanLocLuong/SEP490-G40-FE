import * as api from '../apis/CandidateWorkHistoryApi.jsx';

const unwrap = (res) => res?.data?.data ?? res?.data ?? null;
const toArray = (value) => (Array.isArray(value) ? value : []);

const toDateOrEmpty = (value) => {
    if (!value) return '';
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        return value.slice(0, 10);
    }
    return '';
};

export const normalizeWorkHistory = (raw = {}) => ({
    id: raw.id ?? null,
    jobTitle: raw.jobTitle || '',
    organization: raw.organization || '',
    startDate: toDateOrEmpty(raw.startDate),
    endDate: raw.endDate ? toDateOrEmpty(raw.endDate) : null,
    description: raw.description || '',
});

export const toWorkHistoryPayload = ({
    jobTitle,
    organization,
    startDate,
    endDate,
    description,
} = {}) => ({
    jobTitle: (jobTitle || '').trim(),
    organization: (organization || '').trim(),
    startDate: toDateOrEmpty(startDate),
    endDate: endDate ? toDateOrEmpty(endDate) : null,
    description: (description || '').trim() || null,
});

export const getWorkHistoryErrorMessage = (error, fallback = 'Không lưu được kinh nghiệm làm việc.') => {
    const code = error?.response?.data?.message || error?.response?.data?.code;
    const map = {
        WORK_HISTORY_NOT_FOUND: 'Không tìm thấy kinh nghiệm làm việc này.',
        START_DATE_NOT_IN_PAST: 'Ngày bắt đầu phải trước hôm nay.',
        START_DATE_AFTER_END_DATE: 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.',
        END_DATE_REQUIRED: 'Vui lòng chọn ngày kết thúc.',
        END_DATE_NOT_IN_PAST: 'Ngày kết thúc không hợp lệ.',
    };
    if (typeof code === 'string' && map[code]) return map[code];
    if (error?.response?.status === 400) {
        return 'Dữ liệu kinh nghiệm không hợp lệ. Kiểm tra các trường bắt buộc và khoảng thời gian.';
    }
    return fallback;
};

export const fetchWorkHistories = async () =>
    toArray(unwrap(await api.getWorkHistories())).map(normalizeWorkHistory);

export const saveWorkHistory = async (id, form) => {
    const payload = toWorkHistoryPayload(form);
    const res = id
        ? await api.updateWorkHistory(id, payload)
        : await api.createWorkHistory(payload);
    return normalizeWorkHistory(unwrap(res));
};

export const removeWorkHistory = async (id) => {
    await api.deleteWorkHistory(id);
};
