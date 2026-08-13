import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getDocumentTitleForLocation } from '../../utils/documentTitles.js';

/** Cập nhật document.title theo route (tiếng Việt + JobLink). */
const DocumentTitle = () => {
    const location = useLocation();

    useEffect(() => {
        document.title = getDocumentTitleForLocation(location.pathname, location.search);
    }, [location.pathname, location.search]);

    return null;
};

export default DocumentTitle;
