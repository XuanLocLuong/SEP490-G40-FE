import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

export const BANNED_LIST_TYPES = {
    REVIEW_WORDS: 'review-banned-words',
    JOB_KEYWORDS: 'job-blacklist-keywords',
    JOB_URLS: 'job-blacklist-urls',
};

export const BANNED_LIST_TABS = [
    {
        type: BANNED_LIST_TYPES.REVIEW_WORDS,
        label: 'Từ cấm trong review',
        itemLabel: 'từ cấm',
        placeholder: 'vd: toxic, lăng mạ',
        subtitle: 'Từ bị cấm trong nội dung đánh giá (review).',
    },
    {
        type: BANNED_LIST_TYPES.JOB_KEYWORDS,
        label: 'Từ cấm tin job',
        itemLabel: 'từ cấm',
        placeholder: 'vd: lừa đảo, ponzi',
        subtitle: 'Từ bị cấm trong title/description tin tuyển dụng.',
    },
    {
        type: BANNED_LIST_TYPES.JOB_URLS,
        label: 'URL cấm tin job',
        itemLabel: 'URL cấm',
        placeholder: 'vd: scam-site.com',
        subtitle: 'URL bị cấm trong tin tuyển dụng.',
    },
];

const BASE = `${API_PREFIX}/admin/banned-lists`;

const ERROR_MESSAGES = {
    BANNED_LIST_TYPE_INVALID: 'Loại danh sách cấm không hợp lệ.',
    BANNED_LIST_VALUE_EMPTY: 'Giá trị không được để trống.',
    BANNED_LIST_ITEM_NOT_FOUND: 'Không tìm thấy mục trong danh sách cấm.',
    BANNED_LIST_ITEM_ALREADY_EXISTS: 'Mục này đã tồn tại trong danh sách cấm.',
};

export const getBannedListApiErrorMessage = (error, fallback = 'Có lỗi xảy ra') => {
    const raw = error?.response?.data?.message || error?.response?.data?.code || error?.message || '';
    if (ERROR_MESSAGES[raw]) return ERROR_MESSAGES[raw];
    return raw || fallback;
};

const unwrapItems = (response) => {
    const data = response?.data?.data ?? response?.data;
    const items = data?.items;
    return Array.isArray(items)
        ? items.map((item) => String(item).trim().toLowerCase()).filter(Boolean)
        : [];
};

const typePath = (type) => `${BASE}/${type}`;

/** GET /admin/banned-lists/{type} → string[] */
export const listBannedListItems = async (type) => {
    const response = await axiosClient.get(typePath(type));
    return unwrapItems(response);
};

/** POST /admin/banned-lists/{type} → string[] */
export const createBannedListItem = async (type, { value, reason }) => {
    const response = await axiosClient.post(typePath(type), { value, reason });
    return unwrapItems(response);
};

/** PUT /admin/banned-lists/{type} → string[] */
export const updateBannedListItem = async (type, { oldValue, newValue, reason }) => {
    const response = await axiosClient.put(typePath(type), { oldValue, newValue, reason });
    return unwrapItems(response);
};

/** DELETE /admin/banned-lists/{type} (JSON body) → string[] */
export const deleteBannedListItem = async (type, { value, reason }) => {
    const response = await axiosClient.delete(typePath(type), { data: { value, reason } });
    return unwrapItems(response);
};
