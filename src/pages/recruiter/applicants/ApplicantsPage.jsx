import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import recruiterJobApi, { getRecruiterJobApiErrorMessage } from '../../../apis/RecruiterJobApi.jsx';
import ApplicationCard from '../../../components/recruiter/applicants/ApplicationCard.jsx';
import ApplicationRejectModal from '../../../components/recruiter/applicants/ApplicationRejectModal.jsx';
import ConfirmModal from '../../../components/common/ConfirmModal.jsx';
import recruiterApplicationService, {
    APPLICATION_SORT_OPTIONS,
    APPLICATION_STATUS_FILTERS,
    getRecruiterApplicationApiErrorMessage,
} from '../../../services/recruiterApplicationService.js';
import { ROUTES } from '../../../routes/path.js';
import '../../../assets/styles/ApplicantsPageStyle.css';

const PAGE_SIZE = 12;
const DEFAULT_STATUS = 'PENDING';
const DEFAULT_SORT = 'appliedAt,desc';

const ApplicantsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const [openJobs, setOpenJobs] = useState([]);
    const [jobsLoading, setJobsLoading] = useState(true);

    const [applications, setApplications] = useState([]);
    const [listLoading, setListLoading] = useState(false);
    const [listError, setListError] = useState('');
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [acceptTarget, setAcceptTarget] = useState(null);
    const [rejectTarget, setRejectTarget] = useState(null);

    const statusFilter = searchParams.get('status') || DEFAULT_STATUS;
    const sortValue = searchParams.get('sort') || DEFAULT_SORT;
    const page = Math.max(0, Number(searchParams.get('page') || 0) || 0);
    const jobIdParam = searchParams.get('jobId');

    const selectedJobId = useMemo(() => {
        if (!openJobs.length) return null;
        if (jobIdParam && openJobs.some((job) => String(job.id) === jobIdParam)) {
            return Number(jobIdParam);
        }
        return openJobs[0]?.id ?? null;
    }, [openJobs, jobIdParam]);

    const selectedJob = useMemo(
        () => openJobs.find((job) => job.id === selectedJobId) || null,
        [openJobs, selectedJobId]
    );

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
                const pageData = await recruiterJobApi.getMyJobs({ status: 'OPEN', page: 0, size: 100 });
                if (!cancelled) {
                    setOpenJobs(pageData?.content || []);
                }
            } catch (err) {
                if (!cancelled) {
                    toast.error(getRecruiterJobApiErrorMessage(err, 'Không tải được danh sách tin.'));
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

    useEffect(() => {
        if (!selectedJobId || jobsLoading) {
            return;
        }
        if (jobIdParam !== String(selectedJobId)) {
            updateParams({ jobId: selectedJobId, page: 0 });
        }
    }, [selectedJobId, jobIdParam, jobsLoading, updateParams]);

    const loadApplications = useCallback(async () => {
        if (!selectedJobId) {
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
            setListError(getRecruiterApplicationApiErrorMessage(err, 'Không tải được danh sách ứng viên.'));
            setApplications([]);
            setTotalPages(0);
            setTotalElements(0);
        } finally {
            setListLoading(false);
        }
    }, [selectedJobId, statusFilter, sortValue, page]);

    useEffect(() => {
        loadApplications();
    }, [loadApplications]);

    const handleJobChange = (event) => {
        updateParams({ jobId: event.target.value, page: 0 });
    };

    const handleStatusChange = (value) => {
        updateParams({ status: value, page: 0 });
    };

    const handleSortChange = (event) => {
        updateParams({ sort: event.target.value, page: 0 });
    };

    const handleAcceptConfirm = async () => {
        if (!acceptTarget) return;
        setActionLoadingId(acceptTarget.id);
        try {
            await recruiterApplicationService.accept(acceptTarget.id);
            toast.success('Đã chấp nhận ứng viên.');
            setAcceptTarget(null);
            await loadApplications();
        } catch (err) {
            toast.error(getRecruiterApplicationApiErrorMessage(err, 'Không thể chấp nhận ứng viên.'));
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleRejectConfirm = async ({ reason, note }) => {
        if (!rejectTarget) return;
        setActionLoadingId(rejectTarget.id);
        try {
            await recruiterApplicationService.reject(rejectTarget.id, { reason, note });
            toast.success('Đã từ chối ứng viên.');
            setRejectTarget(null);
            await loadApplications();
        } catch (err) {
            toast.error(getRecruiterApplicationApiErrorMessage(err, 'Không thể từ chối ứng viên.'));
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleViewProfile = () => {
        toast.info('Xem hồ sơ ứng viên sẽ được bổ sung sau.');
    };

    const hasOpenJobs = openJobs.length > 0;
    const hasMorePages = page + 1 < totalPages;

    return (
        <div className="applicants-page">
            <h1 className="applicants-page__title">Ứng viên</h1>

            {jobsLoading && (
                <div className="applicants-page__loading">Đang tải danh sách tin tuyển dụng…</div>
            )}

            {!jobsLoading && !hasOpenJobs && (
                <div className="applicants-page__empty">
                    <p>Chưa có tin tuyển dụng đang mở.</p>
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

            {!jobsLoading && hasOpenJobs && (
                <>
                    <div className="applicants-page__toolbar">
                        <div className="applicants-page__job-row">
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
                            <span className="applicants-page__count">
                                {totalElements} ứng viên
                            </span>
                        </div>

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
                            <button type="button" className="btn btn--secondary" onClick={loadApplications}>
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
                            {statusFilter === 'PENDING' && (
                                <div className="applicants-page__empty-actions">
                                    <Link to={ROUTES.RECRUITER_AI_SUGGESTIONS} className="btn btn--secondary">
                                        Xem AI Gợi ý
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
                open={Boolean(acceptTarget)}
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
                open={Boolean(rejectTarget)}
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
