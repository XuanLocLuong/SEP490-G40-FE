import { Component, Fragment } from 'react';
import { useLocation } from 'react-router-dom';
import { retainNotificationRefreshKey } from '../../utils/notificationRefresh.js';

class RefreshableContent extends Component {
    state = { refreshKey: this.props.refreshKey || 'initial' };

    static getDerivedStateFromProps(props, state) {
        const refreshKey = retainNotificationRefreshKey(state.refreshKey, props.refreshKey);
        return refreshKey === state.refreshKey ? null : { refreshKey };
    }

    render() {
        return <Fragment key={this.state.refreshKey}>{this.props.children}</Fragment>;
    }
}

/** Refresh only route content. Layouts and notification subscriptions stay mounted. */
const NotificationRefreshBoundary = ({ children }) => {
    const location = useLocation();
    return (
        <RefreshableContent refreshKey={location.state?.notificationRefreshKey}>
            {children}
        </RefreshableContent>
    );
};

export default NotificationRefreshBoundary;
