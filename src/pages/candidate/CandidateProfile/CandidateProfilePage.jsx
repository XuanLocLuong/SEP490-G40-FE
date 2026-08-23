import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCandidateProfile } from '../../../hooks/useCandidateProfile.js';
import { useCandidateAvailability } from '../../../hooks/useCandidateAvailability.js';
import { useCandidateWorkHistories } from '../../../hooks/useCandidateWorkHistories.js';
import { useAuth } from '../../../contexts/authContext.js';
import userApi, { getApiErrorMessage } from '../../../apis/UserApi.jsx';
import ProfileHeader from '../../../components/candidate/ProfileHeader.jsx';
import JobPreferenceCard from '../../../components/candidate/JobPreferenceCard.jsx';
import BioCard from '../../../components/candidate/BioCard.jsx';
import PersonalInfoCard from '../../../components/candidate/PersonalInfoCard.jsx';
import EducationCard from '../../../components/candidate/EducationCard.jsx';
import SkillCard from '../../../components/candidate/SkillCard.jsx';
import ExperienceCard from '../../../components/candidate/ExperienceCard.jsx';
import AvailabilityCard from '../../../components/candidate/AvailabilityCard.jsx';
import FooterAction from '../../../components/candidate/FooterAction.jsx';
import ProfileSkeleton from '../../../components/candidate/ProfileSkeleton.jsx';
import ConfirmModal from '../../../components/common/ConfirmModal.jsx';
import {
    clearPendingApplyReturn,
    consumePendingApplyReturn,
    peekPendingApplyReturn,
} from '../../../utils/applyReturnStorage.js';
import { ROUTES, getJobDetailPath } from '../../../routes/path.js';
import '../../../assets/styles/CandidateProfile.css';

const PHONE_PATTERN = /^(\+84|0)[35789][0-9]{8}$/;

const withPhone = (profile, phone) => {
    if (!profile) return null;
    return {
        ...profile,
        personalInfo: {
            ...(profile.personalInfo || {}),
            phone: phone || '',
        },
    };
};

