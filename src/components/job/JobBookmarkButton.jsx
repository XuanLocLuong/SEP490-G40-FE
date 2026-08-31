import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/authContext.js';
import { saveJob, unsaveJob } from '../../apis/JobApi.jsx';
import { ROUTES } from '../../routes/path.js';
import { USER_ROLES } from '../../utils/Constants.jsx';
import { setBookmarkReturnPath } from '../../utils/bookmarkStorage.js';
import {
    emitJobBookmarkChanged,
    JOB_BOOKMARK_CHANGED_EVENT,
} from '../../utils/jobBookmarkEvents.js';
import { BookmarkIcon } from '../common/icons.jsx';

const JobBookmarkButton = ({
    jobId,
    className,
    initialSaved = false,
    onSavedChange,
}) => {
    const { auth } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [savedOverride, setSavedOverride] = useState(null);
    const [loading, setLoading] = useState(false);
    const normalizedJobId = Number(jobId);
    const normalizedInitialSaved = Boolean(initialSaved);
    const saved =
        savedOverride?.jobId === normalizedJobId &&
        savedOverride?.baseSaved === normalizedInitialSaved
            ? savedOverride.saved
            : normalizedInitialSaved;

    useEffect(() => {
        const handleBookmarkChanged = (event) => {
            if (Number(event.detail?.jobId) !== normalizedJobId) return;
            setSavedOverride({
                jobId: normalizedJobId,
                baseSaved: normalizedInitialSaved,
                saved: Boolean(event.detail?.saved),
            });
        };
        window.addEventListener(JOB_BOOKMARK_CHANGED_EVENT, handleBookmarkChanged);
        return () =>
            window.removeEventListener(JOB_BOOKMARK_CHANGED_EVENT, handleBookmarkChanged);
    }, [normalizedInitialSaved, normalizedJobId]);

    if (auth && auth.role !== USER_ROLES.CANDIDATE) {
        return null;
    }

    const handleClick = async (e) => {
        e.stopPropagation();

        if (!auth) {
            const returnPath = `${location.pathname}${location.search}`;
            setBookmarkReturnPath(returnPath);
            navigate(ROUTES.LOGIN, { state: { from: returnPath } });
            return;
        }

        setLoading(true);
        try {
            const nextSaved = !saved;
            if (saved) {
                await unsaveJob(jobId);
            } else {
                await saveJob(jobId);
            }
            setSavedOverride({
                jobId: normalizedJobId,
                baseSaved: normalizedInitialSaved,
                saved: nextSaved,
            });
            emitJobBookmarkChanged(jobId, nextSaved);
            onSavedChange?.(jobId, nextSaved);
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
