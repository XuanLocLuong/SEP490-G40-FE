import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
    analyzeReportCaseByAi,
    decideReportCase,
    getReportCaseDetail,
    getReportCasesQueue,
    getReportPenaltyRules,
    getReportReviewApiErrorMessage,
} from '../../apis/ReportReviewApi.jsx';
import ReportCaseDetailPanel from '../../components/post-manager/ReportCaseDetailPanel.jsx';
import ReportCaseQueueList from '../../components/post-manager/ReportCaseQueueList.jsx';
import ReportItemDetailModal from '../../components/post-manager/ReportItemDetailModal.jsx';
import JobDetailModal from '../../components/job/JobDetailModal.jsx';
import ConfirmModal from '../../components/common/ConfirmModal.jsx';
import { USER_ROLES } from '../../utils/Constants.jsx';
import { useAuth } from '../../contexts/authContext.js';
import {
    REPORT_DECISION,
    REPORT_DECISION_MESSAGES,
    matchesReportSearch,
} from '../../utils/reportReviewDisplay.js';
import '../../assets/styles/PostManagerReviewQueuePageStyle.css';
import '../../assets/styles/PostManagerReportQueuePageStyle.css';

const PAGE_SIZE = 20;

const unwrapPage = (res) => res?.data?.data ?? res?.data ?? {};
const unwrapData = (res) => res?.data?.data ?? res?.data ?? null;

