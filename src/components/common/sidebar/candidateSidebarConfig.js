import { ROUTES } from '../../../routes/path.js';
import {
    BellIcon,
    BriefcaseIcon,
    ChatIcon,
    FileTextIcon,
    SparklesIcon,
} from '../icons.jsx';

/** Sidebar Candidate — chức năng nghiệp vụ, không đặt trong avatar dropdown. */
export const getCandidateSidebarItems = () => [
    { path: ROUTES.CANDIDATE_PROFILE, label: 'Hồ sơ của tôi', icon: FileTextIcon },
    { path: ROUTES.CANDIDATE_AI_SUGGESTIONS, label: 'AI Gợi ý việc làm', icon: SparklesIcon },
    { path: ROUTES.CANDIDATE_APPLICATION_HISTORY, label: 'Lịch sử ứng tuyển', icon: BriefcaseIcon },
    { path: ROUTES.CANDIDATE_INVITATIONS, label: 'Lời mời', icon: BriefcaseIcon },
    { path: ROUTES.CANDIDATE_MESSAGES, label: 'Tin nhắn', icon: ChatIcon },
    { path: ROUTES.CANDIDATE_NOTIFICATIONS, label: 'Thông báo', icon: BellIcon },
];
