import { getInvitationDetail } from '../apis/InvitationApi.jsx';
import { getMyApplications } from '../apis/ApplicationApi.jsx';
import { USER_ROLES } from './Constants.jsx';
import { openChatPanel } from './chatEvents.js';

const pageContent = (res) => {
    const page = res?.data?.data ?? res?.data;
    return Array.isArray(page?.content) ? page.content : Array.isArray(page) ? page : [];
};

/**
 * Best-effort: open chat when notification payload can resolve jobId + otherUserId
 * via existing APIs (no BE change). Returns true if chat was opened.
 *
 * Covered without new BE fields:
 * - Candidate VIEW_INVITATION_DETAIL (ref = invitationId)
 * - Candidate VIEW_APPLICATION_DETAIL (ref = applicationId)
 */
export const tryOpenChatFromNotification = async (notification, role) => {
    if (!notification?.action || notification.referenceId == null) return false;

    const refId = notification.referenceId;

    try {
        if (role === USER_ROLES.CANDIDATE) {
            if (notification.action === 'VIEW_INVITATION_DETAIL') {
                const res = await getInvitationDetail(refId);
                const detail = res?.data?.data ?? res?.data;
                if (detail?.recruiterId != null && detail?.jobId != null) {
                    openChatPanel({
                        jobId: detail.jobId,
                        otherUserId: detail.recruiterId,
                    });
                    return true;
                }
            }

            if (notification.action === 'VIEW_APPLICATION_DETAIL') {
                const statuses = ['ACCEPTED', 'HIRED', 'PENDING', 'REJECTED', 'CANCELLED'];
                for (const status of statuses) {
                    const res = await getMyApplications({ status, page: 0, size: 50 });
                    const match = pageContent(res).find(
                        (app) =>
                            String(app.applicationId ?? app.id) === String(refId)
                    );
                    if (match?.recruiterId != null && match?.jobId != null) {
                        openChatPanel({
                            jobId: match.jobId,
                            otherUserId: match.recruiterId,
                        });
                        return true;
                    }
                }
            }
        }
    } catch {
        return false;
    }

    return false;
};
