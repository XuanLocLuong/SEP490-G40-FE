import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import recruiterJobApi, { getRecruiterJobApiErrorMessage } from '../../../apis/RecruiterJobApi.jsx';
import ApplicationCard from '../../../components/recruiter/applicants/ApplicationCard.jsx';
import JobPickerCombobox from '../../../components/recruiter/applicants/JobPickerCombobox.jsx';
import ApplicationRejectModal from '../../../components/recruiter/applicants/ApplicationRejectModal.jsx';
import ApplicationRejectDetailModal from '../../../components/recruiter/applicants/ApplicationRejectDetailModal.jsx';
import ConfirmModal from '../../../components/common/ConfirmModal.jsx';
import ReviewSubmitModal from '../../../components/review/ReviewSubmitModal.jsx';
import JobStatusBadge from '../../../components/recruiter/jobs/JobStatusBadge.jsx';
import {
    getMyApplicationReview,
    getReviewApiErrorMessage,
    submitApplicationReview,
} from '../../../apis/ReviewApi.jsx';
import recruiterApplicationService, {
    APPLICATION_STATUS_FILTERS,
    MATCH_BUCKETS,
    flattenApplicationBuckets,
    getRecruiterApplicationApiErrorMessage,
    isApplicationCancelledError,
} from '../../../services/recruiterApplicationService.js';
import {
    getCandidatePublicProfilePath,
    getRecruiterJobAnalyticsPath,
    getRecruiterJobSuggestionsPath,
    getRecruiterMyJobsPath,
    getMyJobsTabForStatus,
    ROUTES,
} from '../../../routes/path.js';
import {
    RECRUITMENT_CARD_GRID_PAGE_SIZE,
    DEFAULT_MATCH_BUCKET_KEY,
} from '../../../constants/recruitmentCardGrid.js';
import {
    buildRecruitmentPageItems,
    paginateItems,
} from '../../../utils/recruitmentPagination.js';
import {
    openChatPanel,
    RECRUITMENT_CHANGED_EVENT,
} from '../../../utils/chatEvents.js';
import '../../../assets/styles/ApplicantsPageStyle.css';

const DEFAULT_STATUS_MANAGE = 'PENDING';
const DEFAULT_STATUS_READONLY = 'ALL';

const EMPTY_MATCH_DATA = {
    totalApplications: 0,
    statusCounts: {},
    highMatchCount: 0,
    mediumMatchCount: 0,
    lowMatchCount: 0,
    criticalMismatchCount: 0,
    highMatch: [],
    mediumMatch: [],
    lowMatch: [],
    criticalMismatch: [],
    applications: [],
};

const canManageApplications = (job) =>
    job?.status === 'OPEN' || job?.status === 'CLOSED';

const ApplicantsPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();

    const [openJobs, setOpenJobs] = useState([]);
    const [focusJob, setFocusJob] = useState(null);
    const [focusJobLoading, setFocusJobLoading] = useState(false);
    const [focusJobError, setFocusJobError] = useState(false);
    const [jobsLoading, setJobsLoading] = useState(true);

    const [matchData, setMatchData] = useState(EMPTY_MATCH_DATA);
    const [listLoading, setListLoading] = useState(false);
    const [listError, setListError] = useState('');
    const [activeMatchTab, setActiveMatchTab] = useState(DEFAULT_MATCH_BUCKET_KEY);
    const [pendingPageByTab, setPendingPageByTab] = useState({});
    const [statusListPage, setStatusListPage] = useState(0);

    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [chatLoadingId, setChatLoadingId] = useState(null);
    const [acceptTarget, setAcceptTarget] = useState(null);
    const [rejectTarget, setRejectTarget] = useState(null);
    const [viewRejectReasonTarget, setViewRejectReasonTarget] = useState(null);
    const [reviewTarget, setReviewTarget] = useState(null);
    const [reviewBusy, setReviewBusy] = useState(false);
    const [reviewMode, setReviewMode] = useState('edit');
    const [reviewDraft, setReviewDraft] = useState({ rating: 5, comment: '' });
    const [reviewedIds, setReviewedIds] = useState(() => new Set());
    const [reviewCache, setReviewCache] = useState(() => ({}));


    const jobIdParam = searchParams.get('jobId');
    const statusParam = searchParams.get('status');
    const fromParam = searchParams.get('from');

    /** Back khi vào từ Tổng quan / Tin của tôi / thống kê — không hiện khi vào từ menu / thông báo. */
    const showBackLink =
        fromParam === 'overview' || fromParam === 'my-jobs' || fromParam === 'analytics';

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

    const backNav = useMemo(() => {
        if (fromParam === 'overview') {
            return {
                to: ROUTES.RECRUITER_HOME,
                label: 'Quay lại tổng quan',
                state: undefined,
            };
        }
        if (fromParam === 'analytics' && jobIdParam) {
            return {
                to: getRecruiterJobAnalyticsPath(jobIdParam),
                label: 'Quay lại thống kê',
                state: location.state,
            };
        }
        if (fromParam === 'my-jobs') {
            return {
                to: getRecruiterMyJobsPath({
                    tab: getMyJobsTabForStatus(selectedJob?.status),
                    jobId: jobIdParam || undefined,
                }),
                label: 'Quay lại Tin của tôi',
                state: undefined,
            };
        }
        return null;
    }, [fromParam, jobIdParam, location.state, selectedJob?.status]);

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

        (async () => {
            if (!jobIdParam) {
                if (!cancelled) {
                    setFocusJob(null);
                    setFocusJobLoading(false);
                    setFocusJobError(false);
                }
                return;
            }

            const inOpenList = openJobs.some((job) => String(job.id) === jobIdParam);
            if (inOpenList) {
                if (!cancelled) {
                    setFocusJob(null);
                    setFocusJobLoading(false);
                    setFocusJobError(false);
                }
                return;
            }

            if (jobsLoading) {
                return;
            }

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
            updateParams({ jobId: selectedJobId });
        }
    }, [jobIdParam, jobsLoading, selectedJobId, updateParams]);

    const loadApplications = useCallback(async () => {
        if (selectedJobId == null || focusJobLoading || jobsLoading) {
            return;
        }
        // URL trỏ tin không resolve được — không gọi list / không fallback tin khác.
        if (jobIdParam && !selectedJob) {
            setMatchData(EMPTY_MATCH_DATA);
            return;
        }

        setListLoading(true);
        setListError('');
        setActiveMatchTab(DEFAULT_MATCH_BUCKET_KEY);
        setPendingPageByTab({});
        setStatusListPage(0);
        try {
            const data = await recruiterApplicationService.getApplications(selectedJobId, {
                status: statusFilter,
            });
            setMatchData(data);
        } catch (err) {
            setListError(
                getRecruiterApplicationApiErrorMessage(err, 'Không tải được danh sách ứng viên.')
            );
            setMatchData(EMPTY_MATCH_DATA);
        } finally {
            setListLoading(false);
        }
    }, [
        selectedJobId,
        selectedJob,
        statusFilter,
        focusJobLoading,
        jobsLoading,
        jobIdParam,
    ]);

    useEffect(() => {
        let isMounted = true;
        (async () => {
            if (isMounted) {
                await loadApplications();
            }
        })();
        return () => {
            isMounted = false;
        };
    }, [loadApplications]);

    const applications = useMemo(() => flattenApplicationBuckets(matchData), [matchData]);

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

    const handleJobChange = (jobId) => {
        if (jobId == null || jobId === '') return;
        if (String(jobId) === String(selectedJobId)) return;
        updateParams({
            jobId,
            status: DEFAULT_STATUS_MANAGE,
        });
    };

    const handleStatusChange = (value) => {
        setStatusListPage(0);
        updateParams({ status: value === DEFAULT_STATUS_READONLY ? 'ALL' : value });
    };

    const goToPendingPage = (nextPage) => {
        setPendingPageByTab((prev) => ({
            ...prev,
            [activeMatchTab]: nextPage,
        }));
    };

    const goToStatusListPage = (nextPage) => {
        setStatusListPage(nextPage);
    };

    const renderApplicationCard = (application) => (
        <ApplicationCard
            key={application.id}
            application={application}
            actionLoading={actionLoadingId === application.id}
            chatLoading={chatLoadingId === application.id}
            reviewLoading={reviewBusy && reviewTarget?.id === application.id}
            hasReviewed={reviewedIds.has(String(application.id))}
            readOnly={readOnly}
            onAccept={setAcceptTarget}
            onReject={setRejectTarget}
            onViewProfile={handleViewProfile}
            onChat={handleChat}
            onReview={handleOpenReview}
            onViewRejectReason={setViewRejectReasonTarget}
        />
    );

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
        if (fromParam === 'overview' || fromParam === 'my-jobs' || fromParam === 'analytics') {
            returnParams.set('from', fromParam);
        }
        const backQuery = returnParams.toString() ? `?${returnParams.toString()}` : '';
        navigate(getCandidatePublicProfilePath(candidateId), {
            state: {
                candidateUserId: application?.candidateUserId ?? null,
                applicationCvLink: application?.cvLink ?? null,
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
    const showManageDropdown =
        hasSelectedJob && selectedJob?.status === 'OPEN' && hasOpenJobs;

    const activeMatchBucket = useMemo(
        () => MATCH_BUCKETS.find((bucket) => bucket.key === activeMatchTab) ?? MATCH_BUCKETS[0],
        [activeMatchTab]
    );

    const pendingItems = useMemo(
        () => matchData[activeMatchBucket.key] || [],
        [matchData, activeMatchBucket.key]
    );
    const pendingPage = pendingPageByTab[activeMatchTab] ?? 0;
    const pendingPagination = useMemo(
        () => paginateItems(pendingItems, pendingPage, RECRUITMENT_CARD_GRID_PAGE_SIZE),
        [pendingItems, pendingPage]
    );

    const statusListItems = useMemo(
        () => matchData.applications || [],
        [matchData.applications]
    );
    const statusListPagination = useMemo(
        () => paginateItems(statusListItems, statusListPage, RECRUITMENT_CARD_GRID_PAGE_SIZE),
        [statusListItems, statusListPage]
    );

    const renderClientPagination = (currentPage, totalPages, onGoToPage, ariaLabel) => {
        if (totalPages <= 1) return null;
        const pageNavItems = buildRecruitmentPageItems(currentPage, totalPages);
        return (
            <nav className="applicants-page__pagination" aria-label={ariaLabel}>
                <button
                    type="button"
                    className="applicants-page__page-btn applicants-page__page-btn--nav"
                    disabled={currentPage <= 0}
                    onClick={() => onGoToPage(currentPage - 1)}
                    aria-label="Trang trước"
                >
                    ‹
                </button>
                {pageNavItems.map((item, index) =>
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
                                item === currentPage ? ' is-active' : ''
                            }`}
                            aria-current={item === currentPage ? 'page' : undefined}
                            aria-label={`Trang ${item + 1}`}
                            onClick={() => onGoToPage(item)}
                        >
                            {item + 1}
                        </button>
                    )
                )}
                <button
                    type="button"
                    className="applicants-page__page-btn applicants-page__page-btn--nav"
                    disabled={currentPage + 1 >= totalPages}
                    onClick={() => onGoToPage(currentPage + 1)}
                    aria-label="Trang sau"
                >
                    ›
                </button>
            </nav>
        );
    };

    return (
        <div className="applicants-page">
            {showBackLink && backNav && (
                <Link
                    to={backNav.to}
                    state={backNav.state}
                    className="recruiter-back-overview"
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
                                    <JobPickerCombobox
                                        id="applicants-job-select"
                                        jobs={openJobs}
                                        value={selectedJobId ?? ''}
                                        onChange={handleJobChange}
                                    />
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
                                            {item.label} ({matchData.statusCounts?.[item.value] ?? 0})
                                        </button>
                                    ))}
                                </div>
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

                    {!listLoading && !listError && (
                        <>
                            {matchData.statusCounts?.PENDING === 0 &&
                                selectedJob?.status === 'OPEN' &&
                                statusFilter === 'PENDING' && (
                                    <p className="applicants-page__suggest-hint">
                                        Chưa có ứng viên chờ duyệt.{' '}
                                        <Link
                                            to={
                                                selectedJobId != null
                                                    ? getRecruiterJobSuggestionsPath(selectedJobId, {
                                                          from: 'applicants',
                                                      })
                                                    : ROUTES.RECRUITER_MY_JOBS
                                            }
                                        >
                                            Xem JobLink gợi ý
                                        </Link>
                                    </p>
                                )}

                            {statusFilter === 'PENDING' ? (
                                <>
                                    <div
                                        className="applicants-page__match-tabs"
                                        role="tablist"
                                        aria-label="Mức độ phù hợp"
                                    >
                                        {MATCH_BUCKETS.map((bucket) => {
                                            const count =
                                                matchData[`${bucket.key}Count`] ??
                                                (matchData[bucket.key] || []).length;
                                            return (
                                                <button
                                                    key={bucket.key}
                                                    type="button"
                                                    role="tab"
                                                    aria-selected={activeMatchTab === bucket.key}
                                                    className={`applicants-page__match-tab applicants-page__match-tab--${bucket.key}${
                                                        activeMatchTab === bucket.key
                                                            ? ' is-active'
                                                            : ''
                                                    }`}
                                                    onClick={() => setActiveMatchTab(bucket.key)}
                                                >
                                                    <span className="applicants-page__match-tab-label">
                                                        <span className="applicants-page__match-tab-title">
                                                            {bucket.title}
                                                        </span>
                                                        {bucket.hint ? (
                                                            <span className="applicants-page__match-tab-hint">
                                                                {bucket.hint}
                                                            </span>
                                                        ) : null}
                                                    </span>
                                                    <span className="applicants-page__match-tab-count">
                                                        {count}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <section
                                        className={`applicants-page__match-panel applicants-page__match-panel--${activeMatchBucket.key}`}
                                        role="tabpanel"
                                        aria-label={activeMatchBucket.title}
                                    >
                                        {pendingItems.length === 0 ? (
                                            <p className="applicants-page__match-empty">
                                                {activeMatchBucket.empty}
                                            </p>
                                        ) : (
                                            <>
                                                <div className="applicants-page__grid">
                                                    {pendingPagination.pageItems.map(
                                                        renderApplicationCard
                                                    )}
                                                </div>
                                                {renderClientPagination(
                                                    pendingPagination.currentPage,
                                                    pendingPagination.totalPages,
                                                    goToPendingPage,
                                                    'Phân trang ứng viên chờ duyệt'
                                                )}
                                            </>
                                        )}
                                    </section>
                                </>
                            ) : statusListItems.length === 0 ? (
                                <div className="applicants-page__empty">
                                    <p>Không có ứng viên ở trạng thái này.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="applicants-page__grid">
                                        {statusListPagination.pageItems.map(renderApplicationCard)}
                                    </div>
                                    {renderClientPagination(
                                        statusListPagination.currentPage,
                                        statusListPagination.totalPages,
                                        goToStatusListPage,
                                        'Phân trang ứng viên'
                                    )}
                                </>
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

            <ApplicationRejectDetailModal
                open={Boolean(viewRejectReasonTarget)}
                application={viewRejectReasonTarget}
                jobTitle={selectedJob?.title}
                onClose={() => setViewRejectReasonTarget(null)}
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
