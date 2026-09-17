import { getNotificationTargetPath } from './notificationNavigation.js';
import { invitationsNavigateOptions } from './invitationNavReturn.js';

let refreshSequence = 0;

/** Shared by the bell and full notification list. Preserve return context. */
export const navigateToNotification = (navigate, notification, role, location) => {
    const path = getNotificationTargetPath(notification, role);
    if (!path) return false;

    const pathname = path.split('?')[0];
    const options = invitationsNavigateOptions(pathname, location);
    navigate(path, {
        ...options,
        state: {
            ...(pathname === location?.pathname ? location.state : undefined),
            ...options?.state,
            notificationRefreshKey: `${Date.now()}-${++refreshSequence}`,
        },
    });
    return true;
};

/** URL cleanup must not undo a refresh and mount the page a second time. */
export const retainNotificationRefreshKey = (previous, incoming) =>
    typeof incoming === 'string' && incoming ? incoming : previous;
