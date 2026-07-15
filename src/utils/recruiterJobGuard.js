import { toast } from 'react-toastify';
import recruiterProfileApi from '../apis/RecruiterProfileApi.jsx';
import locationApi from '../apis/LocationApi.jsx';
import userApi from '../apis/UserApi.jsx';
import { ROUTES } from '../routes/path.js';

export const RECRUITER_PROFILE_CREATE_JOB_INTENT = 'recruiterProfileFromCreateJob';

/**
 * Kiểm tra điều kiện trước khi vào màn đăng tin / tin của tôi.
 * BE cũng enforce tương tự — guard này giúp UX tốt hơn (redirect + toast).
 *
 * @returns {Promise<false | { profile, locations, businessId }>}
 */
export const ensureCanPostJob = async ({ auth, navigate }) => {
    let emailVerified = auth?.emailVerified;

    if (emailVerified == null) {
        try {
            const user = await userApi.getCurrentUser();
            emailVerified = user?.emailVerified ?? false;
        } catch {
            emailVerified = false;
        }
    }

    if (!emailVerified) {
        toast.warning('Bạn cần xác minh email trước khi đăng tin tuyển dụng.', {
            toastId: 'recruiter-guard-email',
        });
        navigate(ROUTES.RECRUITER_SETTINGS);
        return false;
    }

    let profile;
    try {
        profile = await recruiterProfileApi.getProfile();
    } catch (err) {
        if (err?.response?.status === 404) {
            sessionStorage.setItem(RECRUITER_PROFILE_CREATE_JOB_INTENT, '1');
            navigate(ROUTES.RECRUITER_PROFILE);
            return false;
        }
        throw err;
    }

    const businessId = profile?.businessId;
    let locations = [];

    try {
        locations = await locationApi.getMyLocations(businessId);
    } catch {
        locations = profile?.locations || [];
    }

    if (!toArray(locations).length) {
        sessionStorage.setItem(RECRUITER_PROFILE_CREATE_JOB_INTENT, '1');
        navigate(ROUTES.RECRUITER_PROFILE);
        return false;
    }

    return { profile, locations, businessId };
};

const toArray = (value) => (Array.isArray(value) ? value : []);
