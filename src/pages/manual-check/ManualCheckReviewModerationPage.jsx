import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
    decideReviewModeration,
    getApiErrorMessage,
    getReviewModerationDetail,
    getReviewModerationQueue,
} from '../../apis/ReviewModerationApi.jsx';
import ReviewModerationDetailPanel from '../../components/manual-check/ReviewModerationDetailPanel.jsx';
import ReviewModerationQueueList from '../../components/manual-check/ReviewModerationQueueList.jsx';
import { USER_ROLES } from '../../utils/Constants.jsx';
import { useAuth } from '../../contexts/authContext.js';
import {
    DECISION_MESSAGES,
    matchesReviewSearch,
} from '../../utils/reviewModerationDisplay.js';
import '../../assets/styles/PostManagerReviewQueuePageStyle.css';
import '../../assets/styles/ManualCheckReviewModerationStyle.css';

const PAGE_SIZE = 20;

const ManualCheckReviewModerationPage = () => {
    const { auth } = useAuth();
    const isManualCheck = auth?.role === USER_ROLES.MANUAL_CHECK_TEAM;

    const [queueItems, setQueueItems] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [queueLoading, setQueueLoading] = useState(false);
    const [queueError, setQueueError] = useState('');

    const [search, setSearch] = useState('');

    const [selectedId, setSelectedId] = useState(null);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState('');

    const [note, setNote] = useState('');
    const [deciding, setDeciding] = useState(false);

    const loadQueue = useCallback(async (pageNum, { append = false } = {}) => {
        setQueueLoading(true);
        setQueueError('');
        try {
            const res = await getReviewModerationQueue({ page: pageNum, size: PAGE_SIZE });
            const pageData = res?.data?.data ?? res?.data;
            const content = (pageData?.content ?? []).filter(Boolean);
            setQueueItems((prev) => (append ? [...prev, ...content] : content));
            setTotalPages(pageData?.totalPages ?? 0);
            setPage(pageData?.number ?? pageNum);
        } catch (err) {
            setQueueError(
                getApiErrorMessage(err, 'Không thể tải hàng chờ kiểm duyệt đánh giá.')
            );
            if (!append) {
                setQueueItems([]);
                setTotalPages(0);
            }
        } finally {
            setQueueLoading(false);
        }
    }, []);

    const loadDetail = useCallback(async (contentValidationId) => {
        if (!contentValidationId) {
            setDetail(null);
            setDetailError('');
            return;
        }

        setDetailLoading(true);
        setDetailError('');
        try {
            const res = await getReviewModerationDetail(contentValidationId);
            setDetail(res?.data?.data ?? res?.data ?? null);
        } catch (err) {
            setDetail(null);
            setDetailError(
                getApiErrorMessage(err, 'Không thể tải chi tiết đánh giá.')
            );
        } finally {
            setDetailLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isManualCheck) return;
        loadQueue(0);
    }, [isManualCheck, loadQueue]);

    useEffect(() => {
        if (!isManualCheck) return;
        loadDetail(selectedId);
        setNote('');
    }, [isManualCheck, selectedId, loadDetail]);

    const filteredItems = useMemo(
        () => queueItems.filter((item) => matchesReviewSearch(item, search)),
        [queueItems, search]
    );

    const canLoadMore = totalPages > 1 && page + 1 < totalPages;

    const handleLoadMore = async () => {
        if (queueLoading || !canLoadMore) return;
        await loadQueue(page + 1, { append: true });
    };

    const handleDecide = async (decision) => {
        if (!selectedId || deciding) return;

        const trimmedNote = note.trim();
        if ((decision === 'REJECTED' || decision === 'HIDDEN') && !trimmedNote) {
            toast.error('Vui lòng nhập ghi chú khi Từ chối hoặc Ẩn nội dung.');
            return;
        }

        setDeciding(true);
        try {
            await decideReviewModeration(selectedId, {
                decision,
                note: trimmedNote || undefined,
            });
            toast.success(DECISION_MESSAGES[decision] || 'Đã xử lý đánh giá.');
            setSelectedId(null);
            setDetail(null);
            setNote('');
            await loadQueue(0);
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Không thể xử lý đánh giá.'));
        } finally {
            setDeciding(false);
        }
    };

    if (!isManualCheck) return null;

    return (
        <div className="pm-queue-page">
            <header className="pm-queue-page__header">
                <h1 className="pm-queue-page__title">Kiểm duyệt nội dung đánh giá</h1>
            </header>

            {queueError && <p className="pm-queue-page__error">{queueError}</p>}

            <div className="pm-queue-page__layout">
                <div className="pm-queue-page__list-wrap">
                    <ReviewModerationQueueList
                        items={filteredItems}
                        selectedId={selectedId}
                        search={search}
                        onSearchChange={setSearch}
                        loading={queueLoading}
                        onSelect={setSelectedId}
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

                <ReviewModerationDetailPanel
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

export default ManualCheckReviewModerationPage;
