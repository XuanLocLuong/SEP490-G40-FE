import NotificationItem from './NotificationItem.jsx';

const NotificationDropdown = ({
    items,
    loading,
    error,
    unreadCount,
    onMarkAllRead,
    onSelect,
    onMarkRead,
    onViewAll,
}) => (
    <div className="notification-dropdown" role="dialog" aria-label="Thông báo">
        <div className="notification-dropdown__header">
            <h2 className="notification-dropdown__title">Thông báo</h2>
            <button
                type="button"
                className="notification-dropdown__mark-all"
                onClick={onMarkAllRead}
                disabled={unreadCount <= 0}
            >
                Đánh dấu đã đọc
            </button>
        </div>

        <div className="notification-dropdown__body">
            {loading && items.length === 0 && (
                <p className="notification-dropdown__state">Đang tải...</p>
            )}

            {!loading && error && items.length === 0 && (
                <p className="notification-dropdown__state notification-dropdown__state--error">
                    {error}
                </p>
            )}

            {!loading && !error && items.length === 0 && (
                <p className="notification-dropdown__state">Chưa có thông báo nào.</p>
            )}

            {items.length > 0 && (
                <ul className="notification-dropdown__list">
                    {items.map((item) => (
                        <li key={item.id}>
                            <NotificationItem
                                notification={item}
                                onSelect={onSelect}
                                onMarkRead={onMarkRead}
                            />
                        </li>
                    ))}
                </ul>
            )}
        </div>

        <button
            type="button"
            className="notification-dropdown__view-all"
            onClick={onViewAll}
        >
            Xem tất cả
        </button>
    </div>
);

export default NotificationDropdown;
