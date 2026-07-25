import { formatNotificationCalendarTime } from '../../utils/notificationNavigation.js';

const NotificationItem = ({ notification, onSelect, onMarkRead }) => {
    const unread = !notification.read;
    const title = notification.title?.trim() || '';
    const content = notification.content?.trim() || '';
    const readLabel = unread ? 'Chưa đọc' : 'Đã đọc';
    const calendar = formatNotificationCalendarTime(notification.createdAt);

    const handleMarkRead = (event) => {
        event.preventDefault();
        event.stopPropagation();
        onMarkRead?.(notification.id);
    };

    return (
        <div
            className={`notification-item${unread ? ' notification-item--unread' : ''}`}
        >
            <button
                type="button"
                className="notification-item__main"
                onClick={() => onSelect?.(notification)}
            >
                <span className="notification-item__body">
                    <span className="notification-item__message-row">
                        <span
                            className={`notification-item__dot${unread ? '' : ' notification-item__dot--empty'}`}
                            aria-hidden="true"
                        />
                        <span className="notification-item__text">
                            {title ? (
                                <span className="notification-item__title">{title}</span>
                            ) : null}
                            {content && content !== title ? (
                                <span className="notification-item__message">{content}</span>
                            ) : null}
                            {!title && !content ? (
                                <span className="notification-item__message">Thông báo</span>
                            ) : null}
                        </span>
                    </span>
                    <span className="notification-item__meta">
                        {calendar}
                        {calendar ? (
                            <span className="notification-item__meta-sep" aria-hidden="true">
                                ·
                            </span>
                        ) : null}
                        <span
                            className={`notification-item__read${unread ? ' notification-item__read--unread' : ''}`}
                        >
                            {readLabel}
                        </span>
                    </span>
                </span>
            </button>

            {unread && onMarkRead ? (
                <button
                    type="button"
                    className="notification-item__mark-read"
                    onClick={handleMarkRead}
                >
                    Đánh dấu đã đọc
                </button>
            ) : null}
        </div>
    );
};

export default NotificationItem;
