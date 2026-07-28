import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/authContext.js';
import { ROUTES } from '../../routes/path.js';
import { USER_ROLES } from '../../utils/Constants.jsx';
import { setBookmarkReturnPath } from '../../utils/bookmarkStorage.js';
import { notifyLoginRequired } from '../../utils/notifyLoginRequired.js';
import { openChatPanel } from '../../utils/chatEvents.js';
import { ChatIcon } from '../common/icons.jsx';

const JobChatButton = ({
    jobId,
    otherUserId,
    className,
    label = 'Chat với Nhà tuyển dụng',
    guestLabel = 'Đăng nhập để chat',
}) => {
    const { auth } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const buttonLabel = auth ? label : guestLabel;
    const hasPeer = otherUserId != null && otherUserId !== '';

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

        if (!hasPeer) {
            toast.error('Không xác định được nhà tuyển dụng để mở chat.');
            return;
        }

        openChatPanel({
            jobId: jobId ?? null,
            otherUserId,
        });
    };

    return (
        <button
            type="button"
            className={className}
            onClick={handleClick}
            title={
                auth && !hasPeer
                    ? 'Thiếu thông tin nhà tuyển dụng để chat'
                    : auth
                      ? label
                      : guestLabel
            }
            disabled={Boolean(auth) && !hasPeer}
        >
            <ChatIcon width={18} height={18} />
            {buttonLabel}
        </button>
    );
};

export default JobChatButton;
