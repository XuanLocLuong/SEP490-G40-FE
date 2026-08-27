import { useCallback, useEffect, useMemo, useState } from 'react';
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
import CvCard from '../../../components/candidate/CvCard.jsx';
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
import {
    clearUnsavedCandidateProfileDraft,
    peekUnsavedCandidateProfileDraft,
    setUnsavedCandidateProfileDraft,
} from '../../../utils/candidateProfileDraftStorage.js';
import { isCandidateDraftReadyToApply } from '../../../utils/applyProfileFields.js';
import {
    buildInactiveJobTypesRemovedMessage,
    fetchJobTypeOptions,
    INACTIVE_JOB_TYPES_TOAST_ID,
    pruneInactiveJobTypes,
    rememberJobTypeLabels,
} from '../../../utils/jobTypeDisplay.js';
import {
    buildInactiveSkillsRemovedMessage,
    INACTIVE_SKILLS_PROFILE_TOAST_ID,
    pruneInactiveSkills,
    rememberSkillLabels,
} from '../../../utils/skillDisplay.js';
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

const skillsEqual = (a, b) => JSON.stringify(a ?? []) === JSON.stringify(b ?? []);

/** Giữ kỹ năng chưa lưu khi sync lại profile từ BE / restore từ sessionStorage. */
const mergeDraftSkills = (fromServer, prevDraft, oldBaseline, storedSkills) => {
    if (!fromServer) return null;

    if (prevDraft && oldBaseline && !skillsEqual(prevDraft.skills, oldBaseline.skills)) {
        return { ...fromServer, skills: prevDraft.skills };
    }

    if (storedSkills && !skillsEqual(storedSkills, fromServer.skills)) {
        return { ...fromServer, skills: storedSkills };
    }

    return fromServer;
};

