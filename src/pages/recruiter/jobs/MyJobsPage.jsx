import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    ROUTES,
    getRecruiterApplicantsPath,
    getRecruiterEditJobPath,
    getRecruiterInvitationsPath,
    getRecruiterJobSuggestionsPath,
} from '../../../routes/path.js';
import recruiterJobApi, { getRecruiterJobApiErrorMessage } from '../../../apis/RecruiterJobApi.jsx';
import { formatSalaryRange } from '../../../utils/formatters.js';
import {
    getClosedJobSubBadge,
    getDeadlineCountdownLabel,
    isDeadlineUrgent,
    isPastApplicationDeadline,
} from '../../../utils/jobDeadlineDisplay.js';
import RecruiterBackLink from '../../../components/recruiter/RecruiterBackLink.jsx';
import ConfirmModal from '../../../components/common/ConfirmModal.jsx';
import RecruitmentPagination from '../../../components/recruiter/RecruitmentPagination.jsx';
import RecruiterJobDetailModal from '../../../components/recruiter/jobs/RecruiterJobDetailModal.jsx';
import JobStatusBadge from '../../../components/recruiter/jobs/JobStatusBadge.jsx';
import { RECRUITMENT_PAGE_SIZE } from '../../../utils/recruitmentPagination.js';
import { SearchIcon } from '../../../components/common/icons.jsx';
import { RECRUITER_BACK_LABELS } from '../../../utils/recruiterBackNav.js';
import '../../../assets/styles/JobPostStyle.css';
import '../../../assets/styles/MyJobsStyle.css';

/** Spring Pageable: property,direction — tin mới nhất trước. */
const MY_JOBS_SORT = 'createdAt,desc';

const STATUS_TABS = [
    { id: 'all', label: 'Tất cả', dotClass: '' },
    { id: 'draft', label: 'Bản nháp', dotClass: 'my-jobs-page__tab-dot--draft' },
    { id: 'open', label: 'Đang tuyển', dotClass: 'my-jobs-page__tab-dot--open' },
    { id: 'pending', label: 'Chờ duyệt', dotClass: 'my-jobs-page__tab-dot--pending' },
    { id: 'revision', label: 'Yêu cầu chỉnh sửa', dotClass: 'my-jobs-page__tab-dot--revision' },
    { id: 'rejected', label: 'Từ chối', dotClass: 'my-jobs-page__tab-dot--rejected' },
    { id: 'blocked', label: 'Bị khóa', dotClass: 'my-jobs-page__tab-dot--blocked' },
    { id: 'closed', label: 'Đã đóng', dotClass: 'my-jobs-page__tab-dot--closed' },
];

const VALID_STATUS_TABS = new Set(STATUS_TABS.map((tab) => tab.id));

/** Tab → JobStatus BE (null = không lọc). */
const TAB_API_STATUS = {
    all: null,
    draft: 'DRAFT',
    open: 'OPEN',
    pending: 'PENDING_REVIEW',
    revision: 'REVISION_REQUESTED',
    rejected: 'REJECTED',
    blocked: 'BLOCKED',
    closed: 'CLOSED',
};

const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('vi-VN');
};

const fetchMyJobsPage = async (tabId, pageNum, size = RECRUITMENT_PAGE_SIZE, keyword = '') => {
    const status = TAB_API_STATUS[tabId];
    const params = { page: pageNum, size, sort: MY_JOBS_SORT };
    if (status) params.status = status;
    if (keyword) params.keyword = keyword;
    return recruiterJobApi.getMyJobs(params);
};

const tabCountsFromApi = (counts = {}) => ({
    all: Number(counts.ALL) || 0,
    draft: Number(counts.DRAFT) || 0,
    open: Number(counts.OPEN) || 0,
    pending: Number(counts.PENDING_REVIEW) || 0,
    revision: Number(counts.REVISION_REQUESTED) || 0,
    rejected: Number(counts.REJECTED) || 0,
    blocked: Number(counts.BLOCKED) || 0,
    closed: Number(counts.CLOSED) || 0,
});

