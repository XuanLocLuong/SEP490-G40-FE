import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import * as service from '../services/candidateProfileService.js';
import { getProfileSaveErrorMessage, getAvatarErrorMessage } from '../utils/profileErrorMessages.js';
import { rememberSkillLabels } from '../utils/skillDisplay.js';

// Hook trung tâm cho Candidate Profile.
// Trả về: profile, skills catalog, loading/error/saving + các action.
export const useCandidateProfile = () => {
    const [profile, setProfile] = useState(null);
    const [skills, setSkills] = useState([]);
    const [skillsCatalogReady, setSkillsCatalogReady] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const loadProfile = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await service.fetchProfile();
            rememberSkillLabels(data?.skills);
            setProfile(data);
            return data;
        } catch (err) {
            setError(err);
            toast.error('Không tải được hồ sơ. Vui lòng thử lại.');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const loadSkills = useCallback(async () => {
        try {
            const data = await service.fetchSkills();
            rememberSkillLabels(data);
            setSkills(data);
            setSkillsCatalogReady(true);
            return data;
        } catch {
            // Catalog lỗi — không prune theo catalog rỗng.
            setSkills([]);
            setSkillsCatalogReady(false);
            return null;
        }
    }, []);

    // Cập nhật profile: gửi PUT rồi đồng bộ lại state (dùng response nếu có,
    // nếu không thì GET lại theo yêu cầu của plan).
    const updateProfile = useCallback(
        async (nextProfile, { silent = false } = {}) => {
            setSaving(true);
            try {
                const saved = await service.saveProfile(nextProfile);
                if (saved) {
                    setProfile(saved);
                } else {
                    await loadProfile();
                }
                if (!silent) toast.success('Đã lưu hồ sơ thành công.');
                return true;
            } catch (err) {
                setError(err);
                toast.error(getProfileSaveErrorMessage(err));
                return false;
            } finally {
                setSaving(false);
            }
        },
        [loadProfile],
    );

    const uploadAvatar = useCallback(async (file) => {
        setSaving(true);
        try {
            const result = await service.uploadAvatar(file);
            if (result.profile) {
                setProfile(result.profile);
            } else if (result.avatarUrl) {
                setProfile((prev) => (prev ? { ...prev, avatarUrl: result.avatarUrl } : prev));
            }
            toast.success('Đã cập nhật ảnh đại diện.');
            return true;
        } catch {
            toast.error(getAvatarErrorMessage);
            return false;
        } finally {
            setSaving(false);
        }
    }, []);

    const uploadCv = useCallback(async (file) => {
        setSaving(true);
        try {
            const result = await service.uploadCv(file);
            if (result.profile) {
                setProfile(result.profile);
            } else if (result.cvLink) {
                setProfile((prev) => (prev ? { ...prev, cvLink: result.cvLink } : prev));
            }
            toast.success('Đã tải lên CV thành công.');
            return result.cvLink || true;
        } catch (err) {
            const msg = err?.response?.data?.message;
            if (msg === 'CV_INVALID_FORMAT') {
                toast.error('Định dạng CV không hợp lệ. Chỉ chấp nhận file PDF (.pdf).');
            } else if (msg === 'CV_FILE_TOO_LARGE') {
                toast.error('Dung lượng CV quá lớn (tối đa 5MB).');
            } else {
                toast.error(msg || 'Không thể tải lên CV. Vui lòng thử lại.');
            }
            return false;
        } finally {
            setSaving(false);
        }
    }, []);

    const deleteCv = useCallback(async () => {
        setSaving(true);
        try {
            await service.deleteCv();
            setProfile((prev) => (prev ? { ...prev, cvLink: null } : prev));
            toast.success('Đã gỡ bỏ file CV mặc định.');
            return true;
        } catch (err) {
            const msg = err?.response?.data?.message;
            toast.error(msg || 'Không thể gỡ bỏ CV. Vui lòng thử lại.');
            return false;
        } finally {
            setSaving(false);
        }
    }, []);

    // Fetch dữ liệu khi mount — đây là use case hợp lệ của effect (đồng bộ với
    // hệ thống ngoài/backend). setState nằm trong callback async của loadProfile.
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadProfile();
        loadSkills();
    }, [loadProfile, loadSkills]);

    return {
        profile,
        skills,
        skillsCatalogReady,
        loading,
        saving,
        error,
        loadProfile,
        loadSkills,
        updateProfile,
        uploadAvatar,
        uploadCv,
        deleteCv,
        setProfile,
    };
};

export default useCandidateProfile;
