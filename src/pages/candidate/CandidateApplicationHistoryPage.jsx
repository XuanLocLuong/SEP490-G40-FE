import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
    getMyApplications,
    confirmOffer,
    declineOffer,
    cancelApplication,
} from '../../apis/ApplicationApi.jsx';
import JobDetailModal from '../../components/job/JobDetailModal.jsx';
import ConfirmModal from '../../components/common/ConfirmModal.jsx';
import ReviewSubmitModal from '../../components/review/ReviewSubmitModal.jsx';
import { CalendarIcon, ChatIcon, ClockIcon } from '../../components/common/icons.jsx';
import {
    getMyApplicationReview,
    getReviewApiErrorMessage,
    submitApplicationReview,
} from '../../apis/ReviewApi.jsx';
import { USER_ROLES } from '../../utils/Constants.jsx';
import { useAuth } from '../../contexts/authContext.js';
import { openChatPanel, RECRUITMENT_CHANGED_EVENT } from '../../utils/chatEvents.js';
import { formatJobShiftsLabel, getBusinessInitial } from '../../utils/formatters.js';
import BusinessProfileLink from '../../components/common/BusinessProfileLink.jsx';
import '../../assets/styles/CandidateApplicationHistoryPageStyle.css';

const PAGE_SIZE = 10;

/** Chỉ status BE nhận trên GET /applications/me (không gồm CANCELLED — BE typeMismatch 400). */
const STATUS_TABS = [
    { value: 'PENDING', label: 'Chờ phản hồi' },
    { value: 'REJECTED', label: 'Bị NTD từ chối' },
    { value: 'ACCEPTED', label: 'Chờ xác nhận nhận việc' },
    { value: 'HIRED', label: 'Đã nhận việc' },
];

/** Tạm ẩn nút Hủy đơn. Giữ action/API, bật lại khi cho phép hủy. */
const SHOW_CANCEL_APPLICATION_UI = false;

const EMPTY_COUNTS = {
    PENDING: 0,
    ACCEPTED: 0,
    REJECTED: 0,
    HIRED: 0,
};

const unwrapApplicationPage = (res) => {
    const pageData = res?.data?.data ?? res?.data;
    return {
        content: pageData?.content ?? [],
        totalElements: Number(pageData?.totalElements) || 0,
        totalPages: Number(pageData?.totalPages) || 0,
        currentPage: pageData?.currentPage ?? 0,
    };
};

const getStatusUi = (status) => {
    switch (status) {
        case 'PENDING':
            return { label: 'Chờ phản hồi', tone: 'pending' };
        case 'ACCEPTED':
            return { label: 'Chờ xác nhận nhận việc', tone: 'accepted' };
        case 'REJECTED':
            return { label: 'Bị NTD từ chối', tone: 'rejected' };
        case 'HIRED':
            return { label: 'Đã nhận việc', tone: 'hired' };
        case 'CANCELLED':
            return { label: 'Đã hủy', tone: 'cancelled' };
        case 'COMPLETED':
            return { label: 'Hoàn thành', tone: 'completed' };
        default:
            return { label: status || 'Khác', tone: 'unknown' };
    }
};

const formatAppliedAt = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

const BusinessLogo = ({ name, logoUrl }) => {
    const [imgFailed, setImgFailed] = useState(false);
    const showImage = Boolean(logoUrl) && !imgFailed;

    if (showImage) {
        return (
            <img
                src={logoUrl}
                alt=""
                className="cah-item__logo"
                onError={() => setImgFailed(true)}
            />
        );
    }

    return (
        <span className="cah-item__logo cah-item__logo--placeholder" aria-hidden="true">
            {getBusinessInitial(name)}
        </span>
    );
};