// CandidateProfilePage — CHỈ là content, render bên trong <CandidateLayout> đã có.
const CandidateProfilePage = () => {
    const navigate = useNavigate();
    const { updateProfile: updateAuthProfile } = useAuth();
    const {
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
    } = useCandidateProfile();
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

    /** Refetch catalog rồi gỡ lĩnh vực / kỹ năng đã tắt khỏi draft trước khi PUT. */
    const prepareDraftForSave = useCallback(
        async (currentDraft, { notify = true } = {}) => {
            if (!currentDraft) return currentDraft;

            let nextDraft = currentDraft;

            const options = await fetchJobTypeOptions({ force: true });
            const typesPruned = pruneInactiveJobTypes(
                nextDraft.jobPreference?.jobTypes,
                options,
            );
            if (typesPruned.removed.length > 0) {
                nextDraft = {
                    ...nextDraft,
                    jobPreference: {
                        ...(nextDraft.jobPreference || {}),
                        jobTypes: typesPruned.nextTypes,
                    },
                };
                if (notify) {
                    toast.warning(
                        buildInactiveJobTypesRemovedMessage(typesPruned.removed, options),
                        {
                            autoClose: 7000,
                            toastId: INACTIVE_JOB_TYPES_TOAST_ID,
                        },
                    );
                }
            }

            const catalog = await loadSkills();
            if (catalog) {
                rememberSkillLabels(nextDraft.skills);
                const skillsPruned = pruneInactiveSkills(nextDraft.skills, catalog);
                if (skillsPruned.removed.length > 0) {
                    nextDraft = { ...nextDraft, skills: skillsPruned.nextSkills };
                    if (notify) {
                        toast.warning(
                            buildInactiveSkillsRemovedMessage(skillsPruned.removed, catalog, {
                                context: 'profile',
                            }),
                            {
                                autoClose: 7000,
                                toastId: INACTIVE_SKILLS_PROFILE_TOAST_ID,
                            },
                        );
                    }
                }
            }

            return nextDraft;
        },
        [loadSkills],
    );

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

    // Khi profile từ BE có lĩnh vực đã tắt: gỡ khỏi draft + toast (giống đăng tin).
    useEffect(() => {
        if (!profile?.jobPreference?.jobTypes?.length) return undefined;

        let cancelled = false;
        (async () => {
            const options = await fetchJobTypeOptions({ force: true });
            if (cancelled) return;

            rememberJobTypeLabels(options);
            const { removed } = pruneInactiveJobTypes(
                profile.jobPreference.jobTypes,
                options,
            );
            if (removed.length === 0) return;

            setDraft((prev) => {
                if (!prev?.jobPreference) return prev;
                const pruned = pruneInactiveJobTypes(prev.jobPreference.jobTypes, options);
                if (pruned.removed.length === 0) return prev;
                return {
                    ...prev,
                    jobPreference: {
                        ...prev.jobPreference,
                        jobTypes: pruned.nextTypes,
                    },
                };
            });

            toast.warning(buildInactiveJobTypesRemovedMessage(removed, options), {
                autoClose: 7000,
                toastId: INACTIVE_JOB_TYPES_TOAST_ID,
            });
        })();

        return () => {
            cancelled = true;
        };
    }, [profile]);

    // Catalog UV chỉ còn skill active — gỡ skill đã tắt khỏi draft.
    useEffect(() => {
        if (!skillsCatalogReady || !profile?.skills?.length) return;

        rememberSkillLabels(profile.skills);
        const { removed } = pruneInactiveSkills(profile.skills, skills);
        if (removed.length === 0) return;

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDraft((prev) => {
            if (!prev?.skills?.length) return prev;
            const pruned = pruneInactiveSkills(prev.skills, skills);
            if (pruned.removed.length === 0) return prev;
            return { ...prev, skills: pruned.nextSkills };
        });

        toast.warning(
            buildInactiveSkillsRemovedMessage(removed, skills, { context: 'profile' }),
            {
                autoClose: 7000,
                toastId: INACTIVE_SKILLS_PROFILE_TOAST_ID,
            },
        );
    }, [profile, skills, skillsCatalogReady]);

    if (profile !== syncedProfile) {
        const fromServer = withPhone(profile, accountPhone);
        const oldBaseline = withPhone(syncedProfile, syncedPhone);
        const stored = peekUnsavedCandidateProfileDraft(profile?.id);
        setSyncedProfile(profile);
        setSyncedPhone(accountPhone);
        setDraft(mergeDraftSkills(fromServer, draft, oldBaseline, stored?.skills));
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

    const skillsDirty = useMemo(
        () => !skillsEqual(draft?.skills, baseline?.skills),
        [draft?.skills, baseline?.skills],
    );

    useEffect(() => {
        if (!draft || !baseline) return;
        if (skillsDirty) {
            setUnsavedCandidateProfileDraft({
                profileId: draft.id ?? profile?.id ?? null,
                skills: draft.skills,
            });
        } else {
            clearUnsavedCandidateProfileDraft();
        }
    }, [draft, baseline, skillsDirty, profile?.id]);

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

    const offerReturnToJobIfNeeded = (savedDraft) => {
        if (returnJobPrompt) return;
        // Chỉ gợi ý quay lại tin khi đã đủ field bắt buộc để apply.
        if (!isCandidateDraftReadyToApply(savedDraft)) return;
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
        let next = {
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

        // PUT gửi full preferredJobType — luôn prune trước khi lưu.
        next = await prepareDraftForSave(next, { notify: true });
        setDraft(next);
        const ok = await updateProfile(next);
        if (ok) offerReturnToJobIfNeeded(next);
        return ok;
    };

    // Chỉ đổi draft, chưa gọi API (dùng cho skill inline) -> lưu ở FooterAction.
    const patchDraft = (patch) => setDraft((prev) => ({ ...prev, ...patch }));

    const handleSaveAll = async () => {
        const phoneOk = await savePhoneIfNeeded(draft.personalInfo);
        if (!phoneOk) return false;
        const next = await prepareDraftForSave(draft, { notify: true });
        setDraft(next);
        const ok = await updateProfile(next);
        if (ok) {
            clearUnsavedCandidateProfileDraft();
            offerReturnToJobIfNeeded(next);
        }
        return ok;
    };

    const handleCancel = () => {
        clearUnsavedCandidateProfileDraft();
        setDraft(baseline);
        toast.info('Đã hoàn tác các thay đổi chưa lưu.');
    };

    const handleAvatar = (file) => uploadAvatar(file);
    const handleCv = (file) => uploadCv(file);
    const handleDeleteCv = async () => {
        const ok = await deleteCv();
        if (ok) {
            setDraft((prev) => (prev ? { ...prev, cvLink: null } : prev));
        }
        return ok;
    };

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

    const returnJobTitle = returnJobPrompt?.jobTitle || '';

    return (
        <div className="cp-page">
            <ProfileHeader
                profile={draft}
                onUploadAvatar={handleAvatar}
                saving={saving}
            />

            <div className="cp-section-title">
                <h2>Hồ sơ cá nhân</h2>
                <p>Thông tin cơ bản để nhà tuyển dụng liên hệ với bạn</p>
            </div>

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
                    <CvCard
                        cvLink={draft.cvLink || profile?.cvLink}
                        onUploadCv={handleCv}
                        onDeleteCv={handleDeleteCv}
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
                catalogReady={skillsCatalogReady}
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
