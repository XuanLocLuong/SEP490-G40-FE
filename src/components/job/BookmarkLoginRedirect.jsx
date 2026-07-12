import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/authContext.js';
import { USER_ROLES } from '../../utils/Constants.jsx';
import { consumeBookmarkReturnPath, peekBookmarkReturnPath } from '../../utils/bookmarkStorage.js';

/**
 * Chạy trên trang guest job (landing, job list).
 * Sau khi candidate đăng nhập xong và quay lại, tự navigate về URL đã lưu khi bấm bookmark.
 */
const BookmarkLoginRedirect = () => {
    const { auth } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!auth || auth.role !== USER_ROLES.CANDIDATE) {
            return;
        }

        const returnPath = peekBookmarkReturnPath();
        if (!returnPath) {
            return;
        }

        const currentPath = `${location.pathname}${location.search}`;
        if (currentPath === returnPath) {
            consumeBookmarkReturnPath();
            return;
        }

        consumeBookmarkReturnPath();
        navigate(returnPath, { replace: true });
    }, [auth, location.pathname, location.search, navigate]);

    return null;
};

export default BookmarkLoginRedirect;