// CandidateProfilePage — CHỈ là content, render bên trong <CandidateLayout> đã có.
const CandidateProfilePage = () => {
    const navigate = useNavigate();
    const { updateProfile: updateAuthProfile } = useAuth();
    const { profile, skills, loading, saving, error, loadProfile, updateProfile, uploadAvatar } =
        useCandidateProfile();
    const {
        slots: availabilitySlots,
        startDate: availabilityStartDate,
        endDate: availabilityEndDate,
        scheduleMode: availabilityScheduleMode,
        loading: availabilityLoading,
    } = useCandidateAvailability();
    const {
        experiences,
        loading: experiencesLoading,
        saving: experiencesSaving,
        saveExperience,
        deleteExperience,
    } = useCandidateWorkHistories();

    const [accountPhone, setAccountPhone] = useState('');
    const [draft, setDraft] = useState(null);
    const [syncedProfile, setSyncedProfile] = useState(null);
    const [syncedPhone, setSyncedPhone] = useState(null);
    const [returnJobPrompt, setReturnJobPrompt] = useState(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await userApi.getCurrentUser();
                if (!cancelled) setAccountPhone(data?.phone || '');
            } catch {
                // Không chặn trang hồ sơ nếu user/me lỗi — SĐT để trống.
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    if (profile !== syncedProfile) {
        setSyncedProfile(profile);
        setSyncedPhone(accountPhone);
        setDraft(withPhone(profile, accountPhone));
    } else if (accountPhone !== syncedPhone) {
        setSyncedPhone(accountPhone);
        setDraft(
            draft
                ? {
                      ...draft,
                      personalInfo: {
                          ...draft.personalInfo,
                          phone: accountPhone || '',
                      },
                  }
                : withPhone(profile, accountPhone),
        );
    }

    const baseline = useMemo(() => withPhone(profile, accountPhone), [profile, accountPhone]);

    const dirty = useMemo(
        () => JSON.stringify(draft) !== JSON.stringify(baseline),
        [draft, baseline],
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

    const offerReturnToJobIfNeeded = () => {
        if (returnJobPrompt) return;
        const pending = peekPendingApplyReturn();
        if (pending?.jobId) setReturnJobPrompt(pending);
    };

    const savePhoneIfNeeded = async (nextPersonalInfo) => {
        const nextPhone = (nextPersonalInfo?.phone || '').trim();
        const prevPhone = (accountPhone || '').trim();
        if (nextPhone === prevPhone) return true;

        if (nextPhone && !PHONE_PATTERN.test(nextPhone)) {
            toast.error('Số điện thoại không đúng định dạng Việt Nam.');
            return false;
        }

        try {
            const data = await userApi.updateCurrentUser({
                fullName: draft.fullName || profile?.fullName || '',
                phone: nextPhone || null,
            });
            const savedPhone = data?.phone || nextPhone;
            setAccountPhone(savedPhone);
            updateAuthProfile({
                phone: savedPhone,
                fullName: data?.fullName || draft.fullName,
            });
            return true;
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Không cập nhật được số điện thoại.'));
            return false;
        }
    };

    // Cập nhật 1 phần rồi lưu ngay (dùng cho các modal section) -> PUT full draft.
    const saveSection = async (patch) => {
        const next = {
            ...draft,
            ...patch,
            personalInfo: patch.personalInfo
                ? { ...draft.personalInfo, ...patch.personalInfo }
                : draft.personalInfo,
        };

        if (patch.personalInfo) {
            const phoneOk = await savePhoneIfNeeded(next.personalInfo);
            if (!phoneOk) return false;
        }

        setDraft(next);
        const ok = await updateProfile(next);
        if (ok) offerReturnToJobIfNeeded();
        return ok;
    };

    // Chỉ đổi draft, chưa gọi API (dùng cho skill inline) -> lưu ở FooterAction.
    const patchDraft = (patch) => setDraft((prev) => ({ ...prev, ...patch }));

    const handleSaveAll = async () => {
        const phoneOk = await savePhoneIfNeeded(draft.personalInfo);
        if (!phoneOk) return false;
        const ok = await updateProfile(draft);
        if (ok) offerReturnToJobIfNeeded();
        return ok;
    };

    const handleCancel = () => {
        setDraft(baseline);
        toast.info('Đã hoàn tác các thay đổi chưa lưu.');
    };

    const handleAvatar = (file) => uploadAvatar(file);

    const handleScheduleSetup = () => {
        navigate(ROUTES.CANDIDATE_AVAILABILITY, {
            state: {
                from: {
                    path: ROUTES.CANDIDATE_PROFILE,
                    label: 'Hồ sơ',
                },
            },
        });
    };

    const handleReturnToJob = () => {
        const pending = consumePendingApplyReturn() || returnJobPrompt;
        setReturnJobPrompt(null);
        if (pending?.jobId) {
            navigate(getJobDetailPath(pending.jobId));
        }
    };

    const handleDismissReturnToJob = () => {
        clearPendingApplyReturn();
        setReturnJobPrompt(null);
    };

    const returnJobTitle = returnJobPrompt?.jobTitle?.trim();

    return (
        <div className="cp-page">
            <ProfileHeader profile={draft} onUploadAvatar={handleAvatar} saving={saving} />

            <p className="cp-apply-legend" role="note">
                <span className="cp-required" aria-hidden="true">
                    *
                </span>{' '}
                Trường bắt buộc để có thể ứng tuyển việc làm.
            </p>

            <div className="cp-grid">
                <div className="cp-col">
                    <JobPreferenceCard
                        preference={draft.jobPreference}
                        onSave={(pref) => saveSection({ jobPreference: pref })}
                        saving={saving}
                    />
                    <BioCard
                        bio={draft.bio}
                        onSave={(bio) => saveSection({ bio })}
                        saving={saving}
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
                experiences={experiences}
                loading={experiencesLoading}
                saving={experiencesSaving}
                onSave={saveExperience}
                onDelete={deleteExperience}
            />

            <AvailabilityCard
                slots={availabilitySlots}
                startDate={availabilityStartDate}
                endDate={availabilityEndDate}
                scheduleMode={availabilityScheduleMode}
                loading={availabilityLoading}
                onSetup={handleScheduleSetup}
            />

            <FooterAction
                onCancel={handleCancel}
                onSave={handleSaveAll}
                saving={saving}
                dirty={dirty}
            />

            <ConfirmModal
                open={Boolean(returnJobPrompt)}
                title="Quay lại tin tuyển dụng?"
                confirmLabel="Xem tin tuyển dụng"
                cancelLabel="Để sau"
                onConfirm={handleReturnToJob}
                onCancel={handleDismissReturnToJob}
            >
                <p>
                    Hồ sơ đã được cập nhật.
                    {returnJobTitle ? (
                        <>
                            {' '}
                            Bạn muốn xem lại tin <strong>{returnJobTitle}</strong> để tiếp tục ứng
                            tuyển không?
                        </>
                    ) : (
                        <> Bạn muốn quay lại tin tuyển dụng để tiếp tục ứng tuyển không?</>
                    )}
                </p>
            </ConfirmModal>
        </div>
    );
};

export default CandidateProfilePage;
