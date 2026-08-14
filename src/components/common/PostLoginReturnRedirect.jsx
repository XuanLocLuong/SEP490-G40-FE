import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/authContext.js';
import {
    clearBookmarkReturnPath,
    peekBookmarkReturnPath,
} from '../../utils/bookmarkStorage.js';
import { isPostLoginPathAllowed } from '../../utils/authRedirect.js';

const PostLoginReturnRedirect = () => {
    const { auth } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const navigatingToRef = useRef(null);

    useEffect(() => {
        if (!auth) {
            navigatingToRef.current = null;
            return;
        }

        const returnPath = peekBookmarkReturnPath();
        if (!returnPath) return;

        if (!isPostLoginPathAllowed(returnPath, auth.role)) {
            clearBookmarkReturnPath();
            return;
        }

        const currentPath = `${location.pathname}${location.search}${location.hash}`;
        if (currentPath === returnPath) {
            clearBookmarkReturnPath();
            navigatingToRef.current = null;
            return;
        }

        if (navigatingToRef.current === returnPath) return;
        navigatingToRef.current = returnPath;
        navigate(returnPath, { replace: true });
    }, [auth, location.hash, location.pathname, location.search, navigate]);

    return null;
};

export default PostLoginReturnRedirect;
