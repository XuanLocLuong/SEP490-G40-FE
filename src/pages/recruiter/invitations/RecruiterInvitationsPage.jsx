import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import recruiterJobApi, { getRecruiterJobApiErrorMessage } from '../../../apis/RecruiterJobApi.jsx';
import InvitationCard from '../../../components/recruiter/invitations/InvitationCard.jsx';
import JobPickerCombobox from '../../../components/recruiter/applicants/JobPickerCombobox.jsx';
import JobStatusBadge from '../../../components/recruiter/jobs/JobStatusBadge.jsx';
import {
    getInvitations,
    getRecruiterInvitationApiErrorMessage,
    INVITATION_STATUS_FILTERS,
} from '../../../services/recruiterInvitationService.js';
import {
    getCandidatePublicProfilePath,
    getRecruiterJobAnalyticsPath,
    getRecruiterMyJobsPath,
    getMyJobsTabForStatus,
    ROUTES,
} from '../../../routes/path.js';
import { openChatPanel, RECRUITMENT_CHANGED_EVENT } from '../../../utils/chatEvents.js';
import '../../../assets/styles/ApplicantsPageStyle.css';
import '../../../assets/styles/RecruiterInvitationsStyle.css';

const PAGE_SIZE = 9;
const DEFAULT_STATUS = 'SENT';

const canManageInvitations = (job) => job?.status === 'OPEN';

const RecruiterInvitationsPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();

    const jobIdParam = searchParams.get('jobId');
    const statusFilter = searchParams.get('status') || DEFAULT_STATUS;
    const page = Math.max(0, Number(searchParams.get('page') || 0) || 0);
    const fromParam = searchParams.get('from');
    /** Back khi vào từ Tổng quan / My Jobs / thống kê chi tiết tin. */
    const showBackLink =
        fromParam === 'overview' || fromParam === 'my-jobs' || fromParam === 'analytics';

    const [openJobs, setOpenJobs] = useState([]);
    const [jobsLoading, setJobsLoading] = useState(true);
    const [focusJob, setFocusJob] = useState(null);
    const [focusJobLoading, setFocusJobLoading] = useState(false);
    const [focusJobError, setFocusJobError] = useState(false);

    const [invitations, setInvitations] = useState([]);
    const [listLoading, setListLoading] = useState(false);
    const [listError, setListError] = useState('');
    const [chatLoadingId, setChatLoadingId] = useState(null);
    const [totalPages, setTotalPages] = useState(0);
    const [statusCounts, setStatusCounts] = useState({});

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

    const readOnly = Boolean(selectedJob) && !canManageInvitations(selectedJob);

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

        if (jobsLoading) return undefined;

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

    // Vào trang không có ?jobId= → chọn tin đầu và ghi URL.
    useEffect(() => {
        if (jobIdParam || jobsLoading) return;
        if (selectedJobId != null) {
            updateParams({ jobId: selectedJobId, page: 0 });
        }
    }, [jobIdParam, jobsLoading, selectedJobId, updateParams]);

    const loadInvitations = useCallback(async () => {
        if (selectedJobId == null || focusJobLoading || jobsLoading) {
            return;
        }
        if (jobIdParam && !selectedJob) {
            setInvitations([]);
            setTotalPages(0);
            return;
        }

        setListLoading(true);
        setListError('');
        try {
            const pageData = await getInvitations(selectedJobId, {
                status: statusFilter,
                page,
                size: PAGE_SIZE,
            });
            setInvitations(pageData.content.filter((item) => item.status !== 'CANCELLED'));
            setTotalPages(pageData.totalPages);
            setStatusCounts(pageData.statusCounts || {});
        } catch (err) {
            setListError(
                getRecruiterInvitationApiErrorMessage(err, 'Không tải được danh sách lời mời.')
            );
            setInvitations([]);
            setTotalPages(0);
            setStatusCounts({});
        } finally {
            setListLoading(false);
        }
    }, [
        selectedJobId,
        selectedJob,
        statusFilter,
        page,
        focusJobLoading,
        jobsLoading,
        jobIdParam,
    ]);

    useEffect(() => {
        loadInvitations();
    }, [loadInvitations]);

    // Refresh when invite / accept-reject invite happens via chat float.
    useEffect(() => {
        const onRecruitmentChanged = (event) => {
            const detail = event?.detail || {};
            if (detail.kind && detail.kind !== 'invitation') return;
            if (
                detail.jobId != null &&
                selectedJobId != null &&
                String(detail.jobId) !== String(selectedJobId)
            ) {
                return;
            }
            void loadInvitations();
        };

        window.addEventListener(RECRUITMENT_CHANGED_EVENT, onRecruitmentChanged);
        return () =>
            window.removeEventListener(RECRUITMENT_CHANGED_EVENT, onRecruitmentChanged);
    }, [loadInvitations, selectedJobId]);

    const handleJobChange = (jobId) => {
        if (jobId == null || jobId === '') return;
        if (String(jobId) === String(selectedJobId)) return;
        updateParams({
            jobId,
            page: 0,
            status: statusFilter === DEFAULT_STATUS ? null : statusFilter,
        });
    };

    const handleStatusChange = (value) => {
        updateParams({
            status: value === DEFAULT_STATUS ? null : value,
            page: 0,
        });
    };

    const handleViewProfile = (invitation) => {
        const candidateId = invitation?.candidateId;
        if (!candidateId) {
            toast.error('Không tìm thấy hồ sơ ứng viên.');
            return;
        }
        const returnParams = new URLSearchParams();
        if (selectedJobId != null) returnParams.set('jobId', String(selectedJobId));
        if (statusFilter && statusFilter !== DEFAULT_STATUS) {
            returnParams.set('status', statusFilter);
        }
        if (fromParam === 'my-jobs' || fromParam === 'analytics') {
            returnParams.set('from', fromParam);
        }
        const backQuery = returnParams.toString() ? `?${returnParams.toString()}` : '';
        navigate(getCandidatePublicProfilePath(candidateId), {
            state: {
                candidateUserId: invitation?.candidateUserId ?? null,
                backTo: {
                    path: `${ROUTES.RECRUITER_INVITATIONS}${backQuery}`,
                    label: 'Quay lại danh sách lời mời',
                },
            },
        });
    };

    const handleChat = (invitation) => {
        if (invitation?.candidateUserId == null) {
            toast.error('Không mở được chat: thiếu ID ứng viên từ API.');
            return;
        }
        if (selectedJobId == null) {
            toast.error('Chưa chọn tin tuyển dụng.');
            return;
        }
        setChatLoadingId(invitation.id);
        try {
            openChatPanel({
                jobId: selectedJobId,
                otherUserId: invitation.candidateUserId,
            });
        } finally {
            window.setTimeout(() => setChatLoadingId(null), 800);
        }
    };

    const pageLoading = jobsLoading || focusJobLoading;
    const hasOpenJobs = openJobs.length > 0;
    const hasSelectedJob = Boolean(selectedJob);
    const jobNotFound =
        Boolean(jobIdParam) &&
        !pageLoading &&
        !hasSelectedJob &&
        (focusJobError || !focusJobLoading);
    const emptyNoJobs = !pageLoading && !jobIdParam && !hasOpenJobs;
    const hasMorePages = page + 1 < totalPages;
    const showJobSelect = hasSelectedJob && !readOnly && hasOpenJobs;

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
                    className="recruiter-back-overview"
                >
                    ← {backNav.label}
                </Link>
            )}

            <h1 className="applicants-page__title">Lời mời đã gửi</h1>
            <p className="applicants-page__subtitle">
                Chọn tin tuyển dụng để xem và theo dõi lời mời đã gửi.
            </p>

            {pageLoading && (
                <div className="applicants-page__loading">Đang tải danh sách tin tuyển dụng…</div>
            )}

            {!pageLoading && emptyNoJobs && (
                <div className="applicants-page__empty">
                    <p>Chưa có tin tuyển dụng đang mở để xem lời mời.</p>
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
                            {showJobSelect ? (
                                <div className="applicants-page__job-field">
                                    <label htmlFor="invitations-job-select">
                                        Xem lời mời cho
                                    </label>
                                    <JobPickerCombobox
                                        id="invitations-job-select"
                                        jobs={openJobs}
                                        value={selectedJobId ?? ''}
                                        onChange={handleJobChange}
                                        placeholder="Tìm tin đang tuyển…"
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

                        <div className="applicants-page__filters-row">
                            <div className="applicants-page__filters">
                                <label>Trạng thái</label>
                                <div className="applicants-page__chips">
                                    {INVITATION_STATUS_FILTERS.map((item) => (
                                        <button
                                            key={item.value}
                                            type="button"
                                            className={`applicants-page__chip${statusFilter === item.value
                                                    ? ' applicants-page__chip--active'
                                                    : ''
                                                }`}
                                            onClick={() => handleStatusChange(item.value)}
                                        >
                                            {item.label} ({statusCounts[item.value] ?? 0})
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {listLoading && (
                        <div className="applicants-page__loading">
                            Đang tải danh sách lời mời…
                        </div>
                    )}

                    {!listLoading && listError && (
                        <div className="applicants-page__error">
                            <p>{listError}</p>
                            <button
                                type="button"
                                className="btn btn--secondary"
                                onClick={loadInvitations}
                            >
                                Thử lại
                            </button>
                        </div>
                    )}

                    {!listLoading && !listError && invitations.length === 0 && (
                        <div className="applicants-page__empty">
                            <p>
                                {statusFilter === 'ALL'
                                    ? 'Chưa có lời mời nào cho tin này.'
                                    : 'Không có lời mời phù hợp bộ lọc hiện tại.'}
                            </p>
                        </div>
                    )}

                    {!listLoading && !listError && invitations.length > 0 && (
                        <>
                            <div className="applicants-page__grid">
                                {invitations.map((invitation) => (
                                    <InvitationCard
                                        key={invitation.id}
                                        invitation={invitation}
                                        onViewProfile={handleViewProfile}
                                        onChat={handleChat}
                                        chatLoading={chatLoadingId === invitation.id}
                                    />
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <nav
                                    className="applicants-page__pagination"
                                    aria-label="Phân trang lời mời"
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
                                                className={`applicants-page__page-btn${item === page ? ' is-active' : ''
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
        </div>
    );
};

export default RecruiterInvitationsPage;
