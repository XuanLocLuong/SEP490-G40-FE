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
    getJobFormErrorKey,
    mapJobDetailToForm,
    validateJobForm,
    validateJobFormField,
} from '../../../services/jobPostService.js';
import { EDITABLE_JOB_STATUSES, JOB_POST_ACTION, JOB_STATUS_LABELS } from '../../../constants/jobPost.js';
import JobPostForm from '../../../components/recruiter/jobs/JobPostForm.jsx';
import JobPreviewPanel from '../../../components/recruiter/jobs/JobPreviewPanel.jsx';
import '../../../assets/styles/JobPostStyle.css';

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
    const [jobStatus, setJobStatus] = useState(null);

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
                });
            } else {
                setForm({
                    ...emptyJobForm(),
                    locationId: businessLocationId,
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
                const field = key === 'salaryMax' ? 'salaryMax' : key;
                const message = validateJobFormField(field, nextForm);
                const errorKey = getJobFormErrorKey(field);
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

        const payload = buildSavePayload(form, action);
        setSaving(true);

        try {
            if (isEdit) {
                await recruiterJobApi.updateJob(jobId, payload);
                toast.success(
                    action === JOB_POST_ACTION.SUBMIT
                        ? 'Đã gửi tin tuyển dụng để duyệt.'
                        : 'Đã lưu nháp.'
                );
            } else {
                await recruiterJobApi.createJob(payload);
                toast.success(
                    action === JOB_POST_ACTION.SUBMIT
                        ? 'Tạo tin tuyển dụng thành công.'
                        : 'Đã lưu nháp tin tuyển dụng.'
                );
            }
            navigate(ROUTES.RECRUITER_MY_JOBS);
        } catch (err) {
            toast.error(getRecruiterJobApiErrorMessage(err, 'Không thể lưu tin tuyển dụng.'));
        } finally {
            setSaving(false);
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
        <div className="job-post-page">
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
                />
                <JobPreviewPanel
                    form={form}
                    businessLocation={businessLocation}
                    businessName={guardData.profile?.businessName}
                />
            </div>

            <footer className="job-post-page__footer">
                <div className="job-post-page__actions">
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
                        {saving ? 'Đang lưu...' : 'Lưu nháp'}
                    </button>
                    <button
                        type="button"
                        className="job-post-page__btn job-post-page__btn--primary"
                        disabled={saving}
                        onClick={() => handleSave(JOB_POST_ACTION.SUBMIT)}
                    >
                        {saving ? 'Đang đăng...' : 'Đăng tin'}
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default CreateJobPage;
