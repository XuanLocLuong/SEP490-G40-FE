import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/authContext.js';
import { saveJob, unsaveJob } from '../../apis/JobApi.jsx';
import { ROUTES } from '../../routes/path.js';
import { USER_ROLES } from '../../utils/Constants.jsx';
import { setBookmarkReturnPath } from '../../utils/bookmarkStorage.js';
import { notifyLoginRequired } from '../../utils/notifyLoginRequired.js';
import { BookmarkIcon } from '../common/icons.jsx';

const JobBookmarkButton = ({ jobId, className }) => {
    const { auth } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(false);

    if (auth && auth.role !== USER_ROLES.CANDIDATE) {
        return null;
    }

    const handleClick = async (e) => {
        e.stopPropagation();

        if (!auth) {
            notifyLoginRequired('save');
            setBookmarkReturnPath(`${location.pathname}${location.search}`);
            navigate(ROUTES.LOGIN);
            return;
        }

        setLoading(true);
        try {
            if (saved) {
                await unsaveJob(jobId);
                setSaved(false);
            } else {
                await saveJob(jobId);
                setSaved(true);
            }
        } catch {
            // Giữ nguyên trạng thái nếu API lỗi.
        } finally {
            setLoading(false);
        }
    };

    const label = saved ? 'Bỏ lưu việc làm' : 'Lưu việc làm';

    return (
        <button
            type="button"
            className={`${className}${saved ? ` ${className}--saved` : ''}`}
            onClick={handleClick}
            disabled={loading}
            aria-label={label}
            title={auth ? label : 'Đăng nhập để lưu việc làm'}
        >
            <BookmarkIcon width={18} height={18} />
        </button>
    );
};

export default JobBookmarkButton;
