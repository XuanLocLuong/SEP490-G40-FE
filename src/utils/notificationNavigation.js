import {
    ROUTES,
    getBusinessProfilePath,
    getCandidatePublicProfilePath,
    getRecruiterApplicantsPath,
    getRecruiterEditJobPath,
    getRecruiterInvitationsPath,
    getRecruiterMyJobsPath,
    getJobDetailPath,
} from '../routes/path.js';
import { USER_ROLES } from './Constants.jsx';

const notificationTypeOf = (notification) =>
    String(notification?.type || notification?.notificationType || '').toUpperCase();

/**
 * Map BE notification.action + referenceId + role → in-app path.
 * Same action can target different screens for candidate vs recruiter.
 */
export const getNotificationTargetPath = (notification, role) => {
    if (!notification?.action) return null;
    const refId = notification.referenceId;
    const isRecruiter = role === USER_ROLES.RECRUITER;
    const type = notificationTypeOf(notification);

    switch (notification.action) {
        case 'VIEW_JOB':
            if (refId == null) return ROUTES.JOB_LIST;
            return getJobDetailPath(refId);

        case 'VIEW_INVITATION_DETAIL':
            if (isRecruiter) {
                if (refId == null) return ROUTES.RECRUITER_INVITATIONS;
                if (type === 'INVITATION_ACCEPTED') {
                    return `${getRecruiterInvitationsPath(refId)}&status=ACCEPTED`;
                }
                if (type === 'INVITATION_REJECTED') {
                    return `${getRecruiterInvitationsPath(refId)}&status=REJECTED`;
                }
                return getRecruiterInvitationsPath(refId);
            }
            if (role === USER_ROLES.CANDIDATE) {
                if (type === 'INVITATION_EXPIRED' || type === 'INVITATION_INVALIDATED') {
                    return refId != null
                        ? `${ROUTES.CANDIDATE_INVITATIONS}?tab=INACTIVE&invitationId=${refId}`
                        : `${ROUTES.CANDIDATE_INVITATIONS}?tab=INACTIVE`;
                }
                return refId != null
                    ? `${ROUTES.CANDIDATE_INVITATIONS}?tab=SENT&invitationId=${refId}`
                    : ROUTES.CANDIDATE_INVITATIONS;
            }
            return null;

        case 'VIEW_APPLICATION_DETAIL':
            if (isRecruiter) {
                if (refId == null) return ROUTES.RECRUITER_APPLICANTS;
                return getRecruiterApplicantsPath(refId);
            }
            if (role === USER_ROLES.CANDIDATE) {
                if (type === 'APPLICATION_ACCEPTED') {
                    return refId != null
                        ? `${ROUTES.CANDIDATE_APPLICATION_HISTORY}?tab=ACCEPTED&applicationId=${refId}`
                        : `${ROUTES.CANDIDATE_APPLICATION_HISTORY}?tab=ACCEPTED`;
                }
                if (type === 'APPLICATION_REJECTED' || type === 'OFFER_EXPIRED') {
                    return refId != null
                        ? `${ROUTES.CANDIDATE_APPLICATION_HISTORY}?tab=REJECTED&applicationId=${refId}`
                        : `${ROUTES.CANDIDATE_APPLICATION_HISTORY}?tab=REJECTED`;
                }
                return refId != null
                    ? `${ROUTES.CANDIDATE_APPLICATION_HISTORY}?applicationId=${refId}`
                    : ROUTES.CANDIDATE_APPLICATION_HISTORY;
            }
            return null;

        case 'VIEW_JOB_APPLICATIONS':
            if (refId == null) return ROUTES.RECRUITER_APPLICANTS;
            if (type === 'OFFER_CONFIRMED') {
                return `${getRecruiterApplicantsPath(refId)}&status=HIRED`;
            }
            if (type === 'OFFER_DECLINED' || type === 'OFFER_EXPIRED') {
                return `${getRecruiterApplicantsPath(refId)}&status=ALL`;
            }
            return getRecruiterApplicantsPath(refId);

        case 'VIEW_MY_JOB_DETAIL': {
            if (refId == null) return ROUTES.RECRUITER_MY_JOBS;
            if (type === 'JOB_REVISION_REQUESTED') {
                return getRecruiterEditJobPath(refId);
            }
            if (type === 'JOB_REVIEW_REJECTED') {
                return getRecruiterMyJobsPath({ tab: 'rejected', jobId: refId });
            }
            if (type === 'JOB_BLOCKED') {
                return getRecruiterMyJobsPath({ tab: 'closed', jobId: refId });
            }
            // JOB_APPROVED: danh sách tin của tôi, tab Đang tuyển.
            return getRecruiterMyJobsPath({ tab: 'open', jobId: refId });
        }

        case 'VIEW_REVIEWS':
            if (role === USER_ROLES.CANDIDATE) return ROUTES.CANDIDATE_REVIEWS;
            return null;

        case 'VIEW_TRUST_SCORE':
            if (role === USER_ROLES.CANDIDATE) return ROUTES.CANDIDATE_TRUST_SCORE;
            if (isRecruiter) return ROUTES.RECRUITER_TRUST_SCORE;
            return null;

        case 'VIEW_BUSINESS_PROFILE':
            if (refId == null) return null;
            return `${getBusinessProfilePath(refId)}?tab=reviews`;

        case 'VIEW_CANDIDATE_PROFILE':
            if (refId == null) return null;
            return getCandidatePublicProfilePath(refId);

        case 'VIEW_PROFILE':
            if (isRecruiter) return ROUTES.RECRUITER_PROFILE;
            if (role === USER_ROLES.CANDIDATE) return ROUTES.CANDIDATE_PROFILE;
            return null;

        case 'VIEW_SCHEDULE':
        case 'SCHEDULE_UPDATED_BY_JOB':
            if (role === USER_ROLES.CANDIDATE) {
                return `${ROUTES.CANDIDATE_AVAILABILITY}?tab=jobs`;
            }
            return null;

        case 'UPDATE_SCHEDULE':
        case 'SCHEDULE_EXPIRED':
        case 'SCHEDULE_UPDATE_REMINDER':
            if (role === USER_ROLES.CANDIDATE) {
                return `${ROUTES.CANDIDATE_AVAILABILITY}?tab=availability`;
            }
            return null;

        case 'VIEW_VERIFICATION':
            if (isRecruiter) return ROUTES.RECRUITER_VERIFICATION;
            return null;

        default:
            return null;
    }
};

const startOfLocalDay = (date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const formatClock = (date) =>
    date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });

/** Relative: "Vài giây trước", "5 phút trước", ... */
export const formatNotificationTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '';

    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'Vài giây trước';
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} ngày trước`;
    return date.toLocaleDateString('vi-VN');
};

/** Calendar clock: "Hôm nay lúc 07:05", "Hôm qua lúc 18:20", "24/07 lúc 09:00" */
export const formatNotificationCalendarTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '';

    const today = startOfLocalDay(new Date());
    const target = startOfLocalDay(date);
    const dayDiff = Math.round((today - target) / 86_400_000);
    const clock = formatClock(date);

    if (dayDiff === 0) return `Hôm nay lúc ${clock}`;
    if (dayDiff === 1) return `Hôm qua lúc ${clock}`;
    return `${date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} lúc ${clock}`;
};
