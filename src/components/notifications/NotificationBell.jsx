import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BellIcon } from '../common/icons.jsx';
import { useAuth } from '../../contexts/authContext.js';
import { useNotifications } from '../../hooks/useNotifications.js';
import { getNotificationTargetPath } from '../../utils/notificationNavigation.js';
import { tryOpenChatFromNotification } from '../../utils/notificationChat.js';
import { elevateOverlay, OVERLAY_CSS } from '../../utils/overlayLayer.js';
import { invitationsNavigateOptions } from '../../utils/invitationNavReturn.js';
import { ROUTES } from '../../routes/path.js';
import { USER_ROLES } from '../../utils/Constants.jsx';
import NotificationDropdown from './NotificationDropdown.jsx';
import '../../assets/styles/NotificationDropdownStyle.css';

const DROPDOWN_PAGE_SIZE = 10;

const getNotificationsListPath = (role) => {
    if (role === USER_ROLES.RECRUITER) return ROUTES.RECRUITER_NOTIFICATIONS;
    return ROUTES.CANDIDATE_NOTIFICATIONS;
};

const NotificationBell = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { auth } = useAuth();
    const rootRef = useRef(null);
    const [open, setOpen] = useState(false);
    const {
        items,
        unreadCount,
        loading,
        error,
        loadInitial,
        markOneRead,
        markAllRead,
    } = useNotifications({ enabled: true, pageSize: DROPDOWN_PAGE_SIZE });

    useEffect(() => {
        if (!open) return undefined;

        elevateOverlay(OVERLAY_CSS.HEADER);
        loadInitial();

        const handlePointerDown = (event) => {
            if (rootRef.current && !rootRef.current.contains(event.target)) {
                setOpen(false);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key !== 'Escape') return;
            setOpen(false);
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open, loadInitial]);

    const handleToggle = () => {
        setOpen((prev) => {
            const next = !prev;
            if (next) elevateOverlay(OVERLAY_CSS.HEADER);
            return next;
        });
    };

    const handleSelect = async (notification) => {
        await markOneRead(notification.id);
        await tryOpenChatFromNotification(notification, auth?.role);
        const path = getNotificationTargetPath(notification, auth?.role);
        setOpen(false);
        if (path) {
            navigate(path, invitationsNavigateOptions(path, location));
        }
    };

    const handleViewAll = () => {
        setOpen(false);
        navigate(getNotificationsListPath(auth?.role));
    };

    const badgeLabel =
        unreadCount > 99 ? '99+' : unreadCount > 0 ? String(unreadCount) : '';

    return (
        <div className="notification-bell" ref={rootRef}>
            <button
                type="button"
                className="site-header__icon-btn notification-bell__trigger"
                aria-label="Thông báo"
                aria-expanded={open}
                aria-haspopup="dialog"
                onClick={handleToggle}
            >
                <BellIcon />
                {badgeLabel ? (
                    <span className="notification-bell__badge" aria-hidden="true">
                        {badgeLabel}
                    </span>
                ) : null}
            </button>

            {open && (
                <NotificationDropdown
                    items={items}
                    loading={loading}
                    error={error}
                    unreadCount={unreadCount}
                    onMarkAllRead={markAllRead}
                    onSelect={handleSelect}
                    onMarkRead={markOneRead}
                    onViewAll={handleViewAll}
                />
            )}
        </div>
    );
};

export default NotificationBell;
