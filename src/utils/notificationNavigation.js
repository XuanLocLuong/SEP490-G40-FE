import { ROUTES, getRecruiterApplicantsPath, getRecruiterEditJobPath } from '../routes/path.js';
import { USER_ROLES } from './Constants.jsx';

/**
 * Map BE notification.action + referenceId + role → in-app path.
 * Same action can target different screens for candidate vs recruiter.
 */
export const getNotificationTargetPath = (notification, role) => {
    if (!notification?.action) return null;
    const refId = notification.referenceId;
    const isRecruiter = role === USER_ROLES.RECRUITER;

    switch (notification.action) {
        case 'VIEW_INVITATION_DETAIL':
            // Candidate: invitations list. Recruiter: no invitation inbox → applicants.
            return isRecruiter
                ? ROUTES.RECRUITER_APPLICANTS
                : ROUTES.CANDIDATE_INVITATIONS;

        case 'VIEW_APPLICATION_DETAIL':
            // Candidate: application history. Recruiter: applicants (refId is applicationId).
            return isRecruiter
                ? ROUTES.RECRUITER_APPLICANTS
                : ROUTES.CANDIDATE_APPLICATION_HISTORY;

        case 'VIEW_JOB_APPLICATIONS':
            if (refId == null) return ROUTES.RECRUITER_APPLICANTS;
            return getRecruiterApplicantsPath(refId);

        case 'VIEW_MY_JOB_DETAIL':
            if (refId == null) return ROUTES.RECRUITER_MY_JOBS;
            return getRecruiterEditJobPath(refId);

        case 'VIEW_PROFILE':
            if (isRecruiter) return ROUTES.RECRUITER_PROFILE;
            if (role === USER_ROLES.CANDIDATE) return ROUTES.CANDIDATE_PROFILE;
            return null;

        case 'VIEW_SCHEDULE':
        case 'SCHEDULE_UPDATED_BY_JOB':
        case 'SCHEDULE_EXPIRED':
        case 'SCHEDULE_UPDATE_REMINDER':
            if (role === USER_ROLES.CANDIDATE) return ROUTES.CANDIDATE_AVAILABILITY;
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
