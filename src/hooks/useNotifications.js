import { useCallback, useEffect, useState } from 'react';
import {
    fetchNotifications,
    fetchNotificationSummary,
    fetchUnreadNotificationCount,
    markAllNotificationsRead,
    markNotificationRead,
} from '../apis/NotificationApi.jsx';

const DEFAULT_PAGE_SIZE = 20;

const EMPTY_SUMMARY = {
    totalCount: 0,
    unreadCount: 0,
    readCount: 0,
};

const unwrapPage = (res, requestedSize) => {
    const pageData = res?.data?.data ?? res?.data;
    const content = Array.isArray(pageData?.content) ? pageData.content : [];
    const pageSize = Number(pageData?.pageSize) || requestedSize || DEFAULT_PAGE_SIZE;
    const hasNext =
        Boolean(pageData?.hasNext ?? pageData?.hasMore) ||
        content.length >= pageSize;
    return {
        content,
        hasNext,
        totalElements: pageData?.totalElements ?? 0,
    };
};

const unwrapCount = (res) => {
    const value = res?.data?.data ?? res?.data;
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
};

const unwrapSummary = (res) => {
    const data = res?.data?.data ?? res?.data ?? {};
    return {
        totalCount: Number(data.totalCount) || 0,
        unreadCount: Number(data.unreadCount) || 0,
        readCount: Number(data.readCount) || 0,
    };
};

const buildListParams = ({ size, beforeId, isRead }) => {
    const params = { size };
    if (beforeId != null) params.beforeId = beforeId;
    if (isRead === true || isRead === false) params.isRead = isRead;
    return params;
};

/**
 * Notification list — BE cursor + optional isRead filter + summary stats.
 * @param {{ enabled?: boolean, pageSize?: number, autoLoad?: boolean, isRead?: boolean|null }} options
 */
export const useNotifications = ({
    enabled = true,
    pageSize = DEFAULT_PAGE_SIZE,
    autoLoad = false,
    isRead = null,
} = {}) => {
    const [items, setItems] = useState([]);
    const [summary, setSummary] = useState(EMPTY_SUMMARY);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');
    const [hasMore, setHasMore] = useState(false);

    const refreshUnreadCount = useCallback(async () => {
        if (!enabled) return;
        try {
            const res = await fetchUnreadNotificationCount();
            const unreadCount = unwrapCount(res);
            setSummary((prev) => ({ ...prev, unreadCount }));
        } catch {
            // Keep last known count on transient errors
        }
    }, [enabled]);

    const refreshSummary = useCallback(async () => {
        if (!enabled) return;
        try {
            const res = await fetchNotificationSummary();
            setSummary(unwrapSummary(res));
        } catch {
            // Keep last known summary
        }
    }, [enabled]);

    const loadInitial = useCallback(async () => {
        if (!enabled) return;
        setLoading(true);
        setError('');
        setItems([]);
        setHasMore(false);
        try {
            const [listRes, summaryRes] = await Promise.all([
                fetchNotifications(buildListParams({ size: pageSize, isRead })),
                fetchNotificationSummary(),
            ]);
            const page = unwrapPage(listRes, pageSize);
            setItems(page.content);
            setHasMore(page.hasNext);
            setSummary(unwrapSummary(summaryRes));
        } catch {
            setError('Không thể tải thông báo. Vui lòng thử lại.');
            setItems([]);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    }, [enabled, isRead, pageSize]);

    const loadMore = useCallback(async () => {
        if (!enabled || loadingMore || !hasMore || items.length === 0) return;
        const beforeId = items[items.length - 1]?.id;
        if (beforeId == null) return;

        setLoadingMore(true);
        try {
            const res = await fetchNotifications(
                buildListParams({ size: pageSize, beforeId, isRead })
            );
            const page = unwrapPage(res, pageSize);
            setItems((prev) => {
                const seen = new Set(prev.map((n) => n.id));
                const next = page.content.filter((n) => !seen.has(n.id));
                return [...prev, ...next];
            });
            setHasMore(page.hasNext);
        } catch {
            setError('Không thể tải thêm thông báo.');
        } finally {
            setLoadingMore(false);
        }
    }, [enabled, hasMore, isRead, items, loadingMore, pageSize]);

    const markOneRead = useCallback(async (id) => {
        const target = items.find((n) => n.id === id);
        if (!target || target.read) return;

        if (isRead === false) {
            setItems((prev) => prev.filter((n) => n.id !== id));
        } else {
            setItems((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: true } : n))
            );
        }
        setSummary((prev) => ({
            ...prev,
            unreadCount: Math.max(0, prev.unreadCount - 1),
            readCount: prev.readCount + 1,
        }));

        try {
            await markNotificationRead(id);
        } catch {
            await loadInitial();
        }
    }, [isRead, items, loadInitial]);

    const markAllRead = useCallback(async () => {
        const prevItems = items;
        const prevSummary = summary;

        if (isRead === false) {
            setItems([]);
            setHasMore(false);
        } else {
            setItems((prev) => prev.map((n) => ({ ...n, read: true })));
        }
        setSummary((prev) => ({
            ...prev,
            unreadCount: 0,
            readCount: prev.totalCount,
        }));

        try {
            await markAllNotificationsRead();
            await refreshSummary();
            if (isRead === false) {
                await loadInitial();
            }
        } catch {
            setItems(prevItems);
            setSummary(prevSummary);
        }
    }, [isRead, items, loadInitial, refreshSummary, summary]);

    useEffect(() => {
        if (!enabled) return undefined;
        refreshUnreadCount();
        const timer = window.setInterval(refreshUnreadCount, 60_000);
        return () => window.clearInterval(timer);
    }, [enabled, refreshUnreadCount]);

    useEffect(() => {
        if (!enabled || !autoLoad) return undefined;
        loadInitial();
        return undefined;
    }, [autoLoad, enabled, loadInitial]);

    return {
        items,
        summary,
        unreadCount: summary.unreadCount,
        totalCount: summary.totalCount,
        readCount: summary.readCount,
        loading,
        loadingMore,
        error,
        hasMore,
        loadInitial,
        loadMore,
        markOneRead,
        markAllRead,
        refreshUnreadCount,
        refreshSummary,
    };
};
