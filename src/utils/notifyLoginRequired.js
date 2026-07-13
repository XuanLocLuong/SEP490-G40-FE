import { toast } from 'react-toastify';

const MESSAGES = {
    save: 'Vui lòng đăng nhập để lưu việc làm.',
    apply: 'Vui lòng đăng nhập để ứng tuyển.',
    chat: 'Vui lòng đăng nhập để nhắn tin với nhà tuyển dụng.',
};

export const notifyLoginRequired = (action) => {
    toast.error(MESSAGES[action] ?? 'Vui lòng đăng nhập để tiếp tục.');
};
