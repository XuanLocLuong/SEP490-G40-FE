const UNSAVED_DRAFT_KEY = 'joblink.candidateProfile.unsavedDraft.v1';

/**
 * Lưu tạm thay đổi kỹ năng chưa bấm "Lưu hồ sơ" (sessionStorage).
 * Giữ được khi rời trang (vd. lịch rảnh) rồi quay lại trong cùng tab.
 */
export const setUnsavedCandidateProfileDraft = ({ profileId, skills } = {}) => {
    try {
        sessionStorage.setItem(
            UNSAVED_DRAFT_KEY,
            JSON.stringify({
                profileId: profileId ?? null,
                skills: Array.isArray(skills) ? skills : [],
                savedAt: Date.now(),
            }),
        );
    } catch {
        // sessionStorage có thể bị chặn — draft chỉ sống trong memory.
    }
};

export const peekUnsavedCandidateProfileDraft = (profileId) => {
    try {
        const raw = sessionStorage.getItem(UNSAVED_DRAFT_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.skills)) return null;
        if (
            profileId != null &&
            parsed.profileId != null &&
            String(parsed.profileId) !== String(profileId)
        ) {
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
};

export const clearUnsavedCandidateProfileDraft = () => {
    try {
        sessionStorage.removeItem(UNSAVED_DRAFT_KEY);
    } catch {
        // ignore
    }
};
