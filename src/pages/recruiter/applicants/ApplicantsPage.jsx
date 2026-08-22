import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import recruiterJobApi, { getRecruiterJobApiErrorMessage } from '../../../apis/RecruiterJobApi.jsx';
import ApplicationCard from '../../../components/recruiter/applicants/ApplicationCard.jsx';
import ApplicationRejectModal from '../../../components/recruiter/applicants/ApplicationRejectModal.jsx';
import ConfirmModal from '../../../components/common/ConfirmModal.jsx';
import ReviewSubmitModal from '../../../components/review/ReviewSubmitModal.jsx';
import JobStatusBadge from '../../../components/recruiter/jobs/JobStatusBadge.jsx';
import {
    getMyApplicationReview,
    getReviewApiErrorMessage,
    submitApplicationReview,
} from '../../../apis/ReviewApi.jsx';
import recruiterApplicationService, {
    APPLICATION_SORT_OPTIONS,
    APPLICATION_STATUS_FILTERS,
    getRecruiterApplicationApiErrorMessage,
    isApplicationCancelledError,
} from '../../../services/recruiterApplicationService.js';
import {
    getCandidatePublicProfilePath,
    getRecruiterJobAnalyticsPath,
    getRecruiterJobSuggestionsPath,
    getRecruiterMyJobsPath,
    ROUTES,
} from '../../../routes/path.js';
import {
    openChatPanel,
    RECRUITMENT_CHANGED_EVENT,
} from '../../../utils/chatEvents.js';
import '../../../assets/styles/ApplicantsPageStyle.css';

const PAGE_SIZE = 9;
const DEFAULT_STATUS_MANAGE = 'PENDING';
const DEFAULT_STATUS_READONLY = 'ALL';
const DEFAULT_SORT = 'appliedAt,desc';

const canManageApplications = (job) => job?.status === 'OPEN';

const ApplicantsPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
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
    const [chatLoadingId, setChatLoadingId] = useState(null);
    const [acceptTarget, setAcceptTarget] = useState(null);
    const [rejectTarget, setRejectTarget] = useState(null);
    const [reviewTarget, setReviewTarget] = useState(null);
    const [reviewBusy, setReviewBusy] = useState(false);
    const [reviewMode, setReviewMode] = useState('edit');
    const [reviewDraft, setReviewDraft] = useState({ rating: 5, comment: '' });
    const [reviewedIds, setReviewedIds] = useState(() => new Set());
    const [reviewCache, setReviewCache] = useState(() => ({}));


    const sortValue = searchParams.get('sort') || DEFAULT_SORT;
    const page = Math.max(0, Number(searchParams.get('page') || 0) || 0);
    const jobIdParam = searchParams.get('jobId');
    const statusParam = searchParams.get('status');
    const fromParam = searchParams.get('from');

    /** Chỉ hiện back khi vào từ Tin của tôi hoặc thống kê tin — không hiện khi vào từ menu / thông báo. */
    const showBackLink = fromParam === 'my-jobs' || fromParam === 'analytics';
    const backNav = useMemo(() => {
        if (fromParam === 'analytics' && jobIdParam) {
            return {
                to: getRecruiterJobAnalyticsPath(jobIdParam),
                label: 'Quay lại thống kê',
                state: location.state,
            };
        }
        if (fromParam === 'my-jobs') {
            return {
                to: getRecruiterMyJobsPath({ tab: 'open', jobId: jobIdParam || undefined }),
                label: 'Quay lại Tin của tôi',
                state: undefined,
            };
        }
        return null;
    }, [fromParam, jobIdParam, location.state]);

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

    useEffect(() => {
        const hired = applications.filter((app) => app.status === 'HIRED' && app.id != null);
        if (hired.length === 0) return undefined;

        let cancelled = false;
        (async () => {
            const found = new Set();
            const cache = {};
            await Promise.all(
                hired.map(async (app) => {
                    try {
                        const res = await getMyApplicationReview(app.id);
                        const data = res?.data?.data ?? res?.data ?? null;
                        if (data) {
                            const key = String(app.id);
                            found.add(key);
                            cache[key] = {
                                rating: data.rating ?? 5,
                                comment: data.comment || '',
                            };
                        }
                    } catch {
                        // 404 = chưa đánh giá
                    }
                })
            );
            if (cancelled) return;
            if (found.size > 0) {
                setReviewedIds((prev) => {
                    const next = new Set(prev);
                    found.forEach((id) => next.add(id));
                    return next;
                });
                setReviewCache((prev) => ({ ...prev, ...cache }));
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [applications]);

    // Refresh list when recruiter accepts/rejects via chat float.
    useEffect(() => {
        const onRecruitmentChanged = (event) => {
            const detail = event?.detail || {};
            if (detail.kind && detail.kind !== 'application' && detail.kind !== 'invitation')
                return;
            if (
                detail.jobId != null &&
                selectedJobId != null &&
                String(detail.jobId) !== String(selectedJobId)
            ) {
                return;
            }
            void loadApplications();
        };

        window.addEventListener(RECRUITMENT_CHANGED_EVENT, onRecruitmentChanged);
        return () =>
            window.removeEventListener(RECRUITMENT_CHANGED_EVENT, onRecruitmentChanged);
    }, [loadApplications, selectedJobId]);

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
            toast.success('Đã chấp nhận đơn ứng tuyển.');
            setAcceptTarget(null);
            await loadApplications();
        } catch (err) {
            const message = getRecruiterApplicationApiErrorMessage(
                err,
                'Không thể chấp nhận đơn ứng tuyển.'
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
        const returnParams = new URLSearchParams();
        if (selectedJobId != null) returnParams.set('jobId', String(selectedJobId));
        if (fromParam === 'my-jobs' || fromParam === 'analytics') {
            returnParams.set('from', fromParam);
        }
        const backQuery = returnParams.toString() ? `?${returnParams.toString()}` : '';
        navigate(getCandidatePublicProfilePath(candidateId), {
            state: {
                candidateUserId: application?.candidateUserId ?? null,
                backTo: {
                    path: `${ROUTES.RECRUITER_APPLICANTS}${backQuery}`,
                    label: 'Quay lại danh sách ứng viên',
                },
            },
        });
    };

    const handleChat = async (application) => {
        if (application?.candidateUserId == null) {
            toast.error('Không mở được chat: thiếu ID ứng viên từ API.');
            return;
        }
        if (selectedJobId == null) {
            toast.error('Chưa chọn tin tuyển dụng.');
            return;
        }
        setChatLoadingId(application.id);
        try {
            openChatPanel({
                jobId: selectedJobId,
                otherUserId: application.candidateUserId,
            });
        } finally {
            window.setTimeout(() => setChatLoadingId(null), 800);
        }
    };

    const handleOpenReview = async (application) => {
        if (!application?.id || application.status !== 'HIRED') return;
        const key = String(application.id);

        if (reviewedIds.has(key)) {
            setReviewBusy(true);
            try {
                let draft = reviewCache[key];
                if (!draft) {
                    const res = await getMyApplicationReview(application.id);
                    const data = res?.data?.data ?? res?.data ?? null;
                    draft = {
                        rating: data?.rating ?? 5,
                        comment: data?.comment || '',
                    };
                    setReviewCache((prev) => ({ ...prev, [key]: draft }));
                }
                setReviewDraft(draft);
                setReviewMode('view');
                setReviewTarget(application);
            } catch (err) {
                toast.error(getReviewApiErrorMessage(err, 'Không tải được đánh giá.'));
            } finally {
                setReviewBusy(false);
            }
            return;
        }

        setReviewDraft({ rating: 5, comment: '' });
        setReviewMode('edit');
        setReviewTarget(application);
    };

    const handleSubmitReview = async ({ rating, comment }) => {
        if (!reviewTarget?.id || reviewBusy || reviewMode === 'view') return;
        setReviewBusy(true);
        try {
            await submitApplicationReview(reviewTarget.id, {
                rating,
                comment: comment || null,
            });
            const key = String(reviewTarget.id);
            const draft = { rating, comment: comment || '' };
            setReviewedIds((prev) => new Set(prev).add(key));
            setReviewCache((prev) => ({ ...prev, [key]: draft }));
            setReviewTarget(null);
            toast.success('Đã gửi đánh giá.');
        } catch (err) {
            toast.error(getReviewApiErrorMessage(err, 'Không gửi được đánh giá.'));
        } finally {
            setReviewBusy(false);
        }
    };

    const pageLoading = jobsLoading || focusJobLoading;
    const hasOpenJobs = openJobs.length > 0;
    const hasSelectedJob = Boolean(selectedJob);
    const jobNotFound =
        Boolean(jobIdParam) && !pageLoading && !hasSelectedJob && (focusJobError || !focusJobLoading);
    const emptyNoJobs = !pageLoading && !jobIdParam && !hasOpenJobs;
    const hasMorePages = page + 1 < totalPages;
    const showManageDropdown = hasSelectedJob && !readOnly && hasOpenJobs;

    const pageItems = useMemo(() => {
        if (totalPages <= 1) return [];
        if (totalPages <= 4) {
            return Array.from({ length: totalPages }, (_, i) => i);
        }
        const last = totalPages - 1;
        const set = new Set([0, last, page, page - 1, page + 1, page - 2, page + 2]);
        const sorted = [...set].filter((p) => p >= 0 && p <= last).sort((a, b) => a - b);
        const items = [];
        let prev = null;
        sorted.forEach((p) => {
            if (prev != null && p - prev > 1) items.push('ellipsis');
            items.push(p);
            prev = p;
        });
        return items;
    }, [page, totalPages]);

    const goToPage = (nextPage) => {
        if (listLoading) return;
        if (nextPage < 0 || nextPage >= totalPages || nextPage === page) return;
        updateParams({ page: nextPage });
    };

    return (
        <div className="applicants-page">
            {showBackLink && backNav && (
                <Link
                    to={backNav.to}
                    state={backNav.state}
                    className="applicants-page__back"
                >
                    ← {backNav.label}
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
                                        to={
                                            selectedJobId != null
                                                ? getRecruiterJobSuggestionsPath(selectedJobId, {
                                                      from: 'applicants',
                                                  })
                                                : ROUTES.RECRUITER_MY_JOBS
                                        }
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
                                        chatLoading={chatLoadingId === application.id}
                                        reviewLoading={
                                            reviewBusy && reviewTarget?.id === application.id
                                        }
                                        hasReviewed={reviewedIds.has(String(application.id))}
                                        readOnly={readOnly}
                                        onAccept={setAcceptTarget}
                                        onReject={setRejectTarget}
                                        onViewProfile={handleViewProfile}
                                        onChat={handleChat}
                                        onReview={handleOpenReview}
                                    />
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <nav
                                    className="applicants-page__pagination"
                                    aria-label="Phân trang ứng viên"
                                >
                                    <button
                                        type="button"
                                        className="applicants-page__page-btn applicants-page__page-btn--nav"
                                        disabled={page <= 0 || listLoading}
                                        onClick={() => goToPage(page - 1)}
                                        aria-label="Trang trước"
                                    >
                                        ‹
                                    </button>
                                    {pageItems.map((item, index) =>
                                        item === 'ellipsis' ? (
                                            <span
                                                key={`e-${index}`}
                                                className="applicants-page__page-ellipsis"
                                                aria-hidden="true"
                                            >
                                                …
                                            </span>
                                        ) : (
                                            <button
                                                key={item}
                                                type="button"
                                                className={`applicants-page__page-btn${
                                                    item === page ? ' is-active' : ''
                                                }`}
                                                disabled={listLoading}
                                                aria-current={item === page ? 'page' : undefined}
                                                aria-label={`Trang ${item + 1}`}
                                                onClick={() => goToPage(item)}
                                            >
                                                {item + 1}
                                            </button>
                                        )
                                    )}
                                    <button
                                        type="button"
                                        className="applicants-page__page-btn applicants-page__page-btn--nav"
                                        disabled={!hasMorePages || listLoading}
                                        onClick={() => goToPage(page + 1)}
                                        aria-label="Trang sau"
                                    >
                                        ›
                                    </button>
                                </nav>
                            )}
                        </>
                    )}
                </>
            )}

            <ConfirmModal
                open={Boolean(acceptTarget) && !readOnly}
                title="Chấp nhận đơn ứng tuyển"
                confirmLabel="Chấp nhận"
                variant="primary"
                loading={Boolean(actionLoadingId)}
                onCancel={() => !actionLoadingId && setAcceptTarget(null)}
                onConfirm={handleAcceptConfirm}
            >
                <p>
                    Bạn có chắc muốn chấp nhận đơn ứng tuyển của{' '}
                    <strong>{acceptTarget?.candidateName}</strong>
                    {selectedJob?.title ? (
                        <>
                            {' '}
                            cho tin &ldquo;{selectedJob.title}&rdquo;
                        </>
                    ) : null}
                    ?
                </p>
                <p className="confirm-modal__hint">
                    Sau khi chấp nhận, ứng viên cần xác nhận nhận việc để hoàn tất tuyển
                    dụng.
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

            <ReviewSubmitModal
                open={Boolean(reviewTarget)}
                busy={reviewBusy}
                variant="page"
                mode={reviewMode}
                title={reviewMode === 'view' ? 'Xem đánh giá' : 'Đánh giá ứng viên'}
                subtitle={reviewTarget?.candidateName || ''}
                initialRating={reviewDraft.rating}
                initialComment={reviewDraft.comment}
                onClose={() => {
                    if (reviewBusy) return;
                    setReviewTarget(null);
                }}
                onSubmit={handleSubmitReview}
            />
        </div>
    );
};

export default ApplicantsPage;
