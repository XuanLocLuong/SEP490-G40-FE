import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    ROUTES,
    getRecruiterApplicantsPath,
    getRecruiterEditJobPath,
} from '../../../routes/path.js';
import recruiterJobApi, { getRecruiterJobApiErrorMessage } from '../../../apis/RecruiterJobApi.jsx';
import { formatSalaryRange } from '../../../services/jobPostService.js';
import ConfirmModal from '../../../components/common/ConfirmModal.jsx';
import JobStatusBadge from '../../../components/recruiter/jobs/JobStatusBadge.jsx';
import '../../../assets/styles/JobPostStyle.css';
import '../../../assets/styles/MyJobsStyle.css';

const MOCK_METRICS = {
    viewCount: 245,
    applicationCount: 12,
    hiredCount: 3,
    requiredCandidates: 5,
};

const STATUS_TABS = [
    { id: 'all', label: 'Tất cả', dotClass: '' },
    { id: 'draft', label: 'Bản nháp', dotClass: 'my-jobs-page__tab-dot--draft' },
    { id: 'open', label: 'Đang tuyển', dotClass: 'my-jobs-page__tab-dot--open' },
    { id: 'pending', label: 'Chờ duyệt', dotClass: 'my-jobs-page__tab-dot--pending' },
    { id: 'rejected', label: 'Từ chối', dotClass: 'my-jobs-page__tab-dot--rejected' },
    { id: 'closed', label: 'Đã đóng', dotClass: 'my-jobs-page__tab-dot--closed' },
];

const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('vi-VN');
};

/** Chỉ dùng cho nút Mở lại tin — BE chưa validate deadline khi CLOSED → OPEN. */
const isPastDeadline = (job) => {
    if (!job.applicationDeadline) return false;
    const end = new Date(job.applicationDeadline);
    return !Number.isNaN(end.getTime()) && end.getTime() < Date.now();
};

const matchesTab = (job, tabId) => {
    switch (tabId) {
        case 'draft':
            return job.status === 'DRAFT';
        case 'open':
            return job.status === 'OPEN';
        case 'pending':
            return job.status === 'PENDING_REVIEW';
        case 'rejected':
            return job.status === 'REJECTED' || job.status === 'REVISION_REQUESTED';
        case 'closed':
            return job.status === 'CLOSED';
        default:
            return true;
    }
};

const getJobMetrics = (job) => {
    const beReady = job.hiredCount != null || job.requiredCandidates != null;
    if (job.status === 'OPEN' && !beReady) {
        return { ...MOCK_METRICS };
    }
    return {
        viewCount: Number(job.viewCount) || 0,
        applicationCount: Number(job.applicationCount) || 0,
        hiredCount: Number(job.hiredCount) || 0,
        requiredCandidates: Number(job.requiredCandidates) || 1,
    };
};

const getProgressPercent = (hired, required) =>
    required > 0 ? Math.min(100, Math.round((hired / required) * 100)) : 0;

