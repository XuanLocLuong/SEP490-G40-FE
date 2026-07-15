import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCandidateProfile } from '../../../hooks/useCandidateProfile.js';
import { useCandidateAvailability } from '../../../hooks/useCandidateAvailability.js';
import ProfileHeader from '../../../components/candidate/ProfileHeader.jsx';
import JobPreferenceCard from '../../../components/candidate/JobPreferenceCard.jsx';
import PersonalInfoCard from '../../../components/candidate/PersonalInfoCard.jsx';
import EducationCard from '../../../components/candidate/EducationCard.jsx';
import ConsentCard from '../../../components/candidate/ConsentCard.jsx';
import SkillCard from '../../../components/candidate/SkillCard.jsx';
import ExperienceCard from '../../../components/candidate/ExperienceCard.jsx';
import AvailabilityCard from '../../../components/candidate/AvailabilityCard.jsx';
import PortfolioCard from '../../../components/candidate/PortfolioCard.jsx';
import FooterAction from '../../../components/candidate/FooterAction.jsx';
import ProfileSkeleton from '../../../components/candidate/ProfileSkeleton.jsx';
import { ROUTES } from '../../../routes/path.js';
import '../../../assets/styles/CandidateProfile.css';

// CandidateProfilePage — CHỈ là content, render bên trong <CandidateLayout> đã có.
const CandidateProfilePage = () => {
    const navigate = useNavigate();
    const { profile, skills, loading, saving, error, loadProfile, updateProfile, uploadAvatar } =
        useCandidateProfile();
    const { slots: availabilitySlots, loading: availabilityLoading } = useCandidateAvailability();

    // draft = bản làm việc của form. Đồng bộ lại mỗi khi profile (server truth) đổi
    // bằng pattern set-state-during-render của React (tránh dùng effect).
    const [draft, setDraft] = useState(null);
    const [syncedProfile, setSyncedProfile] = useState(null);

    if (profile !== syncedProfile) {
        setSyncedProfile(profile);
        setDraft(profile);
    }

    const dirty = useMemo(
        () => JSON.stringify(draft) !== JSON.stringify(profile),
        [draft, profile],
    );

    if (loading && !profile) {
        return <ProfileSkeleton />;
    }

    if (error && !profile) {
        return (
            <div className="cp-page">
                <div className="cp-card cp-error-state">
                    <p>Không tải được hồ sơ.</p>
                    <button type="button" className="cp-btn cp-btn--primary" onClick={loadProfile}>
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    if (!draft) return <ProfileSkeleton />;

    // Cập nhật 1 phần rồi lưu ngay (dùng cho các modal section) -> PUT full draft.
    const saveSection = async (patch) => {
        const next = { ...draft, ...patch };
        setDraft(next);
        return updateProfile(next);
    };

    // Chỉ đổi draft, chưa gọi API (dùng cho skill/consent inline) -> lưu ở FooterAction.
    const patchDraft = (patch) => setDraft((prev) => ({ ...prev, ...patch }));

    const handleSaveAll = () => updateProfile(draft);

    const handleCancel = () => {
        setDraft(profile);
        toast.info('Đã hoàn tác các thay đổi chưa lưu.');
    };

    const handleAvatar = (file) => uploadAvatar(file);

    const handlePortfolio = () => {
        toast.info('Tính năng tải portfolio sẽ sớm khả dụng.');
    };

    const handleScheduleSetup = () => {
        navigate(ROUTES.CANDIDATE_AVAILABILITY);
    };

    return (
        <div className="cp-page">
            <ProfileHeader profile={draft} onUploadAvatar={handleAvatar} saving={saving} />

            <div className="cp-grid">
                <div className="cp-col">
                    <JobPreferenceCard
                        preference={draft.jobPreference}
                        onSave={(pref) => saveSection({ jobPreference: pref })}
                        saving={saving}
                    />
                    <PortfolioCard
                        portfolioUrl={draft.portfolioUrl}
                        onUpload={handlePortfolio}
                        disabled={saving}
                    />
                </div>

                <div className="cp-col">
                    <PersonalInfoCard
                        personalInfo={draft.personalInfo}
                        onSave={(info) => saveSection({ personalInfo: info })}
                        saving={saving}
                    />
                    <EducationCard
                        education={draft.education}
                        onSave={(education) => saveSection({ education })}
                        saving={saving}
                    />
                    <ConsentCard
                        checked={draft.consentShareInfo}
                        onChange={(v) => patchDraft({ consentShareInfo: v })}
                    />
                </div>
            </div>

            <div className="cp-section-title">
                <h2>Hồ sơ công việc</h2>
                <p>Cập nhật để tăng khả năng được gợi ý</p>
            </div>

            <SkillCard
                skills={draft.skills}
                catalog={skills}
                onChange={(next) => patchDraft({ skills: next })}
            />

            <ExperienceCard
                experiences={draft.experiences}
                onSave={(experiences) => {
                    // Work History CHƯA có API (chỉ có entity rỗng bên BE) — không gọi PUT
                    // thật kẻo báo "lưu thành công" giả. Chỉ giữ ở draft cục bộ.
                    patchDraft({ experiences });
                    toast.info('Kinh nghiệm làm việc sẽ được lưu khi tính năng Work History hoàn tất.');
                    return false; // false = ExperienceCard không tự đóng modal như đã lưu thành công.
                }}
                saving={saving}
            />

            <AvailabilityCard
                slots={availabilitySlots}
                loading={availabilityLoading}
                onSetup={handleScheduleSetup}
            />

            <FooterAction
                onCancel={handleCancel}
                onSave={handleSaveAll}
                saving={saving}
                dirty={dirty}
            />
        </div>
    );
};

export default CandidateProfilePage;
