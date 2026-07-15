import { useCallback, useEffect, useState } from 'react';

import { Link } from 'react-router-dom';

import { toast } from 'react-toastify';

import { ROUTES, getRecruiterEditJobPath } from '../../../routes/path.js';

import recruiterJobApi, { getRecruiterJobApiErrorMessage } from '../../../apis/RecruiterJobApi.jsx';

import { formatSalaryRange } from '../../../services/jobPostService.js';

import ConfirmModal from '../../../components/common/ConfirmModal.jsx';

import JobStatusBadge from '../../../components/recruiter/jobs/JobStatusBadge.jsx';

import '../../../assets/styles/MyJobsStyle.css';



const formatDate = (value) => {

    if (!value) return '—';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return '—';

    return date.toLocaleDateString('vi-VN');

};



const CONFIRM_DIALOG = {

    delete: {

        title: 'Xóa tin nháp',

        confirmLabel: 'Xóa tin',

        variant: 'danger',

    },

    close: {

        title: 'Đóng tin tuyển dụng',

        confirmLabel: 'Đóng tin',

        variant: 'warning',

    },

    reopen: {

        title: 'Mở lại tin tuyển dụng',

        confirmLabel: 'Mở lại tin',

        variant: 'primary',

    },

};



const MyJobsPage = () => {

    const [jobs, setJobs] = useState([]);

    const [loading, setLoading] = useState(true);

    const [statusFilter, setStatusFilter] = useState('');

    const [actionLoadingId, setActionLoadingId] = useState(null);

    const [confirmDialog, setConfirmDialog] = useState(null);



    const loadJobs = useCallback(async () => {

        setLoading(true);



        try {

            const params = { page: 0, size: 50 };

            if (statusFilter) params.status = statusFilter;



            const page = await recruiterJobApi.getMyJobs(params);

            setJobs(page?.content || []);

        } catch (err) {

            toast.error(getRecruiterJobApiErrorMessage(err, 'Không thể tải danh sách tin.'));

        } finally {

            setLoading(false);

        }

    }, [statusFilter]);



    useEffect(() => {

        loadJobs();

    }, [loadJobs]);



    const openConfirm = (type, job, nextStatus = null) => {

        setConfirmDialog({ type, job, nextStatus });

    };



    const closeConfirm = () => {

        if (!actionLoadingId) setConfirmDialog(null);

    };



    const handleConfirm = async () => {

        if (!confirmDialog) return;



        const { type, job, nextStatus } = confirmDialog;

        setActionLoadingId(job.id);



        try {

            if (type === 'delete') {

                await recruiterJobApi.deleteJob(job.id);

                toast.success('Đã xóa tin nháp.');

                setJobs((prev) => prev.filter((j) => j.id !== job.id));

            } else {

                await recruiterJobApi.changeJobStatus(job.id, nextStatus);

                toast.success(

                    type === 'close' ? 'Đã đóng tin tuyển dụng.' : 'Đã mở lại tin tuyển dụng.'

                );

                setJobs((prev) =>

                    prev.map((j) => (j.id === job.id ? { ...j, status: nextStatus } : j))

                );

            }

            setConfirmDialog(null);

        } catch (err) {

            const fallback =

                type === 'delete'

                    ? 'Không thể xóa tin.'

                    : 'Không thể đổi trạng thái tin.';

            toast.error(getRecruiterJobApiErrorMessage(err, fallback));

        } finally {

            setActionLoadingId(null);

        }

    };



    const renderConfirmBody = () => {

        if (!confirmDialog) return null;



        const { type, job } = confirmDialog;



        if (type === 'delete') {

            return (

                <p className="confirm-modal__message">

                    Bạn có chắc muốn xóa bản nháp <strong>{job.title}</strong>? Hành động này

                    không thể hoàn tác.

                </p>

            );

        }



        if (type === 'close') {

            return (

                <>

                    <p className="confirm-modal__message">

                        Bạn có chắc muốn đóng tin <strong>{job.title}</strong>?

                    </p>

                    <p className="confirm-modal__hint">

                        Ứng viên sẽ không thấy tin trên hệ thống và không thể nộp hồ sơ mới.

                    </p>

                </>

            );

        }



        return (

            <>

                <p className="confirm-modal__message">

                    Bạn có chắc muốn mở lại tin <strong>{job.title}</strong>?

                </p>

                <p className="confirm-modal__hint">

                    Tin sẽ hiển thị cho ứng viên và có thể nhận hồ sơ mới (nếu còn hạn và còn

                    vị trí tuyển).

                </p>

            </>

        );

    };



    const canEdit = (status) => status === 'DRAFT' || status === 'REVISION_REQUESTED';

    const dialogConfig = confirmDialog ? CONFIRM_DIALOG[confirmDialog.type] : null;

    const isActionLoading = Boolean(actionLoadingId);



    return (

        <div className="my-jobs-page">

            <header className="my-jobs-page__header">

                <div>

                    <h1>Tin tuyển dụng của tôi</h1>

                </div>

                <Link to={ROUTES.RECRUITER_CREATE_JOB} className="my-jobs-page__create-btn">

                    + Đăng tin mới

                </Link>

            </header>



            <div className="my-jobs-page__filters">

                <label htmlFor="status-filter">Lọc theo trạng thái</label>

                <select

                    id="status-filter"

                    value={statusFilter}

                    onChange={(e) => setStatusFilter(e.target.value)}

                >

                    <option value="">Tất cả</option>

                    <option value="DRAFT">Bản nháp</option>

                    <option value="PENDING_REVIEW">Chờ duyệt</option>

                    <option value="OPEN">Đang tuyển</option>

                    <option value="REVISION_REQUESTED">Cần chỉnh sửa</option>

                    <option value="CLOSED">Đã đóng</option>

                    <option value="REJECTED">Bị từ chối</option>

                </select>

            </div>



            {loading ? (

                <div className="my-jobs-page__loading">Đang tải...</div>

            ) : jobs.length === 0 ? (

                <div className="my-jobs-page__empty">

                    <p>Chưa có tin tuyển dụng nào.</p>

                    <Link to={ROUTES.RECRUITER_CREATE_JOB}>Đăng tin</Link>

                </div>

            ) : (

                <div className="my-jobs-page__list">

                    {jobs.map((job) => (

                        <article key={job.id} className="my-jobs-page__card">

                            <div className="my-jobs-page__card-main">

                                <div className="my-jobs-page__card-top">

                                    <h2>{job.title}</h2>

                                    <JobStatusBadge status={job.status} />

                                </div>

                                <p className="my-jobs-page__salary">

                                    {formatSalaryRange(job.salaryMin, job.salaryMax)}

                                </p>

                                <p className="my-jobs-page__meta">

                                    {job.location?.name || job.location?.city || '—'} · Tạo{' '}

                                    {formatDate(job.createdAt)}

                                    {job.applicationCount != null

                                        ? ` · ${job.applicationCount} hồ sơ`

                                        : ''}

                                </p>

                            </div>



                            <div className="my-jobs-page__card-actions">

                                {canEdit(job.status) && (

                                    <Link

                                        to={getRecruiterEditJobPath(job.id)}

                                        className="my-jobs-page__action my-jobs-page__action--edit"

                                    >

                                        Sửa

                                    </Link>

                                )}

                                {job.status === 'OPEN' && (

                                    <button

                                        type="button"

                                        className="my-jobs-page__action my-jobs-page__action--close"

                                        disabled={isActionLoading}

                                        onClick={() => openConfirm('close', job, 'CLOSED')}

                                    >

                                        Đóng tin

                                    </button>

                                )}

                                {job.status === 'CLOSED' && (

                                    <button

                                        type="button"

                                        className="my-jobs-page__action my-jobs-page__action--reopen"

                                        disabled={isActionLoading}

                                        onClick={() => openConfirm('reopen', job, 'OPEN')}

                                    >

                                        Mở lại tin

                                    </button>

                                )}

                                {job.status === 'DRAFT' && (

                                    <button

                                        type="button"

                                        className="my-jobs-page__action my-jobs-page__action--delete"

                                        disabled={isActionLoading}

                                        onClick={() => openConfirm('delete', job)}

                                    >

                                        Xóa

                                    </button>

                                )}

                            </div>

                        </article>

                    ))}

                </div>

            )}



            <ConfirmModal

                open={Boolean(confirmDialog)}

                title={dialogConfig?.title}

                confirmLabel={dialogConfig?.confirmLabel}

                variant={dialogConfig?.variant}

                loading={isActionLoading}

                onConfirm={handleConfirm}

                onCancel={closeConfirm}

            >

                {renderConfirmBody()}

            </ConfirmModal>

        </div>

    );

};



export default MyJobsPage;