const getDaysLeftLabel = (deadline) => {
    if (!deadline) return null;
    const end = new Date(deadline);
    if (Number.isNaN(end.getTime())) return null;
    const diff = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Hết hạn';
    if (diff === 0) return 'Hết hạn hôm nay';
    return `Còn ${diff} ngày`;
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

const canEdit = (status) => status === 'DRAFT' || status === 'REVISION_REQUESTED';

const isOpenRecruitingCard = (job) => job.status === 'OPEN';

const canReopenJob = (job) => job.status === 'CLOSED' && !isPastDeadline(job);

const MyJobsPage = () => {
    const [allJobs, setAllJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState(null);

    const loadJobs = useCallback(async () => {
        setLoading(true);
        try {
            const page = await recruiterJobApi.getMyJobs({ page: 0, size: 100 });
            setAllJobs(page?.content || []);
        } catch (err) {
            toast.error(getRecruiterJobApiErrorMessage(err, 'Không thể tải danh sách tin.'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadJobs();
    }, [loadJobs]);

    const tabCounts = useMemo(() => {
        const counts = {};
        STATUS_TABS.forEach((tab) => {
            counts[tab.id] =
                tab.id === 'all'
                    ? allJobs.length
                    : allJobs.filter((job) => matchesTab(job, tab.id)).length;
        });
        return counts;
    }, [allJobs]);

    const filteredJobs = useMemo(
        () => allJobs.filter((job) => matchesTab(job, activeTab)),
        [allJobs, activeTab]
    );

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
                setAllJobs((prev) => prev.filter((j) => j.id !== job.id));
            } else {
                await recruiterJobApi.changeJobStatus(job.id, nextStatus);
                toast.success(
                    type === 'close' ? 'Đã đóng tin tuyển dụng.' : 'Đã mở lại tin tuyển dụng.'
                );
                setAllJobs((prev) =>
                    prev.map((j) => (j.id === job.id ? { ...j, status: nextStatus } : j))
                );
            }
            setConfirmDialog(null);
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
                {job.status === 'OPEN' && (
                    <Link
                        to={getRecruiterApplicantsPath(job.id)}
                        className="my-jobs-page__action my-jobs-page__action--primary"
                    >
                        Xem ứng viên
                    </Link>
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

    const renderCardFooter = (job) => (
        <div className="my-jobs-page__card-footer">{renderJobActions(job)}</div>
    );

    const renderOpenCard = (job) => {
        const metrics = getJobMetrics(job);
        const progress = getProgressPercent(metrics.hiredCount, metrics.requiredCandidates);
        const daysLeft = getDaysLeftLabel(job.applicationDeadline);
        const businessName = job.business?.name;
        const locationLabel = job.location?.name || job.location?.city;

        return (
            <article key={job.id} className="my-jobs-page__card my-jobs-page__card--open">
                <div className="my-jobs-page__card-body">
                    <div className="my-jobs-page__card-top">
                        <h2>{job.title}</h2>
                        <JobStatusBadge status={job.status} />
                        {job.urgent && (
                            <span className="my-jobs-page__badge--urgent">Tin tuyển gấp</span>
                        )}
                        {daysLeft && (
                            <span className="my-jobs-page__deadline">{daysLeft}</span>
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
                    <div className="my-jobs-page__metrics">
                        <div className="my-jobs-page__metric">
                            <span className="my-jobs-page__metric-value">
                                {metrics.viewCount}
                            </span>
                            <span className="my-jobs-page__metric-label">Lượt xem</span>
                        </div>
                        <div className="my-jobs-page__metric">
                            <span className="my-jobs-page__metric-value">
                                {metrics.applicationCount}
                            </span>
                            <span className="my-jobs-page__metric-label">Ứng viên</span>
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
        const noticeByStatus = {
            PENDING_REVIEW: {
                className: 'my-jobs-page__notice--pending',
                text: 'Post Manager đang xem xét tin — dự kiến phản hồi trong 24 giờ.',
            },
            REJECTED: {
                className: 'my-jobs-page__notice--rejected',
                text: 'Tin bị từ chối. Vui lòng chỉnh sửa nội dung và gửi lại.',
            },
            REVISION_REQUESTED: {
                className: 'my-jobs-page__notice--rejected',
                text: 'Post Manager yêu cầu chỉnh sửa nội dung trước khi duyệt.',
            },
        };
        const notice = noticeByStatus[job.status];

        return (
            <article key={job.id} className="my-jobs-page__card">
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
            <header className="my-jobs-page__header">
                <div>
                    <h1>Tin tuyển dụng của tôi</h1>
                </div>
                <Link to={ROUTES.RECRUITER_CREATE_JOB} className="my-jobs-page__create-btn">
                    + Đăng tin mới
                </Link>
            </header>

            <div className="my-jobs-page__tabs" role="tablist" aria-label="Lọc theo trạng thái">
                {STATUS_TABS.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        className={`my-jobs-page__tab${activeTab === tab.id ? ' is-active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
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
            ) : filteredJobs.length === 0 ? (
                <div className="my-jobs-page__empty">
                    <p>
                        {activeTab === 'all'
                            ? 'Chưa có tin tuyển dụng nào.'
                            : 'Không có tin nào trong mục này.'}
                    </p>
                    <Link to={ROUTES.RECRUITER_CREATE_JOB}>Đăng tin</Link>
                </div>
            ) : (
                <div className="my-jobs-page__list">
                    {filteredJobs.map((job) =>
                        isOpenRecruitingCard(job) ? renderOpenCard(job) : renderDefaultCard(job)
                    )}
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