const PostManagerReportQueuePage = () => {
    const { auth } = useAuth();
    const isPostManager = auth?.role === USER_ROLES.POST_MANAGER;

    const [queueItems, setQueueItems] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [queueLoading, setQueueLoading] = useState(false);
    const [queueError, setQueueError] = useState('');
    const [search, setSearch] = useState('');

    const [selectedJobId, setSelectedJobId] = useState(null);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState('');

    const [reason, setReason] = useState('');
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [penaltyRules, setPenaltyRules] = useState({});
    const [deciding, setDeciding] = useState(false);

    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState('');

    const [activeReportId, setActiveReportId] = useState(null);
    const [jobContentOpen, setJobContentOpen] = useState(false);
    const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);

    const loadQueue = useCallback(async (pageNum, { append = false } = {}) => {
        setQueueLoading(true);
        setQueueError('');
        try {
            const res = await getReportCasesQueue({ page: pageNum, size: PAGE_SIZE });
            const pageData = unwrapPage(res);
            const content = pageData?.content ?? [];
            setQueueItems((prev) => (append ? [...prev, ...content] : content));
            setTotalPages(pageData?.totalPages ?? 0);
            setPage(pageData?.number ?? pageData?.currentPage ?? pageNum);
        } catch (err) {
            setQueueError(getReportReviewApiErrorMessage(err, 'Không thể tải hàng chờ báo cáo.'));
            if (!append) {
                setQueueItems([]);
                setTotalPages(0);
            }
        } finally {
            setQueueLoading(false);
        }
    }, []);

    const loadDetail = useCallback(async (jobId) => {
        if (!jobId) {
            setDetail(null);
            setDetailError('');
            return;
        }

        setDetailLoading(true);
        setDetailError('');
        try {
            const res = await getReportCaseDetail(jobId);
            setDetail(unwrapData(res));
        } catch (err) {
            setDetail(null);
            setDetailError(getReportReviewApiErrorMessage(err, 'Không thể tải chi tiết case báo cáo.'));
        } finally {
            setDetailLoading(false);
        }
    }, []);

    const loadPenaltyRules = useCallback(async () => {
        try {
            const res = await getReportPenaltyRules();
            setPenaltyRules(unwrapData(res) || {});
        } catch {
            setPenaltyRules({});
        }
    }, []);

    useEffect(() => {
        if (!isPostManager) return;
        loadQueue(0);
        loadPenaltyRules();
    }, [isPostManager, loadQueue, loadPenaltyRules]);

    useEffect(() => {
        if (!isPostManager) return;
        loadDetail(selectedJobId);
        setReason('');
        setSelectedCategories([]);
        setAiAnalysis(null);
        setAiError('');
        setActiveReportId(null);
        setJobContentOpen(false);
        setBlockConfirmOpen(false);
    }, [isPostManager, selectedJobId, loadDetail]);

    const filteredItems = useMemo(
        () => queueItems.filter((item) => matchesReportSearch(item, search)),
        [queueItems, search]
    );

    const canLoadMore = totalPages > 1 && page + 1 < totalPages;

    const handleLoadMore = async () => {
        if (queueLoading || !canLoadMore) return;
        await loadQueue(page + 1, { append: true });
    };

    const handleToggleCategory = (code) => {
        setSelectedCategories((prev) =>
            prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code]
        );
    };

    const handleAnalyzeAi = async () => {
        if (!selectedJobId || aiLoading) return;
        setAiLoading(true);
        setAiError('');
        try {
            const res = await analyzeReportCaseByAi(selectedJobId);
            setAiAnalysis(unwrapData(res));
            toast.success('Đã phân tích AI xong.');
        } catch (err) {
            setAiAnalysis(null);
            setAiError(getReportReviewApiErrorMessage(err, 'Không thể phân tích AI.'));
            toast.error(getReportReviewApiErrorMessage(err, 'Không thể phân tích AI.'));
        } finally {
            setAiLoading(false);
        }
    };

    const submitDecision = async (decision) => {
        if (!selectedJobId || deciding) return;

        setDeciding(true);
        try {
            await decideReportCase(selectedJobId, {
                decision,
                reason: reason.trim(),
                categories: decision === REPORT_DECISION.BLOCK ? selectedCategories : undefined,
            });
            toast.success(REPORT_DECISION_MESSAGES[decision] || 'Đã xử lý case thành công.');
            setBlockConfirmOpen(false);
            setSelectedJobId(null);
            setDetail(null);
            setReason('');
            setSelectedCategories([]);
            setAiAnalysis(null);
            await loadQueue(0);
        } catch (err) {
            toast.error(getReportReviewApiErrorMessage(err, 'Không thể áp dụng quyết định.'));
        } finally {
            setDeciding(false);
        }
    };

    const handleDecide = (decision) => {
        if (!selectedJobId || deciding) return;

        if (!reason.trim()) {
            toast.error('Vui lòng nhập lý do xử lý.');
            return;
        }

        if (decision === REPORT_DECISION.BLOCK) {
            if (selectedCategories.length === 0) {
                toast.error('Vui lòng chọn ít nhất một lý do vi phạm khi khóa tin.');
                return;
            }
            setBlockConfirmOpen(true);
            return;
        }

        submitDecision(decision);
    };

    const handleMarkedRead = useCallback((reportId) => {
        setDetail((prev) => {
            if (!prev?.reports) return prev;
            const target = prev.reports.find((item) => item.reportId === reportId);
            if (target?.isRead !== false) return prev;

            setQueueItems((queuePrev) =>
                queuePrev.map((item) => {
                    if (item.jobId !== selectedJobId) return item;
                    const unread = Math.max(0, Number(item.unreadReports || 0) - 1);
                    return { ...item, unreadReports: unread };
                })
            );

            return {
                ...prev,
                reports: prev.reports.map((item) =>
                    item.reportId === reportId ? { ...item, isRead: true } : item
                ),
            };
        });
    }, [selectedJobId]);

    if (!isPostManager) return null;

    return (
        <div className="pm-queue-page">
            <header className="pm-queue-page__header">
                <h1 className="pm-queue-page__title">Báo cáo và khiếu nại</h1>
                <p className="pm-queue-page__subtitle">
                    Xử lý tin bị báo cáo: xem bằng chứng, phân tích AI khi cần, bác báo cáo hoặc khóa tin.
                </p>
            </header>

            {queueError && <p className="pm-queue-page__error">{queueError}</p>}

            <div className="pm-queue-page__layout">
                <div className="pm-queue-page__list-wrap">
                    <ReportCaseQueueList
                        items={filteredItems}
                        selectedJobId={selectedJobId}
                        search={search}
                        onSearchChange={setSearch}
                        loading={queueLoading}
                        onSelect={setSelectedJobId}
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

                <ReportCaseDetailPanel
                    detail={detail}
                    loading={detailLoading}
                    error={detailError}
                    reason={reason}
                    onReasonChange={setReason}
                    selectedCategories={selectedCategories}
                    onToggleCategory={handleToggleCategory}
                    penaltyRules={penaltyRules}
                    deciding={deciding}
                    onDecide={handleDecide}
                    aiAnalysis={aiAnalysis}
                    aiLoading={aiLoading}
                    aiError={aiError}
                    onAnalyzeAi={handleAnalyzeAi}
                    onOpenReport={setActiveReportId}
                    onViewJobContent={() => setJobContentOpen(true)}
                />
            </div>

            <ReportItemDetailModal
                open={Boolean(activeReportId)}
                reportId={activeReportId}
                onClose={() => setActiveReportId(null)}
                onMarkedRead={handleMarkedRead}
            />

            <JobDetailModal
                open={jobContentOpen}
                jobId={selectedJobId}
                hideCtas
                onClose={() => setJobContentOpen(false)}
            />

            <ConfirmModal
                open={blockConfirmOpen}
                title="Xác nhận khóa tin"
                confirmLabel="Khóa tin"
                cancelLabel="Hủy"
                variant="danger"
                loading={deciding}
                onConfirm={() => submitDecision(REPORT_DECISION.BLOCK)}
                onCancel={() => {
                    if (deciding) return;
                    setBlockConfirmOpen(false);
                }}
            >
                <p>
                    Khóa tin sẽ ẩn tin khỏi hệ thống và trừ điểm uy tín doanh nghiệp. Bạn có chắc
                    muốn tiếp tục?
                </p>
            </ConfirmModal>
        </div>
    );
};

export default PostManagerReportQueuePage;
