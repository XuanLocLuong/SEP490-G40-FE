import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/authContext.js';
import { ROUTES } from '../../routes/path.js';
import { USER_ROLES } from '../../utils/Constants.jsx';
import { setBookmarkReturnPath } from '../../utils/bookmarkStorage.js';
import { notifyLoginRequired } from '../../utils/notifyLoginRequired.js';
import { ChatIcon } from '../common/icons.jsx';

const CHAT_COMING_SOON_MESSAGE = 'Tính năng chat đang được phát triển.';

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

        // Placeholder: sau này navigate(getCandidateJobChatPath(jobId))
        void jobId;
        toast.info(CHAT_COMING_SOON_MESSAGE);
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
