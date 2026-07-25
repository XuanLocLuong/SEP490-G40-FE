import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import recruiterJobApi, { getRecruiterJobApiErrorMessage } from '../../../apis/RecruiterJobApi.jsx';
import ApplicationCard from '../../../components/recruiter/applicants/ApplicationCard.jsx';
import ApplicationRejectModal from '../../../components/recruiter/applicants/ApplicationRejectModal.jsx';
import ConfirmModal from '../../../components/common/ConfirmModal.jsx';
import JobStatusBadge from '../../../components/recruiter/jobs/JobStatusBadge.jsx';
import recruiterApplicationService, {
    APPLICATION_SORT_OPTIONS,
    APPLICATION_STATUS_FILTERS,
    getRecruiterApplicationApiErrorMessage,
    isApplicationCancelledError,
} from '../../../services/recruiterApplicationService.js';
import { getCandidatePublicProfilePath, ROUTES } from '../../../routes/path.js';
import '../../../assets/styles/ApplicantsPageStyle.css';

const PAGE_SIZE = 12;
const DEFAULT_STATUS_MANAGE = 'PENDING';
const DEFAULT_STATUS_READONLY = 'ALL';
const DEFAULT_SORT = 'appliedAt,desc';

const canManageApplications = (job) => job?.status === 'OPEN';

const ApplicantsPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [openJobs, setOpenJobs] = useState([]);
    const [focusJob, setFocusJob] = useState(null);
    const [focusJobLoading, setFocusJobLoading] = useState(false);
    const [focusJobError, setFocusJobError] = useState(false);
    const [jobsLoading, setJobsLoading] = useState(true);

    const [applications, setApplications] = useState([]);
    const [listLoading, setListLoading] = useState(false);
    const [listError, setListError] = useState('');
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [acceptTarget, setAcceptTarget] = useState(null);
    const [rejectTarget, setRejectTarget] = useState(null);

    const sortValue = searchParams.get('sort') || DEFAULT_SORT;
    const page = Math.max(0, Number(searchParams.get('page') || 0) || 0);
    const jobIdParam = searchParams.get('jobId');
    const statusParam = searchParams.get('status');

    /** Có jobId trên URL = vào từ My Jobs (hoặc deep link) → hiện nút back. */
    const showBackToMyJobs = Boolean(jobIdParam);

    const selectedJobId = useMemo(() => {
        if (jobIdParam) {
            const parsed = Number(jobIdParam);
            return Number.isFinite(parsed) ? parsed : null;
        }
        return openJobs[0]?.id ?? null;
    }, [jobIdParam, openJobs]);

    const selectedJob = useMemo(() => {
        if (selectedJobId == null) return null;
        const fromOpen = openJobs.find((job) => String(job.id) === String(selectedJobId));
        if (fromOpen) return fromOpen;
        if (focusJob && String(focusJob.id) === String(selectedJobId)) return focusJob;
        return null;
    }, [selectedJobId, openJobs, focusJob]);

    const readOnly = Boolean(selectedJob) && !canManageApplications(selectedJob);
    const statusFilter =
        statusParam || (readOnly ? DEFAULT_STATUS_READONLY : DEFAULT_STATUS_MANAGE);

    const updateParams = useCallback(
        (updates) => {
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                Object.entries(updates).forEach(([key, value]) => {
                    if (value === null || value === undefined || value === '') {
                        next.delete(key);
                    } else {
                        next.set(key, String(value));
                    }
                });
                return next;
            });
        },
        [setSearchParams]
    );

    useEffect(() => {
        let cancelled = false;

        (async () => {
            setJobsLoading(true);
            try {
                const pageData = await recruiterJobApi.getMyJobs({
                    status: 'OPEN',
                    page: 0,
                    size: 100,
                });
                if (!cancelled) {
                    setOpenJobs(pageData?.content || []);
                }
            } catch (err) {
                if (!cancelled) {
                    toast.error(
                        getRecruiterJobApiErrorMessage(err, 'Không tải được danh sách tin.')
                    );
                    setOpenJobs([]);
                }
            } finally {
                if (!cancelled) {
                    setJobsLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    // Resolve tin từ URL khi không nằm trong list OPEN (CLOSED / BLOCKED / …).
    useEffect(() => {
        let cancelled = false;

        if (!jobIdParam) {
            setFocusJob(null);
            setFocusJobLoading(false);
            setFocusJobError(false);
            return undefined;
        }

        const inOpenList = openJobs.some((job) => String(job.id) === jobIdParam);
        if (inOpenList) {
            setFocusJob(null);
            setFocusJobLoading(false);
            setFocusJobError(false);
            return undefined;
        }

        if (jobsLoading) {
            return undefined;
        }

        (async () => {
            setFocusJobLoading(true);
            setFocusJobError(false);
            try {
                const detail = await recruiterJobApi.getJobDetail(jobIdParam);
                if (!cancelled) {
                    setFocusJob(detail || null);
                    setFocusJobError(!detail);
                }
            } catch (err) {
                if (!cancelled) {
                    setFocusJob(null);
                    setFocusJobError(true);
                    toast.error(
                        getRecruiterJobApiErrorMessage(err, 'Không tải được tin tuyển dụng.')
                    );
                }
            } finally {
                if (!cancelled) {
                    setFocusJobLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [jobIdParam, openJobs, jobsLoading]);

    // Chỉ gán jobId mặc định khi vào trang không có ?jobId= — không bao giờ ghi đè jobId URL.
    useEffect(() => {
        if (jobIdParam || jobsLoading) return;
        if (selectedJobId != null) {
            updateParams({ jobId: selectedJobId, page: 0 });
        }
    }, [jobIdParam, jobsLoading, selectedJobId, updateParams]);

    const loadApplications = useCallback(async () => {
        if (selectedJobId == null || focusJobLoading || jobsLoading) {
            return;
        }
        // URL trỏ tin không resolve được — không gọi list / không fallback tin khác.
        if (jobIdParam && !selectedJob) {
            setApplications([]);
            setTotalPages(0);
            setTotalElements(0);
            return;
        }

        setListLoading(true);
        setListError('');
        try {
            const pageData = await recruiterApplicationService.getApplications(selectedJobId, {
                status: statusFilter,
                sort: sortValue,
                page,
                size: PAGE_SIZE,
            });
            setApplications(pageData.content);
            setTotalPages(pageData.totalPages);
            setTotalElements(pageData.totalElements);
        } catch (err) {
            setListError(
                getRecruiterApplicationApiErrorMessage(err, 'Không tải được danh sách ứng viên.')
            );
            setApplications([]);
            setTotalPages(0);
            setTotalElements(0);
        } finally {
            setListLoading(false);
        }
    }, [
        selectedJobId,
        selectedJob,
        statusFilter,
        sortValue,
        page,
        focusJobLoading,
        jobsLoading,
        jobIdParam,
    ]);

    useEffect(() => {
        loadApplications();
    }, [loadApplications]);

    const handleJobChange = (event) => {
        updateParams({
            jobId: event.target.value,
            page: 0,
            status: DEFAULT_STATUS_MANAGE,
        });
    };

    const handleStatusChange = (value) => {
        updateParams({ status: value, page: 0 });
    };

    const handleSortChange = (event) => {
        updateParams({ sort: event.target.value, page: 0 });
    };

    const handleAcceptConfirm = async () => {
        if (!acceptTarget || readOnly) return;
        setActionLoadingId(acceptTarget.id);
        try {
            await recruiterApplicationService.accept(acceptTarget.id);
            toast.success('Đã chấp nhận ứng viên.');
            setAcceptTarget(null);
            await loadApplications();
        } catch (err) {
            const message = getRecruiterApplicationApiErrorMessage(
                err,
                'Không thể chấp nhận ứng viên.'
            );
            toast.error(message);
            if (isApplicationCancelledError(err)) {
                setAcceptTarget(null);
                await loadApplications();
            }
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleRejectConfirm = async ({ reason, note }) => {
        if (!rejectTarget || readOnly) return;
        setActionLoadingId(rejectTarget.id);
        try {
            await recruiterApplicationService.reject(rejectTarget.id, { reason, note });
            toast.success('Đã từ chối ứng viên.');
            setRejectTarget(null);
            await loadApplications();
        } catch (err) {
            const message = getRecruiterApplicationApiErrorMessage(
                err,
                'Không thể từ chối ứng viên.'
            );
            toast.error(message);
            if (isApplicationCancelledError(err)) {
                setRejectTarget(null);
                await loadApplications();
            }
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleViewProfile = (application) => {
        const candidateId = application?.candidateId;
        if (!candidateId) {
            toast.error('Không tìm thấy hồ sơ ứng viên.');
            return;
        }
        const backQuery = selectedJobId != null ? `?jobId=${selectedJobId}` : '';
        navigate(getCandidatePublicProfilePath(candidateId), {
            state: {
                backTo: {
                    path: `${ROUTES.RECRUITER_APPLICANTS}${backQuery}`,
                    label: 'Quay lại danh sách ứng viên',
                },
            },
        });
    };

    const pageLoading = jobsLoading || focusJobLoading;
    const hasOpenJobs = openJobs.length > 0;
    const hasSelectedJob = Boolean(selectedJob);
    const jobNotFound =
        Boolean(jobIdParam) && !pageLoading && !hasSelectedJob && (focusJobError || !focusJobLoading);
    const emptyNoJobs = !pageLoading && !jobIdParam && !hasOpenJobs;
    const hasMorePages = page + 1 < totalPages;
    const showManageDropdown = hasSelectedJob && !readOnly && hasOpenJobs;

    return (
        <div className="applicants-page">
            {showBackToMyJobs && (
                <Link to={ROUTES.RECRUITER_MY_JOBS} className="applicants-page__back">
                    ← Quay lại tin tuyển dụng
                </Link>
            )}

            <h1 className="applicants-page__title">Ứng viên</h1>

            {pageLoading && (
                <div className="applicants-page__loading">Đang tải danh sách tin tuyển dụng…</div>
            )}

            {!pageLoading && emptyNoJobs && (
                <div className="applicants-page__empty">
                    <p>Chưa có tin tuyển dụng đang mở để xem ứng viên.</p>
                    <div className="applicants-page__empty-actions">
                        <Link to={ROUTES.RECRUITER_CREATE_JOB} className="btn btn--primary">
                            Đăng tin mới
                        </Link>
                        <Link to={ROUTES.RECRUITER_MY_JOBS} className="btn btn--secondary">
                            Xem tin của tôi
                        </Link>
                    </div>
                </div>
            )}

            {!pageLoading && jobNotFound && (
                <div className="applicants-page__empty">
                    <p>Không tìm thấy tin tuyển dụng này.</p>
                    <div className="applicants-page__empty-actions">
                        <Link to={ROUTES.RECRUITER_MY_JOBS} className="btn btn--secondary">
                            Quay lại tin của tôi
                        </Link>
                    </div>
                </div>
            )}

            {!pageLoading && hasSelectedJob && (
                <>
                    <div className="applicants-page__toolbar">
                        <div className="applicants-page__job-row">
                            {showManageDropdown ? (
                                <div className="applicants-page__job-field">
                                    <label htmlFor="applicants-job-select">Xem ứng viên cho</label>
                                    <select
                                        id="applicants-job-select"
                                        value={selectedJobId ?? ''}
                                        onChange={handleJobChange}
                                    >
                                        {openJobs.map((job) => (
                                            <option key={job.id} value={job.id}>
                                                {job.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div className="applicants-page__job-locked">
                                    <span className="applicants-page__job-locked-label">
                                        Tin tuyển dụng
                                    </span>
                                    <h2 className="applicants-page__job-locked-title">
                                        {selectedJob.title}
                                    </h2>
                                </div>
                            )}
                            {selectedJob.status && (
                                <JobStatusBadge status={selectedJob.status} />
                            )}
                            <span className="applicants-page__count">
                                {totalElements} ứng viên
                            </span>
                        </div>

                        {readOnly && (
                            <p className="applicants-page__readonly-hint">
                                Tin này không còn đang tuyển — bạn chỉ có thể xem hồ sơ ứng viên,
                                không chấp nhận hoặc từ chối.
                            </p>
                        )}

                        <div className="applicants-page__filters-row">
                            <div className="applicants-page__filters">
                                <label>Trạng thái</label>
                                <div className="applicants-page__chips">
                                    {APPLICATION_STATUS_FILTERS.map((item) => (
                                        <button
                                            key={item.value}
                                            type="button"
                                            className={`applicants-page__chip${
                                                statusFilter === item.value
                                                    ? ' applicants-page__chip--active'
                                                    : ''
                                            }`}
                                            onClick={() => handleStatusChange(item.value)}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="applicants-page__sort">
                                <label htmlFor="applicants-sort">Sắp xếp</label>
                                <select
                                    id="applicants-sort"
                                    value={sortValue}
                                    onChange={handleSortChange}
                                >
                                    {APPLICATION_SORT_OPTIONS.map((item) => (
                                        <option key={item.value} value={item.value}>
                                            {item.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {listLoading && (
                        <div className="applicants-page__loading">Đang tải danh sách ứng viên…</div>
                    )}

                    {!listLoading && listError && (
                        <div className="applicants-page__error">
                            <p>{listError}</p>
                            <button
                                type="button"
                                className="btn btn--secondary"
                                onClick={loadApplications}
                            >
                                Thử lại
                            </button>
                        </div>
                    )}

                    {!listLoading && !listError && applications.length === 0 && (
                        <div className="applicants-page__empty">
                            <p>
                                {statusFilter === 'PENDING'
                                    ? 'Chưa có ứng viên chờ duyệt cho tin này.'
                                    : 'Không có ứng viên phù hợp bộ lọc hiện tại.'}
                            </p>
                            {!readOnly && statusFilter === 'PENDING' && (
                                <div className="applicants-page__empty-actions">
                                    <Link
                                        to={ROUTES.RECRUITER_AI_SUGGESTIONS}
                                        className="btn btn--secondary"
                                    >
                                        Xem JobLink gợi ý
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}

                    {!listLoading && !listError && applications.length > 0 && (
                        <>
                            <div className="applicants-page__grid">
                                {applications.map((application) => (
                                    <ApplicationCard
                                        key={application.id}
                                        application={application}
                                        actionLoading={actionLoadingId === application.id}
                                        readOnly={readOnly}
                                        onAccept={setAcceptTarget}
                                        onReject={setRejectTarget}
                                        onViewProfile={handleViewProfile}
                                    />
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className="applicants-page__pagination">
                                    <button
                                        type="button"
                                        className="btn btn--secondary"
                                        disabled={page <= 0 || listLoading}
                                        onClick={() => updateParams({ page: page - 1 })}
                                    >
                                        Trang trước
                                    </button>
                                    <span>
                                        {page + 1} / {totalPages}
                                    </span>
                                    <button
                                        type="button"
                                        className="btn btn--secondary"
                                        disabled={!hasMorePages || listLoading}
                                        onClick={() => updateParams({ page: page + 1 })}
                                    >
                                        Trang sau
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            <ConfirmModal
                open={Boolean(acceptTarget) && !readOnly}
                title="Chấp nhận ứng viên"
                confirmLabel="Chấp nhận"
                variant="primary"
                loading={Boolean(actionLoadingId)}
                onCancel={() => !actionLoadingId && setAcceptTarget(null)}
                onConfirm={handleAcceptConfirm}
            >
                <p>
                    Gửi lời mời cho <strong>{acceptTarget?.candidateName}</strong>
                    {selectedJob?.title ? ` cho tin "${selectedJob.title}"` : ''}? Ứng viên cần xác
                    nhận để chuyển sang trạng thái đã tuyển.
                </p>
            </ConfirmModal>

            <ApplicationRejectModal
                open={Boolean(rejectTarget) && !readOnly}
                application={rejectTarget}
                jobTitle={selectedJob?.title}
                loading={Boolean(actionLoadingId)}
                onCancel={() => !actionLoadingId && setRejectTarget(null)}
                onConfirm={handleRejectConfirm}
            />
        </div>
    );
};

export default ApplicantsPage;
