import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/authContext.js';
import { ROUTES } from '../../routes/path.js';
import { USER_ROLES } from '../../utils/Constants.jsx';
import { setBookmarkReturnPath } from '../../utils/bookmarkStorage.js';
import { notifyLoginRequired } from '../../utils/notifyLoginRequired.js';
import { openChatPanel } from '../../utils/chatEvents.js';
import { ChatIcon } from '../common/icons.jsx';

const JobChatButton = ({
    jobId,
    className,
    label = 'Chat với Nhà tuyển dụng',
    guestLabel = 'Đăng nhập để chat',
}) => {
    const { auth } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const buttonLabel = auth ? label : guestLabel;

    if (auth && auth.role !== USER_ROLES.CANDIDATE) {
        return null;
    }

    const handleClick = (e) => {
        e.stopPropagation();

        if (!auth) {
            notifyLoginRequired('chat');
            setBookmarkReturnPath(`${location.pathname}${location.search}`);
            navigate(ROUTES.LOGIN);
            return;
        }

        // Phase 1: open header chat box (conversation list). Deep-link by job later.
        void jobId;
        openChatPanel({ jobId });
    };

    return (
        <button
            type="button"
            className={className}
            onClick={handleClick}
            title={auth ? label : guestLabel}
        >
            <ChatIcon width={18} height={18} />
            {buttonLabel}
        </button>
    );
};

export default JobChatButton;
