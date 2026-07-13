import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import * as service from '../services/candidateProfileService.js';
import { getProfileSaveErrorMessage, getAvatarErrorMessage } from '../utils/profileErrorMessages.js';
// Hook trung tâm cho Candidate Profile.
// Trả về: profile, skills catalog, loading/error/saving + các action.
export const useCandidateProfile = () => {
    const [profile, setProfile] = useState(null);
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const loadProfile = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await service.fetchProfile();
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
            setSkills(data);
            return data;
        } catch {
            // Catalog kỹ năng lỗi không chặn cả trang — chỉ tắt autocomplete.
            setSkills([]);
            return [];
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
        loading,
        saving,
        error,
        loadProfile,
        loadSkills,
        updateProfile,
        uploadAvatar,
        setProfile,
    };
};

export default useCandidateProfile;
