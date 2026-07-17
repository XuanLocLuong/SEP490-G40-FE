import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
    decideJobReview,
    getApiErrorMessage,
    getJobReviewDetail,
    getJobReviewQueue,
} from '../../apis/JobReviewApi.jsx';
import JobReviewDetailPanel from '../../components/post-manager/JobReviewDetailPanel.jsx';
import JobReviewQueueList from '../../components/post-manager/JobReviewQueueList.jsx';
import { USER_ROLES } from '../../utils/Constants.jsx';
import { useAuth } from '../../contexts/authContext.js';
import {
    countByRisk,
    matchesRiskTab,
    matchesSearch,
} from '../../utils/jobReviewDisplay.js';
import '../../assets/styles/PostManagerReviewQueuePageStyle.css';

const PAGE_SIZE = 20;

const DECISION_MESSAGES = {
    APPROVED: 'Đã duyệt tin thành công.',
    REJECTED: 'Đã từ chối tin.',
    REVISION_REQUESTED: 'Đã gửi yêu cầu chỉnh sửa.',
};

const PostManagerReviewQueuePage = () => {
    const { auth } = useAuth();
    const isPostManager = auth?.role === USER_ROLES.POST_MANAGER;

    const [queueItems, setQueueItems] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [queueLoading, setQueueLoading] = useState(false);
    const [queueError, setQueueError] = useState('');

    const [activeRiskTab, setActiveRiskTab] = useState('ALL');
    const [search, setSearch] = useState('');

    const [selectedReviewId, setSelectedReviewId] = useState(null);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState('');

    const [note, setNote] = useState('');
    const [deciding, setDeciding] = useState(false);

    const loadQueue = useCallback(async (pageNum, { append = false } = {}) => {
        setQueueLoading(true);
        setQueueError('');
        try {
            const res = await getJobReviewQueue({ page: pageNum, size: PAGE_SIZE });
            const pageData = res?.data?.data ?? res?.data;
            const content = pageData?.content ?? [];
            setQueueItems((prev) => (append ? [...prev, ...content] : content));
            setTotalPages(pageData?.totalPages ?? 0);
            setPage(pageData?.number ?? pageNum);
        } catch (err) {
            setQueueError(getApiErrorMessage(err, 'Không thể tải hàng chờ kiểm duyệt.'));
            if (!append) {
                setQueueItems([]);
                setTotalPages(0);
            }
        } finally {
            setQueueLoading(false);
        }
    }, []);

    const loadDetail = useCallback(async (reviewId) => {
        if (!reviewId) {
            setDetail(null);
            setDetailError('');
            return;
        }

        setDetailLoading(true);
        setDetailError('');
        try {
            const res = await getJobReviewDetail(reviewId);
            setDetail(res?.data?.data ?? res?.data ?? null);
        } catch (err) {
            setDetail(null);
            setDetailError(getApiErrorMessage(err, 'Không thể tải chi tiết tin đăng.'));
        } finally {
            setDetailLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isPostManager) return;
        loadQueue(0);
    }, [isPostManager, loadQueue]);

    useEffect(() => {
        if (!isPostManager) return;
        loadDetail(selectedReviewId);
        setNote('');
    }, [isPostManager, selectedReviewId, loadDetail]);

    const filteredItems = useMemo(
        () =>
            queueItems.filter(
                (item) => matchesRiskTab(item, activeRiskTab) && matchesSearch(item, search)
            ),
        [queueItems, activeRiskTab, search]
    );

    const riskCounts = useMemo(() => countByRisk(queueItems), [queueItems]);

    const canLoadMore = totalPages > 1 && page + 1 < totalPages;

    const handleLoadMore = async () => {
        if (queueLoading || !canLoadMore) return;
        await loadQueue(page + 1, { append: true });
    };

    const handleSelect = (reviewId) => {
        setSelectedReviewId(reviewId);
    };

    const handleDecide = async (decision) => {
        if (!selectedReviewId || deciding) return;

        const trimmedNote = note.trim();
        if ((decision === 'REJECTED' || decision === 'REVISION_REQUESTED') && !trimmedNote) {
            toast.error('Vui lòng nhập lý do xử lý.');
            return;
        }

        setDeciding(true);
        try {
            await decideJobReview(selectedReviewId, {
                decision,
                note: trimmedNote || undefined,
            });
            toast.success(DECISION_MESSAGES[decision] || 'Đã xử lý tin thành công.');
            setSelectedReviewId(null);
            setDetail(null);
            setNote('');
            await loadQueue(0);
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Không thể xử lý tin đăng.'));
        } finally {
            setDeciding(false);
        }
    };

    if (!isPostManager) return null;

    return (
        <div className="pm-queue-page">
            <header className="pm-queue-page__header">
                <h1 className="pm-queue-page__title">Hàng chờ kiểm duyệt</h1>
                <p className="pm-queue-page__subtitle">
                    Xem tin chờ duyệt, phân tích AI và ra quyết định cho recruiter.
                </p>
            </header>

            {queueError && <p className="pm-queue-page__error">{queueError}</p>}

            <div className="pm-queue-page__layout">
                <div className="pm-queue-page__list-wrap">
                    <JobReviewQueueList
                        items={filteredItems}
                        selectedReviewId={selectedReviewId}
                        activeRiskTab={activeRiskTab}
                        onRiskTabChange={setActiveRiskTab}
                        riskCounts={riskCounts}
                        search={search}
                        onSearchChange={setSearch}
                        loading={queueLoading}
                        onSelect={handleSelect}
                    />

                    {canLoadMore && (
                        <div className="pm-queue-page__load-more">
                            <button
                                type="button"
                                className="pm-review-btn pm-review-btn--ghost"
                                onClick={handleLoadMore}
                                disabled={queueLoading}
                            >
                                {queueLoading ? 'Đang tải...' : 'Tải thêm'}
                            </button>
                        </div>
                    )}
                </div>

                <JobReviewDetailPanel
                    detail={detail}
                    loading={detailLoading}
                    error={detailError}
                    note={note}
                    onNoteChange={setNote}
                    deciding={deciding}
                    onDecide={handleDecide}
                />
            </div>
        </div>
    );
};

export default PostManagerReviewQueuePage;
