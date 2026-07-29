import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../../contexts/authContext.js';
import { ROUTES } from '../../../routes/path.js';
import { ensureCanPostJob } from '../../../utils/recruiterJobGuard.js';
import recruiterJobApi, { getRecruiterJobApiErrorMessage } from '../../../apis/RecruiterJobApi.jsx';
import {
    buildSavePayload,
    emptyJobForm,
    formatLocationDisplay,
    getJobFormErrorKey,
    mapJobDetailToForm,
    validateJobForm,
    validateJobFormField,
} from '../../../services/jobPostService.js';
import { EDITABLE_JOB_STATUSES, JOB_POST_ACTION, JOB_STATUS_LABELS } from '../../../constants/jobPost.js';
import JobPostForm from '../../../components/recruiter/jobs/JobPostForm.jsx';
import JobPreviewPanel from '../../../components/recruiter/jobs/JobPreviewPanel.jsx';
import AiJobDescModal from '../../../components/recruiter/jobs/AiJobDescModal.jsx';
import '../../../assets/styles/JobPostStyle.css';

const notifyJobSaveResult = (action, savedJob, { isEdit }) => {
    if (action !== JOB_POST_ACTION.SUBMIT) {
        toast.success(isEdit ? 'Đã lưu nháp.' : 'Đã lưu nháp tin tuyển dụng.');
        return;
    }

    const status = savedJob?.status || savedJob?.jobStatus;

    if (status === 'REVISION_REQUESTED') {
        const note = String(savedJob?.reviewNote || '').trim();
        toast.warning(
            note ||
                'Tin đăng cần chỉnh sửa vì vi phạm tiêu chuẩn cộng đồng. Vào mục Từ chối / Cần chỉnh sửa để xem chi tiết và sửa lại.',
            { autoClose: 6000 }
        );
        return;
    }

    if (status === 'PENDING_REVIEW') {
        toast.info(
            'Đã gửi tin tuyển dụng. Đang chờ duyệt — Post Manager sẽ xem xét trong thời gian sớm nhất.',
            { autoClose: 5000 }
        );
        return;
    }

    if (status === 'OPEN') {
        toast.success('Tin tuyển dụng đã được duyệt và đang hiển thị.');
        return;
    }

    toast.success(isEdit ? 'Đã gửi tin tuyển dụng để duyệt.' : 'Tạo tin tuyển dụng thành công.');
};

const resolveSavedJobId = (savedJob, fallbackId) => {
    if (typeof savedJob === 'number' && Number.isFinite(savedJob)) return savedJob;
    if (typeof savedJob === 'string' && /^\d+$/.test(savedJob.trim())) return Number(savedJob);
    return savedJob?.id ?? savedJob?.jobId ?? fallbackId ?? null;
};

/** Create/update SUBMIT đôi khi chưa trả status cuối — GET detail để biết REVISION_REQUESTED. */
const resolveJobAfterSave = async (savedJob, fallbackId) => {
    const id = resolveSavedJobId(savedJob, fallbackId);
    if (!id) return savedJob;

    try {
        const detail = await recruiterJobApi.getJobDetail(id);
        return detail || savedJob;
    } catch {
        return savedJob;
    }
};

/**
 * Trang tạo mới / chỉnh sửa tin tuyển dụng.
 * - /recruiter/jobs/new        -> create
 * - /recruiter/jobs/:id/edit   -> edit (chỉ DRAFT hoặc REVISION_REQUESTED)
 */
