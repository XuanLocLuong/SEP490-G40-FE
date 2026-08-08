import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import NotificationItem from '../../components/notifications/NotificationItem.jsx';
import { useAuth } from '../../contexts/authContext.js';
import { useNotifications } from '../../hooks/useNotifications.js';
import { getNotificationTargetPath } from '../../utils/notificationNavigation.js';
import { tryOpenChatFromNotification } from '../../utils/notificationChat.js';
import { invitationsNavigateOptions } from '../../utils/invitationNavReturn.js';
import '../../assets/styles/NotificationDropdownStyle.css';
import '../../assets/styles/CandidateNotificationsPageStyle.css';

const PAGE_SIZE = 20;

const FILTERS = [
    { id: 'all', label: 'Tất cả', isRead: null },
    { id: 'unread', label: 'Chưa đọc', isRead: false },
    { id: 'read', label: 'Đã đọc', isRead: true },
];

const CandidateNotificationsPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { auth } = useAuth();
    const [filterId, setFilterId] = useState('all');
    const activeFilter = FILTERS.find((f) => f.id === filterId) ?? FILTERS[0];

    const {
        items,
        unreadCount,
        totalCount,
        readCount,
        loading,
        loadingMore,
        error,
        hasMore,
        loadMore,
        markOneRead,
        markAllRead,
    } = useNotifications({
        enabled: true,
        pageSize: PAGE_SIZE,
        autoLoad: true,
        isRead: activeFilter.isRead,
    });

    const handleSelect = async (notification) => {
        await markOneRead(notification.id);
        await tryOpenChatFromNotification(notification, auth?.role);
        const path = getNotificationTargetPath(notification, auth?.role);
        if (path) {
            navigate(path, invitationsNavigateOptions(path, location));
        }
    };

    const emptyMessage =
        filterId === 'unread'
            ? 'Không có thông báo chưa đọc.'
            : filterId === 'read'
              ? 'Không có thông báo đã đọc.'
              : 'Chưa có thông báo nào.';

    const tabCount = (tabId) => {
        if (tabId === 'all') return totalCount;
        if (tabId === 'unread') return unreadCount;
        return readCount;
    };

    return (
        <div className="cn-page">
            <header className="cn-page__header">
                <div>
                    <h1 className="cn-page__title">Thông báo</h1>
                    <p className="cn-page__subtitle">
                        {unreadCount > 0
                            ? `${unreadCount} thông báo chưa đọc`
                            : 'Tất cả thông báo của bạn'}
                    </p>
                </div>
                <button
                    type="button"
                    className="cn-page__mark-all"
                    onClick={markAllRead}
                    disabled={unreadCount <= 0}
                >
                    Đánh dấu tất cả đã đọc
                </button>
            </header>

            <div className="cn-page__filters" role="tablist" aria-label="Lọc thông báo">
                {FILTERS.map((tab) => {
                    const active = filterId === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            className={`cn-page__filter${active ? ' cn-page__filter--active' : ''}`}
                            onClick={() => setFilterId(tab.id)}
                        >
                            {tab.label}
                            <span className="cn-page__filter-count">{tabCount(tab.id)}</span>
                        </button>
                    );
                })}
            </div>

            {loading && items.length === 0 && (
                <p className="cn-page__state">Đang tải...</p>
            )}

            {!loading && error && items.length === 0 && (
                <p className="cn-page__state cn-page__state--error">{error}</p>
            )}

            {!loading && !error && items.length === 0 && (
                <p className="cn-page__state">{emptyMessage}</p>
            )}

            {items.length > 0 && (
                <div className="cn-page__list-wrap">
                    <ul className="cn-page__list">
                        {items.map((item) => (
                            <li key={item.id}>
                                <NotificationItem
                                    notification={item}
                                    onSelect={handleSelect}
                                    onMarkRead={markOneRead}
                                />
                            </li>
                        ))}
                    </ul>

                    {error ? (
                        <p className="cn-page__inline-error">{error}</p>
                    ) : null}

                    {hasMore ? (
                        <button
                            type="button"
                            className="cn-page__load-more"
                            onClick={loadMore}
                            disabled={loadingMore}
                        >
                            {loadingMore ? 'Đang tải...' : 'Xem thêm'}
                        </button>
                    ) : null}
                </div>
            )}
        </div>
    );
};

export default CandidateNotificationsPage;
