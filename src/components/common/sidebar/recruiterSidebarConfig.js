import { ROUTES } from '../../../routes/path.js';
import {
    ChartIcon,
    ChatIcon,
    GridIcon,
    ListIcon,
    PlusSquareIcon,
    SparklesIcon,
    StarIcon,
    UsersIcon,
} from '../icons.jsx';

/** Sidebar Recruiter — chức năng nghiệp vụ; hồ sơ NTĐ nằm ở avatar dropdown. */
export const getRecruiterSidebarItems = () => [
    { path: ROUTES.RECRUITER_HOME, label: 'Tổng quan', icon: GridIcon },
    { path: ROUTES.RECRUITER_CREATE_JOB, label: 'Đăng tin', icon: PlusSquareIcon },
    { path: ROUTES.RECRUITER_MY_JOBS, label: 'Tin của tôi', icon: ListIcon },
    { path: ROUTES.RECRUITER_APPLICANTS, label: 'Ứng viên', icon: UsersIcon },
    { path: ROUTES.RECRUITER_AI_SUGGESTIONS, label: 'AI Gợi ý', icon: SparklesIcon },
    { path: ROUTES.RECRUITER_ANALYTICS, label: 'Thống kê', icon: ChartIcon },
    { path: ROUTES.RECRUITER_MESSAGES, label: 'Tin nhắn', icon: ChatIcon },
    { path: ROUTES.RECRUITER_TRUST_SCORE, label: 'Điểm uy tín', icon: StarIcon },
    { path: ROUTES.RECRUITER_ALL_JOBS, label: 'Tất cả tin tuyển dụng', icon: ListIcon },
];