const CreateJobPage = () => {
    const { auth } = useAuth();
    const navigate = useNavigate();
    const { jobId } = useParams();
    const isEdit = Boolean(jobId);

    const [guardData, setGuardData] = useState(null);
    const [form, setForm] = useState(emptyJobForm);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingAction, setSavingAction] = useState(null);
    const [jobStatus, setJobStatus] = useState(null);
    const [aiDescOpen, setAiDescOpen] = useState(false);

    const loadPage = useCallback(async () => {
        setLoading(true);

        try {
            const guard = await ensureCanPostJob({ auth, navigate });
            if (!guard) return;

            setGuardData(guard);
            const businessLocation = guard.locations[0];
            const businessLocationId = businessLocation?.id
                ? String(businessLocation.id)
                : '';
            const businessId = guard.businessId ?? null;

            if (isEdit) {
                const detail = await recruiterJobApi.getJobDetail(jobId);
                const status = detail?.status;

                if (!EDITABLE_JOB_STATUSES.includes(status)) {
                    toast.error('Không thể chỉnh sửa tin tuyển dụng này.');
                    navigate(ROUTES.RECRUITER_MY_JOBS);
                    return;
                }

                setJobStatus(status);
                setForm({
                    ...mapJobDetailToForm(detail),
                    locationId: businessLocationId,
                    businessId: businessId ?? detail.businessId ?? detail.business?.id ?? null,
                });
            } else {
                setForm({
                    ...emptyJobForm(),
                    locationId: businessLocationId,
                    businessId,
                });
            }
        } catch (err) {
            toast.error(getRecruiterJobApiErrorMessage(err, 'Không thể tải trang đăng tin.'));
            navigate(ROUTES.RECRUITER_HOME);
        } finally {
            setLoading(false);
        }
    }, [auth, navigate, isEdit, jobId]);

    useEffect(() => {
        loadPage();
    }, [loadPage]);

    const handleFieldBlur = (field) => {
        const message = validateJobFormField(field, form);
        const errorKey = getJobFormErrorKey(field);

        setErrors((prev) => {
            const next = { ...prev };
            if (message) next[errorKey] = message;
            else delete next[errorKey];
            return next;
        });
    };

    const handleFormChange = (nextForm) => {
        setForm(nextForm);

        setErrors((prev) => {
            const activeKeys = Object.keys(prev).filter((key) => prev[key]);
            if (!activeKeys.length) return prev;

            const next = { ...prev };
            activeKeys.forEach((key) => {
                const message = validateJobFormField(key, nextForm);
                const errorKey = getJobFormErrorKey(key);
                if (message) next[errorKey] = message;
                else delete next[errorKey];
            });
            return next;
        });
    };

    const handleSave = async (action) => {
        const validation = validateJobForm(form, action);
        setErrors(validation.errors);

        if (!validation.valid) {
            toast.error('Vui lòng kiểm tra lại các trường bắt buộc.');
            return;
        }

        const payload = buildSavePayload(form, action, guardData?.businessId);
        setSaving(true);
        setSavingAction(action);

        try {
            const savedJob = isEdit
                ? await recruiterJobApi.updateJob(jobId, payload)
                : await recruiterJobApi.createJob(payload);

            const resolvedJob =
                action === JOB_POST_ACTION.SUBMIT
                    ? await resolveJobAfterSave(savedJob, isEdit ? jobId : null)
                    : savedJob;

            notifyJobSaveResult(action, resolvedJob, { isEdit });

            // Mở đúng tab Tin của tôi theo kết quả submit (pending / cần chỉnh sửa).
            const highlightStatusTab =
                resolvedJob?.status === 'REVISION_REQUESTED'
                    ? 'rejected'
                    : resolvedJob?.status === 'PENDING_REVIEW'
                      ? 'pending'
                      : undefined;

            navigate(ROUTES.RECRUITER_MY_JOBS, {
                state: highlightStatusTab ? { highlightStatusTab } : undefined,
            });
        } catch (err) {
            toast.error(getRecruiterJobApiErrorMessage(err, 'Không thể lưu tin tuyển dụng.'));
        } finally {
            setSaving(false);
            setSavingAction(null);
        }
    };

    if (loading) {
        return (
            <div className="job-post-page">
                <div className="job-post-page__loading">Đang tải...</div>
            </div>
        );
    }

    if (!guardData) return null;

    const businessLocation = guardData.locations[0];

    return (
        <div className={`job-post-page${saving ? ' job-post-page--saving' : ''}`}>
            {saving && (
                <div className="job-post-page__saving-overlay" role="status" aria-live="polite">
                    <div className="job-post-page__saving-card">
                        <span className="job-post-page__spinner" aria-hidden="true" />
                        <p className="job-post-page__saving-title">
                            {savingAction === JOB_POST_ACTION.SUBMIT
                                ? 'Đang gửi tin tuyển dụng…'
                                : 'Đang lưu bản nháp…'}
                        </p>
                        <p className="job-post-page__saving-sub">Vui lòng chờ trong giây lát</p>
                    </div>
                </div>
            )}

            <header className="job-post-page__header">
                <div>
                    <h1>{isEdit ? 'Chỉnh sửa tin tuyển dụng' : 'Đăng tin tuyển dụng'}</h1>
                    {isEdit && jobStatus && (
                        <p className="job-post-page__subtitle">
                            Trạng thái hiện tại:{' '}
                            <strong>{JOB_STATUS_LABELS[jobStatus] || jobStatus}</strong>
                        </p>
                    )}
                </div>
            </header>

            <div className="job-post-page__layout">
                <JobPostForm
                    form={form}
                    errors={errors}
                    businessLocation={businessLocation}
                    disabled={saving}
                    onChange={handleFormChange}
                    onFieldBlur={handleFieldBlur}
                    onOpenAiDesc={() => setAiDescOpen(true)}
                />

                <aside className="job-post-page__sidebar">
                    <JobPreviewPanel
                        form={form}
                        businessLocation={businessLocation}
                        businessName={guardData.profile?.businessName}
                        logoUrl={guardData.profile?.logoUrl}
                    />

                    <div className="job-post-page__actions job-post-page__actions--sidebar">
                        <button
                            type="button"
                            className="job-post-page__btn job-post-page__btn--ghost"
                            disabled={saving}
                            onClick={() => navigate(ROUTES.RECRUITER_MY_JOBS)}
                        >
                            Hủy
                        </button>
                        <button
                            type="button"
                            className="job-post-page__btn job-post-page__btn--secondary"
                            disabled={saving}
                            onClick={() => handleSave(JOB_POST_ACTION.SAVE_DRAFT)}
                        >
                            {saving && savingAction === JOB_POST_ACTION.SAVE_DRAFT ? (
                                <>
                                    <span className="job-post-page__btn-spinner" aria-hidden="true" />
                                    Đang lưu...
                                </>
                            ) : (
                                'Lưu nháp'
                            )}
                        </button>
                        <button
                            type="button"
                            className="job-post-page__btn job-post-page__btn--primary"
                            disabled={saving}
                            onClick={() => handleSave(JOB_POST_ACTION.SUBMIT)}
                        >
                            {saving && savingAction === JOB_POST_ACTION.SUBMIT ? (
                                <>
                                    <span className="job-post-page__btn-spinner" aria-hidden="true" />
                                    Đang đăng...
                                </>
                            ) : (
                                'Đăng tin'
                            )}
                        </button>
                    </div>
                </aside>
            </div>

            <AiJobDescModal
                open={aiDescOpen}
                jobTitle={form.title}
                jobType={form.jobType}
                businessName={guardData.profile?.businessName}
                businessType={guardData.profile?.businessType}
                salaryMin={form.salaryMin}
                salaryMax={form.salaryMax}
                requiredCandidates={form.requiredCandidates}
                isUrgent={form.isUrgent}
                locationLabel={formatLocationDisplay(businessLocation)}
                skillIds={form.skillIds}
                onClose={() => setAiDescOpen(false)}
                onApply={(html) => {
                    setForm((prev) => ({ ...prev, description: html }));
                    toast.success('Đã chèn mô tả do AI gợi ý.');
                }}
            />
        </div>
    );
};

export default CreateJobPage;
