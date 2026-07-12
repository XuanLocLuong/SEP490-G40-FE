import { toast } from 'react-toastify';

const MESSAGES = {
    save: 'Vui lòng đăng nhập để lưu việc làm.',
    apply: 'Vui lòng đăng nhập để ứng tuyển.',
};

export const notifyLoginRequired = (action) => {
    toast.error(MESSAGES[action] ?? 'Vui lòng đăng nhập để tiếp tục.');
};