const getJobMetrics = (job) => {
    const requiredCandidates = Number(job.requiredCandidates);
    const required =
        Number.isFinite(requiredCandidates) && requiredCandidates > 0
            ? requiredCandidates
            : 1;

    // My Jobs summary: BE trả remainingPositions (không có hiredCount).
    // hired = filledPositions | hiredCount | required - remainingPositions
    const directHired = Number(job.hiredCount ?? job.filledPositions);
    let hiredCount = 0;
    if (Number.isFinite(directHired) && directHired >= 0) {
        hiredCount = directHired;
    } else if (job.remainingPositions != null && job.remainingPositions !== '') {
        const remaining = Number(job.remainingPositions);
        if (Number.isFinite(remaining)) {
            hiredCount = Math.max(0, required - remaining);
        }
    }

    return {
        viewCount: Math.max(0, Number(job.viewCount) || 0),
        pendingApplicationCount: Math.max(0, Number(job.pendingApplicationCount) || 0),
        hiredCount,
        requiredCandidates: required,
    };
};

const getProgressPercent = (hired, required) =>
    required > 0 ? Math.min(100, Math.round((hired / required) * 100)) : 0;

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

const canEdit = (status) => status === 'DRAFT' || status === 'REVISION_REQUESTED';

/** Card có metrics (lượt xem / ứng viên / đã tuyển) — OPEN đang tuyển + CLOSED/BLOCKED xem lại. */
const hasRecruitingMetricsCard = (job) =>
    job.status === 'OPEN' || job.status === 'CLOSED' || job.status === 'BLOCKED';

/** CLOSED còn hạn và còn chỗ tuyển — ẩn khi đã đủ HIRED (mở lại cũng không có ý nghĩa). */
const canReopenJob = (job) => {
    if (job.status !== 'CLOSED' || isPastApplicationDeadline(job.applicationDeadline)) {
        return false;
    }
    const { hiredCount, requiredCandidates } = getJobMetrics(job);
    return hiredCount < requiredCandidates;
};

const hasRevisionNote = (job) =>
    job?.status === 'REVISION_REQUESTED' && Boolean(String(job.reviewNote || '').trim());

const MyJobsPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [jobs, setJobs] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [tabCounts, setTabCounts] = useState(() =>
        Object.fromEntries(STATUS_TABS.map((tab) => [tab.id, 0]))
    );
    const [activeTab, setActiveTab] = useState(() => {
        const fromState = location.state?.highlightStatusTab;
        if (fromState && VALID_STATUS_TABS.has(fromState)) return fromState;
        const fromUrl = new URLSearchParams(location.search).get('tab');
        if (fromUrl && VALID_STATUS_TABS.has(fromUrl)) return fromUrl;
        return 'all';
    });
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState(null);
    const [reviewNoteJob, setReviewNoteJob] = useState(null);
    const [detailJobId, setDetailJobId] = useState(null);
    const [highlightJobId, setHighlightJobId] = useState(null);
    const [keywordInput, setKeywordInput] = useState('');
    const [keyword, setKeyword] = useState('');
    const loadSeqRef = useRef(0);

    /** true khi vào từ Tổng quan (?from=overview) — giữ trên URL để hiện nút quay lại. */
    const showBackToOverview = searchParams.get('from') === 'overview';

    useEffect(() => {
        const timer = setTimeout(() => setKeyword(keywordInput.trim()), 400);
        return () => clearTimeout(timer);
    }, [keywordInput]);

    const loadJobs = useCallback(async (tabId, pageNum) => {
        const seq = ++loadSeqRef.current;
        setLoading(true);
        try {
            const pageData = await fetchMyJobsPage(tabId, pageNum, RECRUITMENT_PAGE_SIZE, keyword);
            if (seq !== loadSeqRef.current) return;
            const content = Array.isArray(pageData?.content) ? pageData.content : [];
            setJobs(content);
            setTotalPages(Number(pageData?.totalPages) || 0);
            const pageNumber = pageData?.number ?? pageData?.currentPage;
            setPage(Number.isFinite(Number(pageNumber)) ? Number(pageNumber) : pageNum);
            const counts = pageData?.statusCounts || pageData?.counts;
            if (counts) setTabCounts(tabCountsFromApi(counts));
        } catch (err) {
            if (seq !== loadSeqRef.current) return;
            setJobs([]);
            setTotalPages(0);
            setPage(0);
            toast.error(getRecruiterJobApiErrorMessage(err, 'Không thể tải danh sách tin.'));
        } finally {
            if (seq === loadSeqRef.current) setLoading(false);
        }
    }, [keyword]);

    useEffect(() => {
        loadJobs(activeTab, 0);
    }, [activeTab, keyword, loadJobs]);

    useEffect(() => {
        const tab = location.state?.highlightStatusTab;
        if (tab && VALID_STATUS_TABS.has(tab)) {
            setActiveTab(tab);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, location.pathname, navigate]);

    /** Deep-link từ Tổng quan: ?tab=open&jobId=&from=overview → list card, không mở modal.
     *  Chỉ gỡ tab/jobId sau khi áp dụng; GIỮ from=overview để còn hiện nút Quay lại. */
    useEffect(() => {
        const tab = searchParams.get('tab');
        const rawJobId = searchParams.get('jobId');
        if (!tab && !rawJobId) return;

        if (tab && VALID_STATUS_TABS.has(tab)) {
            setActiveTab(tab);
        } else if (rawJobId) {
            setActiveTab('all');
        }

        if (rawJobId) {
            const parsed = Number(rawJobId);
            if (Number.isFinite(parsed)) setHighlightJobId(parsed);
        }

        const next = new URLSearchParams(searchParams);
        next.delete('tab');
        next.delete('jobId');
        // không xóa `from`
        setSearchParams(next, { replace: true });
    }, [searchParams, setSearchParams]);

    const handlePageChange = (nextPage) => {
        if (loading) return;
        if (nextPage < 0 || (totalPages > 0 && nextPage >= totalPages) || nextPage === page) {
            return;
        }
        loadJobs(activeTab, nextPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    /** Deep-link (?jobId=): giữ thứ tự list, scroll + highlight card. */
    useEffect(() => {
        if (highlightJobId == null || loading) return undefined;

        const el = document.getElementById(`my-job-card-${highlightJobId}`);
        if (el) {
            // Prefer keeping the card near the top of the viewport.
            const top = el.getBoundingClientRect().top + window.scrollY - 96;
            window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        const timer = window.setTimeout(() => setHighlightJobId(null), 4500);
        return () => window.clearTimeout(timer);
    }, [highlightJobId, loading, jobs]);

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
            } else {
                await recruiterJobApi.changeJobStatus(job.id, nextStatus);
                toast.success(
                    type === 'close' ? 'Đã đóng tin tuyển dụng.' : 'Đã mở lại tin tuyển dụng.'
                );
            }
            setConfirmDialog(null);
            // Reload tab — tin có thể rời khỏi tab hiện tại sau đổi status.
            await loadJobs(activeTab, 0);
        } catch (err) {
            const fallback =
                type === 'delete' ? 'Không thể xóa tin.' : 'Không thể đổi trạng thái tin.';
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

    const renderJobActions = (job) => {
        const isActionLoading = Boolean(actionLoadingId);
        return (
            <>
                <button
                    type="button"
                    className="my-jobs-page__action my-jobs-page__action--edit"
                    onClick={() => setDetailJobId(job.id)}
                >
                    Xem chi tiết
                </button>
                {(job.status === 'OPEN' ||
                    job.status === 'CLOSED' ||
                    job.status === 'BLOCKED') && (
                    <>
                        <Link
                            to={getRecruiterApplicantsPath(job.id, { from: 'my-jobs' })}
                            className="my-jobs-page__action my-jobs-page__action--primary"
                        >
                            Xem ứng viên
                        </Link>
                        <Link
                            to={getRecruiterInvitationsPath(job.id, { from: 'my-jobs' })}
                            className="my-jobs-page__action my-jobs-page__action--edit"
                        >
                            Xem lời mời
                        </Link>
                    </>
                )}
                {job.status === 'OPEN' && (
                    <Link
                        to={getRecruiterJobSuggestionsPath(job.id, { from: 'my-jobs' })}
                        className="my-jobs-page__action my-jobs-page__action--edit"
                    >
                        Gợi ý ứng viên phù hợp
                    </Link>
                )}
                {hasRevisionNote(job) && (
                    <button
                        type="button"
                        className="my-jobs-page__action my-jobs-page__action--note"
                        onClick={() => setReviewNoteJob(job)}
                    >
                        Xem yêu cầu chỉnh sửa
                    </button>
                )}
                {canEdit(job.status) && (
                    <Link
                        to={getRecruiterEditJobPath(job.id)}
                        className="my-jobs-page__action my-jobs-page__action--edit"
                    >
                        {job.status === 'REVISION_REQUESTED' ? 'Chỉnh sửa & Gửi lại' : 'Sửa'}
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
                {canReopenJob(job) && (
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
            </>
        );
    };

    const getCardClassName = (job, ...modifiers) => {
        const classes = ['my-jobs-page__card', ...modifiers.filter(Boolean)];
        if (highlightJobId != null && String(job.id) === String(highlightJobId)) {
            classes.push('my-jobs-page__card--highlight');
        }
        return classes.join(' ');
    };

    const renderCardFooter = (job) => (
        <div className="my-jobs-page__card-footer">{renderJobActions(job)}</div>
    );

    const renderMetricsCard = (job) => {
        const metrics = getJobMetrics(job);
        const progress = getProgressPercent(metrics.hiredCount, metrics.requiredCandidates);
        const countdownLabel =
            job.status === 'OPEN' ? getDeadlineCountdownLabel(job.applicationDeadline) : null;
        const closedSubBadge =
            job.status === 'CLOSED' ? getClosedJobSubBadge(job, metrics) : null;
        const businessName = job.business?.name;
        const locationLabel = job.location?.name || job.location?.city;
        const statusModifier =
            job.status === 'CLOSED'
                ? 'my-jobs-page__card--closed'
                : job.status === 'BLOCKED'
                  ? 'my-jobs-page__card--blocked'
                  : 'my-jobs-page__card--open';

        return (
            <article
                key={job.id}
                id={`my-job-card-${job.id}`}
                className={getCardClassName(job, statusModifier)}
            >
                <div className="my-jobs-page__card-body">
                    <div className="my-jobs-page__card-top">
                        <h2>{job.title}</h2>
                        <JobStatusBadge status={job.status} />
                        {job.urgent && (
                            <span className="my-jobs-page__badge--urgent">Tin tuyển gấp</span>
                        )}
                        {closedSubBadge && (
                            <span
                                className={`my-jobs-page__badge--close-reason my-jobs-page__badge--close-reason--${closedSubBadge.tone}`}
                            >
                                {closedSubBadge.label}
                            </span>
                        )}
                        {countdownLabel && (
                            <span
                                className={`my-jobs-page__deadline${
                                    isDeadlineUrgent(countdownLabel)
                                        ? ' my-jobs-page__deadline--urgent'
                                        : ''
                                }`}
                            >
                                {countdownLabel}
                            </span>
                        )}
                    </div>
                    <p className="my-jobs-page__salary">
                        {formatSalaryRange(job.salaryMin, job.salaryMax)}
                    </p>
                    <p className="my-jobs-page__meta">
                        {[businessName, locationLabel].filter(Boolean).join(' · ') ||
                            locationLabel ||
                            '—'}
                        {' · '}
                        Tạo {formatDate(job.createdAt)}
                    </p>
                    {job.status === 'BLOCKED' && String(job.reviewNote || '').trim() && (
                        <p className="my-jobs-page__notice my-jobs-page__notice--rejected">
                            Lý do khóa: {job.reviewNote}
                        </p>
                    )}
                    <div className="my-jobs-page__metrics">
                        <div className="my-jobs-page__metric">
                            <span className="my-jobs-page__metric-value">
                                {metrics.viewCount}
                            </span>
                            <span className="my-jobs-page__metric-label">Lượt xem</span>
                        </div>
                        <div className="my-jobs-page__metric">
                            <span className="my-jobs-page__metric-value">
                                {metrics.pendingApplicationCount}
                            </span>
                            <span className="my-jobs-page__metric-label">Ứng viên chờ duyệt</span>
                        </div>
                        <div className="my-jobs-page__metric">
                            <span className="my-jobs-page__metric-value">
                                {metrics.hiredCount}
                            </span>
                            <span className="my-jobs-page__metric-label">Đã tuyển</span>
                        </div>
                    </div>
                    <div className="my-jobs-page__progress">
                        <div className="my-jobs-page__progress-header">
                            <span>Tiến độ tuyển dụng</span>
                            <span>
                                {metrics.hiredCount}/{metrics.requiredCandidates} ứng viên đã
                                tuyển
                            </span>
                        </div>
                        <div className="my-jobs-page__progress-bar">
                            <div
                                className="my-jobs-page__progress-fill"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>
                {renderCardFooter(job)}
            </article>
        );
    };

    const renderDefaultCard = (job) => {
        const reviewNote = String(job.reviewNote || '').trim();
        let notice = null;
        if (job.status === 'PENDING_REVIEW') {
            notice = {
                className: 'my-jobs-page__notice--pending',
                text: 'Kiểm duyệt viên đang xem xét tin — dự kiến phản hồi trong 24 giờ.',
            };
        } else if (job.status === 'REJECTED' && reviewNote) {
            notice = {
                className: 'my-jobs-page__notice--rejected',
                text: reviewNote,
            };
        }

        return (
            <article
                key={job.id}
                id={`my-job-card-${job.id}`}
                className={getCardClassName(job)}
            >
                <div className="my-jobs-page__card-body">
                    <div className="my-jobs-page__card-top">
                        <h2>{job.title}</h2>
                        <JobStatusBadge status={job.status} />
                    </div>
                    <p className="my-jobs-page__salary">
                        {formatSalaryRange(job.salaryMin, job.salaryMax)}
                    </p>
                    <p className="my-jobs-page__meta">
                        {job.business?.name || job.location?.name || job.location?.city || '—'}{' '}
                        · Tạo {formatDate(job.createdAt)}
                    </p>
                    {notice && (
                        <p className={`my-jobs-page__notice ${notice.className}`}>
                            {notice.text}
                        </p>
                    )}
                </div>
                {renderCardFooter(job)}
            </article>
        );
    };

    const dialogConfig = confirmDialog ? CONFIRM_DIALOG[confirmDialog.type] : null;
    const isActionLoading = Boolean(actionLoadingId);

    return (
        <div className="my-jobs-page">
            {showBackToOverview ? (
                <RecruiterBackLink
                    to={ROUTES.RECRUITER_HOME}
                    label={RECRUITER_BACK_LABELS.overview}
                />
            ) : null}

            <header className="my-jobs-page__header">
                <div>
                    <h1>Tin tuyển dụng của tôi</h1>
                </div>
                <Link to={ROUTES.RECRUITER_CREATE_JOB} className="my-jobs-page__create-btn">
                    + Đăng tin mới
                </Link>
            </header>

            <div className="my-jobs-page__search-wrap">
                <SearchIcon width={18} height={18} aria-hidden="true" />
                <input
                    type="search"
                    className="my-jobs-page__search"
                    placeholder="Tìm theo tiêu đề tin tuyển dụng"
                    aria-label="Tìm theo tiêu đề tin tuyển dụng"
                    value={keywordInput}
                    onChange={(event) => setKeywordInput(event.target.value)}
                />
            </div>

            <div className="my-jobs-page__tabs" role="tablist" aria-label="Lọc theo trạng thái">
                {STATUS_TABS.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        className={`my-jobs-page__tab${activeTab === tab.id ? ' is-active' : ''}`}
                        onClick={() => {
                            if (tab.id !== activeTab) setActiveTab(tab.id);
                        }}
                    >
                        {tab.dotClass && (
                            <span className={`my-jobs-page__tab-dot ${tab.dotClass}`} />
                        )}
                        {tab.label} ({tabCounts[tab.id] ?? 0})
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="my-jobs-page__loading">Đang tải...</div>
            ) : jobs.length === 0 ? (
                <div className="my-jobs-page__empty">
                    <p>
                        {activeTab === 'all'
                            ? 'Chưa có tin tuyển dụng nào.'
                            : 'Không có tin nào trong mục này.'}
                    </p>
                    <Link to={ROUTES.RECRUITER_CREATE_JOB}>Đăng tin</Link>
                </div>
            ) : (
                <>
                    <div className="my-jobs-page__list">
                        {jobs.map((job) =>
                            hasRecruitingMetricsCard(job)
                                ? renderMetricsCard(job)
                                : renderDefaultCard(job)
                        )}
                    </div>
                    <RecruitmentPagination
                        page={page}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        loading={loading}
                        ariaLabel="Phân trang tin tuyển dụng"
                    />
                </>
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

            <RecruiterJobDetailModal
                key={detailJobId ?? 'closed'}
                open={detailJobId != null}
                jobId={detailJobId}
                onClose={() => setDetailJobId(null)}
            />

            <ConfirmModal
                open={Boolean(reviewNoteJob)}
                title="Yêu cầu chỉnh sửa"
                confirmLabel="Chỉnh sửa & Gửi lại"
                cancelLabel="Đóng"
                variant="primary"
                onConfirm={() => {
                    const jobId = reviewNoteJob?.id;
                    setReviewNoteJob(null);
                    if (jobId != null) navigate(getRecruiterEditJobPath(jobId));
                }}
                onCancel={() => setReviewNoteJob(null)}
            >
                {reviewNoteJob && (
                    <>
                        <p className="confirm-modal__hint">
                            Ghi chú từ Post Manager cho tin{' '}
                            <strong>{reviewNoteJob.title}</strong>:
                        </p>
                        <p className="my-jobs-page__review-note">{reviewNoteJob.reviewNote}</p>
                    </>
                )}
            </ConfirmModal>
        </div>
    );
};

export default MyJobsPage;
