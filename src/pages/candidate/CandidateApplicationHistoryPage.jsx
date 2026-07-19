import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    getMyApplications,
    confirmOffer,
    declineOffer,
    cancelApplication,
} from '../../apis/ApplicationApi.jsx';
import JobDetailModal from '../../components/job/JobDetailModal.jsx';
import ConfirmModal from '../../components/common/ConfirmModal.jsx';
import { CalendarIcon, ClockIcon } from '../../components/common/icons.jsx';
import { USER_ROLES } from '../../utils/Constants.jsx';
import { useAuth } from '../../contexts/authContext.js';
import { getBusinessProfilePath } from '../../routes/path.js';
import { formatJobShiftsLabel, getBusinessInitial } from '../../utils/formatters.js';
import '../../assets/styles/CandidateApplicationHistoryPageStyle.css';

const PAGE_SIZE = 10;

const STATUS_TABS = [
    { value: 'PENDING', label: 'Chờ phản hồi' },
    { value: 'ACCEPTED', label: 'Đã chấp nhận' },
    { value: 'REJECTED', label: 'Đã từ chối' },
    { value: 'HIRED', label: 'Đã trúng tuyển' },
    { value: 'CANCELLED', label: 'Đã hủy' },
];

const getStatusUi = (status) => {
    switch (status) {
        case 'PENDING':
            return { label: 'Chờ phản hồi', tone: 'pending' };
        case 'ACCEPTED':
            return { label: 'Đã chấp nhận', tone: 'accepted' };
        case 'REJECTED':
            return { label: 'Đã từ chối', tone: 'rejected' };
        case 'HIRED':
            return { label: 'Đã trúng tuyển', tone: 'hired' };
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

    const [counts, setCounts] = useState({
        PENDING: 0,
        ACCEPTED: 0,
        REJECTED: 0,
        HIRED: 0,
        CANCELLED: 0,
    });

    const loadCounts = useCallback(async () => {
        const statuses = STATUS_TABS.map((t) => t.value);
        const results = await Promise.all(
            statuses.map(async (status) => {
                const res = await getMyApplications({ page: 0, size: 1, status });
                return { status, totalElements: res?.data?.data?.totalElements ?? 0 };
            })
        );

        const next = { PENDING: 0, ACCEPTED: 0, REJECTED: 0, HIRED: 0, CANCELLED: 0 };
        results.forEach((r) => {
            next[r.status] = r.totalElements;
        });
        setCounts(next);
    }, []);

    const loadPage = useCallback(
        async (pageNum, status) => {
            setLoading(true);
            setListError('');
            try {
                const res = await getMyApplications({
                    page: pageNum,
                    size: PAGE_SIZE,
                    status,
                });
                const pageData = res?.data?.data ?? res?.data;
                setApplications(pageData?.content ?? []);
                setTotalPages(pageData?.totalPages ?? 0);
                setTotalElements(pageData?.totalElements ?? 0);
                setPage(pageData?.currentPage ?? pageNum);
            } catch (err) {
                setListError(err?.message || 'Không thể tải lịch sử ứng tuyển.');
                setApplications([]);
                setTotalPages(0);
                setTotalElements(0);
            } finally {
                setLoading(false);
            }
        },
        [setApplications]
    );

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
            setActiveStatus('CANCELLED');
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
                                        <Link
                                            to={getBusinessProfilePath(item.businessId)}
                                            className="cah-item__company cah-item__company--link"
                                            title="Xem thông tin công ty"
                                        >
                                            {item.businessName || '—'}
                                        </Link>
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
                                {isPending ? (
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
        </div>
    );
};

export default CandidateApplicationHistoryPage;