const CandidateApplicationHistoryPage = () => {
    const { auth } = useAuth();

    const activeRole = auth?.role;
    const isCandidate = activeRole === USER_ROLES.CANDIDATE;

    const [activeStatus, setActiveStatus] = useState(STATUS_TABS[0].value);
    const [applications, setApplications] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(false);
    const [listError, setListError] = useState('');

    const [counts, setCounts] = useState(EMPTY_COUNTS);

    const loadCounts = useCallback(async () => {
        const settled = await Promise.allSettled(
            STATUS_TABS.map(async (tab) => {
                const res = await getMyApplications({ page: 0, size: 1, status: tab.value });
                return { status: tab.value, totalElements: unwrapApplicationPage(res).totalElements };
            }),
        );

        const next = { ...EMPTY_COUNTS };
        settled.forEach((result) => {
            if (result.status === 'fulfilled') {
                next[result.value.status] = result.value.totalElements;
            }
        });
        setCounts(next);
    }, []);

    const loadPage = useCallback(async (pageNum, status) => {
        setLoading(true);
        setListError('');
        try {
            const res = await getMyApplications({
                page: pageNum,
                size: PAGE_SIZE,
                status,
            });
            const pageData = unwrapApplicationPage(res);
            setApplications(pageData.content);
            setTotalPages(pageData.totalPages);
            setTotalElements(pageData.totalElements);
            setPage(pageData.currentPage ?? pageNum);
            setCounts((prev) => ({ ...prev, [status]: pageData.totalElements }));
        } catch (err) {
            setListError(err?.message || 'Không thể tải lịch sử ứng tuyển.');
            setApplications([]);
            setTotalPages(0);
            setTotalElements(0);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isCandidate) return;
        loadCounts().catch(() => {
            // Không chặn trang nếu không tải được counts.
        });
    }, [isCandidate, loadCounts]);

    useEffect(() => {
        if (!isCandidate) return;
        loadPage(0, activeStatus);
    }, [activeStatus, isCandidate, loadPage]);

    // Refresh when application / invite-accept (→ HIRED) happens via chat float.
    useEffect(() => {
        if (!isCandidate) return undefined;

        const onRecruitmentChanged = (event) => {
            const detail = event?.detail || {};
            if (
                detail.kind &&
                detail.kind !== 'application' &&
                detail.kind !== 'invitation'
            ) {
                return;
            }
            void loadCounts().catch(() => {});
            void loadPage(0, activeStatus);
        };

        window.addEventListener(RECRUITMENT_CHANGED_EVENT, onRecruitmentChanged);
        return () =>
            window.removeEventListener(RECRUITMENT_CHANGED_EVENT, onRecruitmentChanged);
    }, [isCandidate, activeStatus, loadCounts, loadPage]);

    const canLoadMore = totalPages > 1 && page + 1 < totalPages;
    const loadMore = async () => {
        if (loading || !canLoadMore) return;
        try {
            const nextPage = page + 1;
            const res = await getMyApplications({
                page: nextPage,
                size: PAGE_SIZE,
                status: activeStatus,
            });
            const pageData = res?.data?.data ?? res?.data;
            setApplications((prev) => [...prev, ...(pageData?.content ?? [])]);
            setTotalPages(pageData?.totalPages ?? totalPages);
            setTotalElements(pageData?.totalElements ?? totalElements);
            setPage(pageData?.currentPage ?? nextPage);
        } catch (err) {
            toast.error(err?.message || 'Không thể tải thêm lịch sử ứng tuyển.');
        }
    };

    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [detailJobId, setDetailJobId] = useState(null);
    const [cancelTarget, setCancelTarget] = useState(null);

    // Đánh giá DN sau HIRED (reuse ReviewSubmitModal / ReviewApi như recruiter)
    const [reviewTarget, setReviewTarget] = useState(null);
    const [reviewBusy, setReviewBusy] = useState(false);
    const [reviewMode, setReviewMode] = useState('edit');
    const [reviewDraft, setReviewDraft] = useState({ rating: 5, comment: '' });
    const [reviewedIds, setReviewedIds] = useState(() => new Set());
    const [reviewCache, setReviewCache] = useState(() => ({}));

    useEffect(() => {
        const hired = applications.filter(
            (app) => app.status === 'HIRED' && app.applicationId != null
        );
        if (hired.length === 0) return undefined;

        let cancelled = false;
        (async () => {
            const found = new Set();
            const cache = {};
            await Promise.all(
                hired.map(async (app) => {
                    try {
                        const res = await getMyApplicationReview(app.applicationId);
                        const data = res?.data?.data ?? res?.data ?? null;
                        if (data) {
                            const key = String(app.applicationId);
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

    const handleOpenReview = async (item) => {
        if (!item?.applicationId || item.status !== 'HIRED') return;
        const key = String(item.applicationId);

        if (reviewedIds.has(key)) {
            setReviewBusy(true);
            try {
                let draft = reviewCache[key];
                if (!draft) {
                    const res = await getMyApplicationReview(item.applicationId);
                    const data = res?.data?.data ?? res?.data ?? null;
                    draft = {
                        rating: data?.rating ?? 5,
                        comment: data?.comment || '',
                    };
                    setReviewCache((prev) => ({ ...prev, [key]: draft }));
                }
                setReviewDraft(draft);
                setReviewMode('view');
                setReviewTarget(item);
            } catch (err) {
                toast.error(getReviewApiErrorMessage(err, 'Không tải được đánh giá.'));
            } finally {
                setReviewBusy(false);
            }
            return;
        }

        setReviewDraft({ rating: 5, comment: '' });
        setReviewMode('edit');
        setReviewTarget(item);
    };

    const handleSubmitReview = async ({ rating, comment }) => {
        if (!reviewTarget?.applicationId || reviewBusy || reviewMode === 'view') return;
        setReviewBusy(true);
        try {
            await submitApplicationReview(reviewTarget.applicationId, {
                rating,
                comment: comment || null,
            });
            const key = String(reviewTarget.applicationId);
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

    const handleConfirm = async (applicationId) => {
        if (actionLoadingId) return;
        setActionLoadingId(applicationId);
        try {
            await confirmOffer(applicationId);
            toast.success('Đã xác nhận offer.');
            await loadPage(0, activeStatus);
            await loadCounts();
        } catch (err) {
            toast.error(err?.message || 'Không thể xác nhận offer.');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleDecline = async (applicationId) => {
        if (actionLoadingId) return;
        setActionLoadingId(applicationId);
        try {
            await declineOffer(applicationId);
            toast.success('Đã từ chối offer.');
            await loadPage(0, activeStatus);
            await loadCounts();
        } catch (err) {
            toast.error(err?.message || 'Không thể từ chối offer.');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleCancelConfirm = async () => {
        if (!cancelTarget?.applicationId || actionLoadingId) return;
        setActionLoadingId(cancelTarget.applicationId);
        try {
            await cancelApplication(cancelTarget.applicationId);
            toast.success('Đã hủy đơn. Bạn có thể ứng tuyển lại tin này bất cứ lúc nào.');
            setCancelTarget(null);
            setActiveStatus('PENDING');
            await loadPage(0, 'PENDING');
            await loadCounts();
        } catch (err) {
            const message =
                err?.response?.data?.message || err?.message || 'Không thể hủy đơn ứng tuyển.';
            if (message === 'INVALID_STATUS') {
                toast.error('Đơn không còn ở trạng thái chờ phản hồi.');
                setCancelTarget(null);
                await loadPage(0, activeStatus);
                await loadCounts();
            } else if (message === 'APPLICATION_NOT_FOUND') {
                toast.error('Không tìm thấy đơn ứng tuyển.');
            } else if (message === 'NOT_OWNER') {
                toast.error('Bạn không có quyền hủy đơn này.');
            } else {
                toast.error(message);
            }
        } finally {
            setActionLoadingId(null);
        }
    };

    /** Soft CANCELLED → apply lại cùng job/API cũ; BE đổi lại PENDING (cùng applicationId). */
    const handleReAppliedFromDetail = async () => {
        setDetailJobId(null);
        setActiveStatus('PENDING');
        await loadCounts();
    };

    const title = useMemo(() => {
        const tab = STATUS_TABS.find((t) => t.value === activeStatus);
        return tab ? `Lịch sử ứng tuyển - ${tab.label}` : 'Lịch sử ứng tuyển';
    }, [activeStatus]);

    if (!isCandidate) return null;

    return (
        <div className="cah-page">
            <header className="cah-page__header">
                <h1 className="cah-page__title">{title}</h1>
                <p className="cah-page__subtitle">
                    Xem tiến trình ứng tuyển và thực hiện offer actions khi nhà tuyển dụng chấp nhận.
                </p>
            </header>

            <div className="cah-summary">
                {STATUS_TABS.map((t) => {
                    const isActive = t.value === activeStatus;
                    const tone = getStatusUi(t.value).tone;
                    return (
                        <button
                            key={t.value}
                            type="button"
                            className={`cah-summary__card cah-summary__card--${tone}${
                                isActive ? ' cah-summary__card--active' : ''
                            }`}
                            onClick={() => setActiveStatus(t.value)}
                        >
                            <div className="cah-summary__count">{counts[t.value] ?? 0}</div>
                            <div className="cah-summary__label">{t.label}</div>
                        </button>
                    );
                })}
            </div>

            {listError && <p className="cah-page__error">{listError}</p>}

            <div className="cah-list" aria-busy={loading}>
                {loading && applications.length === 0 && (
                    <>
                        {Array.from({ length: 5 }).map((_, idx) => (
                            <div key={idx} className="cah-item cah-item--skeleton" />
                        ))}
                    </>
                )}

                {!loading && applications.length === 0 && !listError && (
                    <p className="cah-empty">Chưa có lịch sử ứng tuyển ở trạng thái này.</p>
                )}

                {applications.map((item) => {
                    const ui = getStatusUi(item.status);
                    const isPending = item.status === 'PENDING';
                    const isAccepted = item.status === 'ACCEPTED';
                    const isCancelled = item.status === 'CANCELLED';
                    const isHired = item.status === 'HIRED';
                    const appKey = item.applicationId != null ? String(item.applicationId) : '';
                    const hasReviewed = Boolean(appKey && reviewedIds.has(appKey));
                    const shiftsLabel = formatJobShiftsLabel(item.shifts);
                    const appliedLabel = formatAppliedAt(item.appliedAt);

                    return (
                        <section
                            key={item.applicationId ?? `${item.jobId}-${item.appliedAt}`}
                            className="cah-item"
                        >
                            <div className="cah-item__main">
                                <BusinessLogo
                                    name={item.businessName}
                                    logoUrl={item.businessLogoUrl}
                                />

                                <div className="cah-item__text">
                                    <h3 className="cah-item__job">{item.jobTitle || '—'}</h3>
                                    {item.businessId ? (
                                        <BusinessProfileLink
                                            businessId={item.businessId}
                                            className="cah-item__company cah-item__company--link"
                                            title="Xem thông tin công ty"
                                            label="Lịch sử ứng tuyển"
                                        >
                                            {item.businessName || '—'}
                                        </BusinessProfileLink>
                                    ) : (
                                        <p className="cah-item__company">{item.businessName || '—'}</p>
                                    )}

                                    <div className="cah-item__meta-row">
                                        <span className={`cah-badge cah-badge--${ui.tone}`}>
                                            {ui.label}
                                        </span>
                                        {appliedLabel && (
                                            <span className="cah-item__meta-chip">
                                                <CalendarIcon width={14} height={14} />
                                                {appliedLabel}
                                            </span>
                                        )}
                                    </div>

                                    {shiftsLabel && (
                                        <p className="cah-item__shifts" title={shiftsLabel}>
                                            <ClockIcon width={14} height={14} />
                                            <span>{shiftsLabel}</span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="cah-item__actions">
                                {item.jobId && item.recruiterId ? (
                                    <button
                                        type="button"
                                        className="cah-btn cah-btn--ghost"
                                        title="Nhắn tin với nhà tuyển dụng"
                                        onClick={() =>
                                            openChatPanel({
                                                jobId: item.jobId,
                                                otherUserId: item.recruiterId,
                                            })
                                        }
                                    >
                                        <ChatIcon width={16} height={16} />
                                        Chat
                                    </button>
                                ) : null}
                                {item.jobId ? (
                                    <button
                                        type="button"
                                        className="cah-btn cah-btn--link"
                                        title="Xem lại tin tuyển dụng"
                                        onClick={() => setDetailJobId(item.jobId)}
                                    >
                                        Xem chi tiết job
                                    </button>
                                ) : null}
                                {isCancelled && item.jobId ? (
                                    <button
                                        type="button"
                                        className="cah-btn cah-btn--primary"
                                        title="Ứng tuyển lại tin này"
                                        onClick={() => setDetailJobId(item.jobId)}
                                    >
                                        Ứng tuyển lại
                                    </button>
                                ) : null}
                                {SHOW_CANCEL_APPLICATION_UI && isPending ? (
                                    <button
                                        type="button"
                                        className="cah-btn cah-btn--danger"
                                        disabled={actionLoadingId === item.applicationId}
                                        onClick={() => setCancelTarget(item)}
                                    >
                                        {actionLoadingId === item.applicationId
                                            ? 'Đang hủy...'
                                            : 'Hủy đơn'}
                                    </button>
                                ) : null}
                                {isAccepted ? (
                                    <div className="cah-action-row">
                                        <button
                                            type="button"
                                            className="cah-btn cah-btn--ghost"
                                            disabled={actionLoadingId === item.applicationId}
                                            onClick={() => handleDecline(item.applicationId)}
                                        >
                                            Từ chối
                                        </button>
                                        <button
                                            type="button"
                                            className="cah-btn cah-btn--primary"
                                            disabled={actionLoadingId === item.applicationId}
                                            onClick={() => handleConfirm(item.applicationId)}
                                        >
                                            {actionLoadingId === item.applicationId
                                                ? 'Đang xử lý...'
                                                : 'Chấp nhận'}
                                        </button>
                                    </div>
                                ) : null}
                                {isHired && item.applicationId ? (
                                    <button
                                        type="button"
                                        className={`cah-btn${
                                            hasReviewed ? ' cah-btn--ghost' : ' cah-btn--primary'
                                        }`}
                                        disabled={reviewBusy}
                                        title={
                                            hasReviewed
                                                ? 'Xem đánh giá đã gửi'
                                                : 'Đánh giá doanh nghiệp (sau 24h kể từ khi trúng tuyển)'
                                        }
                                        onClick={() => handleOpenReview(item)}
                                    >
                                        {hasReviewed ? 'Xem đánh giá' : 'Gửi đánh giá'}
                                    </button>
                                ) : null}
                            </div>
                        </section>
                    );
                })}
            </div>

            {totalElements > 0 && canLoadMore && (
                <div className="cah-load-more">
                    <button
                        type="button"
                        className="cah-btn cah-btn--ghost"
                        onClick={loadMore}
                        disabled={loading}
                    >
                        {loading ? 'Đang tải...' : 'Xem thêm'}
                    </button>
                </div>
            )}

            <JobDetailModal
                open={detailJobId != null}
                jobId={detailJobId}
                onClose={() => setDetailJobId(null)}
                onApplied={handleReAppliedFromDetail}
            />

            <ConfirmModal
                open={Boolean(cancelTarget)}
                title="Hủy đơn ứng tuyển"
                confirmLabel="Hủy đơn"
                cancelLabel="Giữ lại"
                variant="danger"
                loading={actionLoadingId === cancelTarget?.applicationId}
                onConfirm={handleCancelConfirm}
                onCancel={() => setCancelTarget(null)}
            >
                <p className="confirm-modal__message">
                    Bạn có chắc muốn hủy đơn ứng tuyển{' '}
                    <strong>{cancelTarget?.jobTitle || 'này'}</strong>?
                </p>
                <p className="confirm-modal__hint">
                    Đơn sẽ chuyển sang Đã hủy (vẫn còn trong lịch sử). Nút Apply trên tin tuyển dụng
                    hiện lại; khi nộp lại dùng cùng đơn, không tạo đơn mới.
                </p>
            </ConfirmModal>

            <ReviewSubmitModal
                open={Boolean(reviewTarget)}
                busy={reviewBusy}
                mode={reviewMode}
                title={reviewMode === 'view' ? 'Xem đánh giá' : 'Đánh giá doanh nghiệp'}
                subtitle={
                    reviewTarget
                        ? [reviewTarget.jobTitle, reviewTarget.businessName]
                              .filter(Boolean)
                              .join(' · ')
                        : ''
                }
                initialRating={reviewDraft.rating}
                initialComment={reviewDraft.comment}
                onClose={() => setReviewTarget(null)}
                onSubmit={handleSubmitReview}
            />
        </div>
    );
};

export default CandidateApplicationHistoryPage;
