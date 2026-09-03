import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    acceptInvitation,
    getInvitationApiErrorMessage,
    getMyInvitations,
    rejectInvitation,
} from '../../apis/InvitationApi.jsx';
import InvitationDetailModal from '../../components/candidate/invitations/InvitationDetailModal.jsx';
import ConfirmModal from '../../components/common/ConfirmModal.jsx';
import { CheckCircleIcon, ChatIcon, ClockIcon, AlertIcon, XIcon } from '../../components/common/icons.jsx';
import { useAuth } from '../../contexts/authContext.js';
import { USER_ROLES } from '../../utils/Constants.jsx';
import { openChatPanel, RECRUITMENT_CHANGED_EVENT } from '../../utils/chatEvents.js';
import { getBusinessInitial } from '../../utils/formatters.js';
import { formatJobTypeLabels } from '../../utils/jobTypeDisplay.js';
import { useJobTypeOptions } from '../../hooks/useJobTypeOptions.js';
import {
    formatInvitationSentAt,
    formatMatchScore,
    getInvitationRemainingLabel,
    getInvitationStatusLabel,
    INACTIVE_STATUSES,
} from '../../utils/invitationDisplay.js';
import {
    buildInvitationsLeaveNavigate,
    clearInvitationsReturn,
    resolveInvitationsBack,
} from '../../utils/invitationNavReturn.js';
import '../../assets/styles/CandidateInvitationsPageStyle.css';

const PAGE_SIZE = 10;

const unwrapPage = (res) => {
    const pageData = res?.data?.data ?? res?.data;
    return {
        content: pageData?.content ?? [],
        totalElements: pageData?.totalElements ?? 0,
        totalPages: pageData?.totalPages ?? 0,
        currentPage: pageData?.currentPage ?? 0,
    };
};

const BusinessLogo = ({ name, logoUrl }) => {
    const [failed, setFailed] = useState(false);
    const showImage = Boolean(logoUrl) && !failed;

    if (showImage) {
        return (
            <img
                src={logoUrl}
                alt=""
                className="ci-card__logo"
                onError={() => setFailed(true)}
            />
        );
    }

    return (
        <span className="ci-card__logo ci-card__logo--placeholder" aria-hidden="true">
            {getBusinessInitial(name)}
        </span>
    );
};

const VALID_TABS = ['SENT', 'ACCEPTED', 'REJECTED', 'INACTIVE'];

const CandidateInvitationsPage = () => {
    const { auth } = useAuth();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const isCandidate = auth?.role === USER_ROLES.CANDIDATE;
    const jobTypeOptions = useJobTypeOptions();
    const back = useMemo(
        () => resolveInvitationsBack(location.state),
        [location.state],
    );

    const tabParam = (searchParams.get('tab') || '').toUpperCase();
    const initialTab = VALID_TABS.includes(tabParam) ? tabParam : 'SENT';

    const [activeTab, setActiveTab] = useState(initialTab);
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const [listError, setListError] = useState('');
    const [counts, setCounts] = useState({
        SENT: 0,
        ACCEPTED: 0,
        REJECTED: 0,
        INACTIVE: 0,
    });

    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [detailId, setDetailId] = useState(
        searchParams.get('invitationId') ? Number(searchParams.get('invitationId')) : null
    );
    const [rejectTarget, setRejectTarget] = useState(null);

    useEffect(() => {
        const currentTab = (searchParams.get('tab') || '').toUpperCase();
        if (currentTab && VALID_TABS.includes(currentTab)) {
            setActiveTab(currentTab);
        }
        const currentInvId = searchParams.get('invitationId');
        if (currentInvId) {
            setDetailId(Number(currentInvId));
        }
    }, [searchParams]);

    const loadCounts = useCallback(async () => {
        const [sent, accepted, rejected, ...inactivePages] = await Promise.all([
            getMyInvitations({ page: 0, size: 1, status: 'SENT' }),
            getMyInvitations({ page: 0, size: 1, status: 'ACCEPTED' }),
            getMyInvitations({ page: 0, size: 1, status: 'REJECTED' }),
            ...INACTIVE_STATUSES.map((status) =>
                getMyInvitations({ page: 0, size: 1, status })
            ),
        ]);

        const inactiveTotal = inactivePages.reduce(
            (sum, res) => sum + (unwrapPage(res).totalElements || 0),
            0
        );

        setCounts({
            SENT: unwrapPage(sent).totalElements,
            ACCEPTED: unwrapPage(accepted).totalElements,
            REJECTED: unwrapPage(rejected).totalElements,
            INACTIVE: inactiveTotal,
        });
    }, []);

    const loadInactiveMerged = useCallback(async () => {
        const pages = await Promise.all(
            INACTIVE_STATUSES.map((status) =>
                getMyInvitations({ page: 0, size: 50, status })
            )
        );
        const merged = pages.flatMap((res) => unwrapPage(res).content);
        merged.sort((a, b) => new Date(b.sentAt || 0) - new Date(a.sentAt || 0));
        return merged;
    }, []);

    const loadPage = useCallback(
        async (pageNum, tabId) => {
            setLoading(true);
            setListError('');
            try {
                if (tabId === 'INACTIVE') {
                    const merged = await loadInactiveMerged();
                    setItems(merged);
                    setTotalPages(1);
                    setPage(0);
                    return;
                }

                const res = await getMyInvitations({
                    page: pageNum,
                    size: PAGE_SIZE,
                    status: tabId,
                });
                const pageData = unwrapPage(res);
                setItems(pageData.content);
                setTotalPages(pageData.totalPages);
                setPage(pageData.currentPage ?? pageNum);
            } catch (err) {
                setListError(
                    getInvitationApiErrorMessage(err, 'Không thể tải danh sách lời mời.')
                );
                setItems([]);
                setTotalPages(0);
            } finally {
                setLoading(false);
            }
        },
        [loadInactiveMerged]
    );

    useEffect(() => {
        if (!isCandidate) return;
        loadCounts().catch(() => {});
    }, [isCandidate, loadCounts]);

    useEffect(() => {
        if (!isCandidate) return;
        loadPage(0, activeTab);
    }, [activeTab, isCandidate, loadPage]);

    // Refresh when invite actions happen via chat float.
    useEffect(() => {
        if (!isCandidate) return undefined;

        const onRecruitmentChanged = (event) => {
            const detail = event?.detail || {};
            if (detail.kind && detail.kind !== 'invitation') return;
            void loadCounts().catch(() => {});
            void loadPage(0, activeTab);
        };

        window.addEventListener(RECRUITMENT_CHANGED_EVENT, onRecruitmentChanged);
        return () =>
            window.removeEventListener(RECRUITMENT_CHANGED_EVENT, onRecruitmentChanged);
    }, [isCandidate, activeTab, loadCounts, loadPage]);

    const canLoadMore = activeTab !== 'INACTIVE' && totalPages > 1 && page + 1 < totalPages;

    const loadMore = async () => {
        if (loading || !canLoadMore) return;
        try {
            const nextPage = page + 1;
            const res = await getMyInvitations({
                page: nextPage,
                size: PAGE_SIZE,
                status: activeTab,
            });
            const pageData = unwrapPage(res);
            setItems((prev) => [...prev, ...pageData.content]);
            setTotalPages(pageData.totalPages);
            setPage(pageData.currentPage ?? nextPage);
        } catch (err) {
            toast.error(getInvitationApiErrorMessage(err, 'Không thể tải thêm lời mời.'));
        }
    };

    const refreshAfterAction = async () => {
        await loadCounts();
        await loadPage(0, activeTab);
    };

    const handleAccept = async (invitation) => {
        if (!invitation?.invitationId || actionLoadingId) return;
        setActionLoadingId(invitation.invitationId);
        try {
            await acceptInvitation(invitation.invitationId);
            toast.success('Đã chấp nhận lời mời.');
            await refreshAfterAction();
        } catch (err) {
            toast.error(getInvitationApiErrorMessage(err, 'Không thể chấp nhận lời mời.'));
            await refreshAfterAction();
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleRejectConfirm = async () => {
        if (!rejectTarget?.invitationId || actionLoadingId) return;
        setActionLoadingId(rejectTarget.invitationId);
        try {
            await rejectInvitation(rejectTarget.invitationId);
            toast.success('Đã từ chối lời mời.');
            setRejectTarget(null);
            await refreshAfterAction();
        } catch (err) {
            toast.error(getInvitationApiErrorMessage(err, 'Không thể từ chối lời mời.'));
            await refreshAfterAction();
        } finally {
            setActionLoadingId(null);
        }
    };

    if (!isCandidate) return null;

    return (
        <div className="ci-page">
            <header className="ci-page__header">
                {back ? (
                    <Link
                        to={back.path}
                        state={buildInvitationsLeaveNavigate(back)?.state}
                        className="ci-page__back"
                        onClick={() => clearInvitationsReturn()}
                    >
                        ← {back.label}
                    </Link>
                ) : null}
                <h1 className="ci-page__title">Lời mời ứng tuyển</h1>
                <p className="ci-page__subtitle">Quản lý các lời mời từ nhà tuyển dụng</p>
            </header>

            <div className="ci-stats" role="tablist" aria-label="Lọc lời mời">
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'SENT'}
                    className={`ci-stat ci-stat--sent${activeTab === 'SENT' ? ' is-active' : ''}`}
                    onClick={() => setActiveTab('SENT')}
                >
                    <span className="ci-stat__icon" aria-hidden="true">
                        <ClockIcon width={20} height={20} />
                    </span>
                    <span className="ci-stat__body">
                        <span className="ci-stat__count">{counts.SENT}</span>
                        <span className="ci-stat__label">Chờ phản hồi</span>
                    </span>
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'ACCEPTED'}
                    className={`ci-stat ci-stat--accepted${
                        activeTab === 'ACCEPTED' ? ' is-active' : ''
                    }`}
                    onClick={() => setActiveTab('ACCEPTED')}
                >
                    <span className="ci-stat__icon" aria-hidden="true">
                        <CheckCircleIcon width={20} height={20} />
                    </span>
                    <span className="ci-stat__body">
                        <span className="ci-stat__count">{counts.ACCEPTED}</span>
                        <span className="ci-stat__label">Đã chấp nhận</span>
                    </span>
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'REJECTED'}
                    className={`ci-stat ci-stat--rejected${
                        activeTab === 'REJECTED' ? ' is-active' : ''
                    }`}
                    onClick={() => setActiveTab('REJECTED')}
                >
                    <span className="ci-stat__icon" aria-hidden="true">
                        <XIcon width={20} height={20} />
                    </span>
                    <span className="ci-stat__body">
                        <span className="ci-stat__count">{counts.REJECTED}</span>
                        <span className="ci-stat__label">Đã từ chối</span>
                    </span>
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'INACTIVE'}
                    className={`ci-stat ci-stat--inactive${
                        activeTab === 'INACTIVE' ? ' is-active' : ''
                    }`}
                    onClick={() => setActiveTab('INACTIVE')}
                >
                    <span className="ci-stat__icon" aria-hidden="true">
                        <AlertIcon width={20} height={20} />
                    </span>
                    <span className="ci-stat__body">
                        <span className="ci-stat__count">{counts.INACTIVE}</span>
                        <span className="ci-stat__label">Không còn hiệu lực</span>
                    </span>
                </button>
            </div>

            {listError && <p className="ci-page__error">{listError}</p>}

            <div className="ci-list" aria-busy={loading}>
                {loading && items.length === 0 && (
                    <>
                        {Array.from({ length: 3 }).map((_, idx) => (
                            <div key={idx} className="ci-card ci-card--skeleton" />
                        ))}
                    </>
                )}

                {!loading && items.length === 0 && !listError && (
                    <p className="ci-empty">Chưa có lời mời ở mục này.</p>
                )}

                {items.map((item) => {
                    const isSent = item.status === 'SENT';
                    const isClosed = item.isJobOpen === false || item.jobStatus === 'CLOSED';
                    const isFilled = item.hasVacancy === false;
                    const canRespond = isSent && !isClosed && !isFilled;
                    const matchLabel = formatMatchScore(item.matchScore);
                    const remaining = isSent ? getInvitationRemainingLabel(item.sentAt) : null;
                    const sentLabel = formatInvitationSentAt(item.sentAt);
                    const busy = actionLoadingId === item.invitationId;

                    return (
                        <article key={item.invitationId} className="ci-card">
                            <button
                                type="button"
                                className="ci-card__main"
                                onClick={() => setDetailId(item.invitationId)}
                            >
                                <BusinessLogo
                                    name={item.businessName}
                                    logoUrl={item.businessLogoUrl}
                                />
                                <div className="ci-card__info">
                                    <div className="ci-card__title-row">
                                        <h2 className="ci-card__title">
                                            {item.jobTitle || '—'}
                                        </h2>
                                        {remaining && (
                                            <span className="ci-card__remain">
                                                <ClockIcon width={14} height={14} />
                                                {remaining}
                                            </span>
                                        )}
                                        {!isSent && (
                                            <span className="ci-card__status-chip">
                                                {getInvitationStatusLabel(item.status)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="ci-card__badges">
                                        {item.jobType && (
                                            <span className="ci-badge ci-badge--type">
                                                {formatJobTypeLabels(item.jobType, jobTypeOptions)}
                                            </span>
                                        )}
                                        {matchLabel && (
                                            <span className="ci-badge ci-badge--match">
                                                {matchLabel}
                                            </span>
                                        )}
                                        {isClosed && (
                                            <span className="ci-badge ci-badge--closed" title="Tin tuyển dụng này đã đóng">
                                                Tin đã đóng
                                            </span>
                                        )}
                                        {!isClosed && isFilled && (
                                            <span className="ci-badge ci-badge--filled" title="Vị trí này đã tuyển đủ số lượng">
                                                Đã tuyển đủ
                                            </span>
                                        )}
                                    </div>

                                    <p className="ci-card__company">{item.businessName || '—'}</p>

                                    {item.message && (
                                        <blockquote className="ci-card__message">
                                            “{item.message}”
                                        </blockquote>
                                    )}

                                    {sentLabel && (
                                        <p className="ci-card__sent">{sentLabel}</p>
                                    )}
                                </div>
                            </button>

                            {((item.jobId && item.recruiterId) || canRespond) && (
                            <div className="ci-card__actions">
                                {item.jobId && item.recruiterId ? (
                                    <button
                                        type="button"
                                        className="ci-btn ci-btn--ghost"
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
                                {canRespond ? (
                                    <>
                                        <button
                                            type="button"
                                            className="ci-btn ci-btn--ghost"
                                            disabled={busy}
                                            onClick={() => setRejectTarget(item)}
                                        >
                                            Từ chối
                                        </button>
                                        <button
                                            type="button"
                                            className="ci-btn ci-btn--primary"
                                            disabled={busy}
                                            onClick={() => handleAccept(item)}
                                        >
                                            {busy ? 'Đang xử lý...' : 'Chấp nhận'}
                                        </button>
                                    </>
                                ) : null}
                            </div>
                            )}
                        </article>
                    );
                })}
            </div>

            {canLoadMore && (
                <div className="ci-load-more">
                    <button
                        type="button"
                        className="ci-btn ci-btn--ghost"
                        onClick={loadMore}
                        disabled={loading}
                    >
                        {loading ? 'Đang tải...' : 'Xem thêm'}
                    </button>
                </div>
            )}

            <InvitationDetailModal
                open={detailId != null}
                invitationId={detailId}
                onClose={() => setDetailId(null)}
                onAccepted={refreshAfterAction}
                onRejected={refreshAfterAction}
            />

            <ConfirmModal
                open={Boolean(rejectTarget)}
                title="Từ chối lời mời"
                confirmLabel="Từ chối"
                cancelLabel="Giữ lại"
                variant="danger"
                loading={actionLoadingId === rejectTarget?.invitationId}
                onConfirm={handleRejectConfirm}
                onCancel={() => setRejectTarget(null)}
            >
                <p className="confirm-modal__message">
                    Bạn có chắc muốn từ chối lời mời{' '}
                    <strong>{rejectTarget?.jobTitle || 'này'}</strong>?
                </p>
            </ConfirmModal>
        </div>
    );
};

export default CandidateInvitationsPage;
