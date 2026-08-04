import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    getJobPostMetricsApiErrorMessage,
    getJobPostMetricsDetail,
    getJobPostMetricsSummary,
    searchJobPostMetricsJobs,
} from '../../apis/JobPostMetricsApi.jsx';
import JobPostMetricsDetailPanel from '../../components/post-manager/JobPostMetricsDetailPanel.jsx';
import { EyeIcon } from '../../components/common/icons.jsx';
import { ROUTES } from '../../routes/path.js';
import {
    AI_OUTCOME_OPTIONS,
    JOB_STATUS_OPTIONS,
    MODERATION_STATUS_OPTIONS,
    PERIOD_PRESET_OPTIONS,
    REPORT_STATUS_OPTIONS,
    buildDefaultMetricsPeriod,
    buildJobPostMetricsQuery,
    formatAiRiskLabel,
    formatJobStatusLabel,
    formatMetricsCompact,
    formatMetricsDateTime,
    formatMetricsNumber,
    formatMetricsRate,
    formatModerationStatusLabel,
    formatReviewDecisionLabel,
    getAiRiskTone,
    getJobStatusTone,
    getModerationStatusTone,
    getSuspiciousIndicatorLabel,
} from '../../utils/jobPostMetricsDisplay.js';
import '../../assets/styles/JobPostMetricsStyle.css';

const PAGE_SIZE = 10;

const emptyDraft = (days = 30) => ({
    periodDays: days,
    ...buildDefaultMetricsPeriod(days),
    jobStatus: '',
    moderationStatus: '',
    aiOutcome: '',
    reportStatus: '',
    recruiterId: '',
    suspiciousOnly: false,
});

const PostManagerAnalyticsPage = () => {
    const [draft, setDraft] = useState(() => emptyDraft(30));
    const [filters, setFilters] = useState(() => emptyDraft(30));

    const [summary, setSummary] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [summaryError, setSummaryError] = useState('');

    const [jobs, setJobs] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [listLoading, setListLoading] = useState(true);
    const [listError, setListError] = useState('');

    const [selectedJobId, setSelectedJobId] = useState(null);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState('');

    const patchDraft = (key, value) => {
        setDraft((prev) => ({ ...prev, [key]: value }));
    };

    const handlePeriodPreset = (days) => {
        const range = buildDefaultMetricsPeriod(Number(days) || 30);
        setDraft((prev) => ({
            ...prev,
            periodDays: Number(days) || 30,
            fromDate: range.fromDate,
            toDate: range.toDate,
        }));
    };

    const loadSummary = useCallback(async (activeFilters) => {
        setSummaryLoading(true);
        setSummaryError('');
        try {
            const data = await getJobPostMetricsSummary(buildJobPostMetricsQuery(activeFilters));
            setSummary(data);
        } catch (err) {
            setSummary(null);
            setSummaryError(getJobPostMetricsApiErrorMessage(err, 'Không tải được tổng quan metrics.'));
        } finally {
            setSummaryLoading(false);
        }
    }, []);

    const loadJobs = useCallback(async (activeFilters, pageNum = 0) => {
        setListLoading(true);
        setListError('');
        try {
            const data = await searchJobPostMetricsJobs(
                buildJobPostMetricsQuery(activeFilters, { page: pageNum, size: PAGE_SIZE })
            );
            const content = data?.content ?? [];
            setJobs(content);
            setPage(data?.currentPage ?? data?.number ?? pageNum);
            setTotalPages(data?.totalPages ?? 0);
            setTotalElements(data?.totalElements ?? content.length);
        } catch (err) {
            setJobs([]);
            setTotalPages(0);
            setTotalElements(0);
            setListError(getJobPostMetricsApiErrorMessage(err, 'Không tải được danh sách job.'));
        } finally {
            setListLoading(false);
        }
    }, []);

    const loadDetail = useCallback(async (jobId, activeFilters) => {
        if (!jobId) {
            setDetail(null);
            setDetailError('');
            return;
        }
        setDetailLoading(true);
        setDetailError('');
        try {
            const data = await getJobPostMetricsDetail(jobId, buildJobPostMetricsQuery(activeFilters));
            setDetail(data);
        } catch (err) {
            setDetail(null);
            setDetailError(getJobPostMetricsApiErrorMessage(err, 'Không tải được chi tiết job.'));
        } finally {
            setDetailLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch summary+list on filter apply
        loadSummary(filters);
        loadJobs(filters, 0);
        setSelectedJobId(null);
        setDetail(null);
    }, [filters, loadSummary, loadJobs]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch detail when row selected
        loadDetail(selectedJobId, filters);
    }, [selectedJobId, filters, loadDetail]);

    const handleApplyFilters = (event) => {
        event.preventDefault();
        setFilters({ ...draft, recruiterId: String(draft.recruiterId || '').trim() });
    };

    const handlePageChange = (nextPage) => {
        if (nextPage < 0 || (totalPages > 0 && nextPage >= totalPages)) return;
        loadJobs(filters, nextPage);
    };

    const openDetail = (jobId) => {
        setSelectedJobId(jobId);
    };

    const closeDetail = () => {
        setSelectedJobId(null);
        setDetail(null);
        setDetailError('');
    };

    const rangeStart = page * PAGE_SIZE + (jobs.length ? 1 : 0);
    const rangeEnd = page * PAGE_SIZE + jobs.length;

    const pendingModeration = summaryLoading
        ? '…'
        : formatMetricsNumber(summary?.pendingModerationCount);
    const pendingReports = summaryLoading ? '…' : formatMetricsNumber(summary?.pendingReports);

    return (
        <div className="jpm-page">
            <header className="jpm-page__header">
                <div>
                    <h1 className="jpm-page__title">Giám sát bài đăng</h1>
                    <p className="jpm-page__subtitle">
                        Theo dõi hiệu suất, báo cáo, AI và hàng chờ kiểm duyệt — chỉ xem metrics, không quyết
                        định tại đây.
                    </p>
                </div>
                <div className="jpm-page__meta">
                    <span>
                        Cập nhật lúc:{' '}
                        {summaryLoading ? '…' : formatMetricsDateTime(summary?.lastUpdatedAt)}
                    </span>
                </div>
            </header>

            <form className="jpm-filters" onSubmit={handleApplyFilters}>
                <label>
                    <span>Thời gian</span>
                    <select
                        value={draft.periodDays}
                        onChange={(e) => handlePeriodPreset(e.target.value)}
                    >
                        {PERIOD_PRESET_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    <span>Trạng thái Job</span>
                    <select
                        value={draft.jobStatus}
                        onChange={(e) => patchDraft('jobStatus', e.target.value)}
                    >
                        {JOB_STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value || 'all-job'} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    <span>Kiểm duyệt</span>
                    <select
                        value={draft.moderationStatus}
                        onChange={(e) => patchDraft('moderationStatus', e.target.value)}
                    >
                        {MODERATION_STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value || 'all-mod'} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    <span>Kết quả AI</span>
                    <select
                        value={draft.aiOutcome}
                        onChange={(e) => patchDraft('aiOutcome', e.target.value)}
                    >
                        {AI_OUTCOME_OPTIONS.map((opt) => (
                            <option key={opt.value || 'all-ai'} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    <span>Trạng thái báo cáo</span>
                    <select
                        value={draft.reportStatus}
                        onChange={(e) => patchDraft('reportStatus', e.target.value)}
                    >
                        {REPORT_STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value || 'all-report'} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    <span>ID nhà tuyển dụng</span>
                    <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Nhập ID..."
                        value={draft.recruiterId}
                        onChange={(e) => patchDraft('recruiterId', e.target.value)}
                    />
                </label>
                <label className="jpm-filters__check">
                    <input
                        type="checkbox"
                        checked={draft.suspiciousOnly}
                        onChange={(e) => patchDraft('suspiciousOnly', e.target.checked)}
                    />
                    <span>Chỉ job cảnh báo</span>
                </label>
                <div className="jpm-filters__actions">
                    <button type="submit" className="jpm-btn jpm-btn--primary">
                        Áp dụng
                    </button>
                </div>
            </form>

            {summaryError ? <p className="jpm-error">{summaryError}</p> : null}

            <section className="jpm-queue-strip" aria-label="Điều hướng hàng chờ">
                <article className="jpm-queue-card">
                    <div>
                        <h2>Hàng chờ duyệt tin</h2>
                        <p>
                            <strong>{pendingModeration}</strong> đang chờ
                        </p>
                    </div>
                    <Link to={ROUTES.POST_MANAGER_QUEUE} className="jpm-queue-card__link">
                        Mở hàng chờ →
                    </Link>
                </article>
                <article className="jpm-queue-card">
                    <div>
                        <h2>Báo cáo chờ xử lý</h2>
                        <p>
                            <strong>{pendingReports}</strong> đang chờ
                        </p>
                    </div>
                    <Link to={ROUTES.POST_MANAGER_REPORTS} className="jpm-queue-card__link">
                        Mở hàng chờ báo cáo →
                    </Link>
                </article>
            </section>

            <section className="jpm-kpi-grid" aria-label="KPI giám sát bài đăng">
                <article className="jpm-kpi">
                    <h3>Lượt xem trong kỳ</h3>
                    <p className="jpm-kpi__value">
                        {summaryLoading ? '…' : formatMetricsCompact(summary?.totalViews)}
                    </p>
                </article>
                <article className="jpm-kpi">
                    <h3>Đơn ứng tuyển trong kỳ</h3>
                    <p className="jpm-kpi__value">
                        {summaryLoading ? '…' : formatMetricsCompact(summary?.totalApplications)}
                    </p>
                    <p className="jpm-kpi__sub">
                        Tỉ lệ chuyển đổi:{' '}
                        {summaryLoading ? '…' : formatMetricsRate(summary?.conversionRate)}
                    </p>
                </article>
                <article className="jpm-kpi">
                    <h3>Báo cáo</h3>
                    <div className="jpm-kpi__stack">
                        <span className="jpm-kpi__tone jpm-kpi__tone--danger">
                            {summaryLoading ? '…' : formatMetricsNumber(summary?.pendingReports)} đang chờ
                        </span>
                        <span className="jpm-kpi__tone jpm-kpi__tone--success">
                            {summaryLoading ? '…' : formatMetricsNumber(summary?.resolvedReports)} đã xử lý
                        </span>
                        <span className="jpm-kpi__tone">
                            {summaryLoading ? '…' : formatMetricsNumber(summary?.rejectedReports)} từ chối
                        </span>
                    </div>
                </article>
                <article className="jpm-kpi">
                    <h3>Kiểm duyệt</h3>
                    <div className="jpm-kpi__stack">
                        <span className="jpm-kpi__tone jpm-kpi__tone--warning">
                            {summaryLoading ? '…' : formatMetricsNumber(summary?.pendingModerationCount)}{' '}
                            đang chờ
                        </span>
                        <span className="jpm-kpi__tone jpm-kpi__tone--danger">
                            {summaryLoading ? '…' : formatMetricsNumber(summary?.overdueModerationCount)}{' '}
                            quá hạn
                        </span>
                    </div>
                </article>
                <article className="jpm-kpi">
                    <h3>Rủi ro AI</h3>
                    <div className="jpm-kpi__stack jpm-kpi__stack--wrap">
                        <span className="jpm-kpi__tone jpm-kpi__tone--danger">
                            {summaryLoading ? '…' : formatMetricsNumber(summary?.aiHighRiskCount)} cao
                        </span>
                        <span className="jpm-kpi__tone jpm-kpi__tone--warning">
                            {summaryLoading ? '…' : formatMetricsNumber(summary?.aiMediumRiskCount)} trung bình
                        </span>
                        <span className="jpm-kpi__tone jpm-kpi__tone--success">
                            {summaryLoading ? '…' : formatMetricsNumber(summary?.aiLowRiskCount)} thấp
                        </span>
                        <span className="jpm-kpi__tone">
                            {summaryLoading ? '…' : formatMetricsNumber(summary?.aiFailedCount)} lỗi
                        </span>
                    </div>
                </article>
                <article className="jpm-kpi jpm-kpi--warn">
                    <h3>Job cảnh báo</h3>
                    <p className="jpm-kpi__value">
                        {summaryLoading ? '…' : formatMetricsNumber(summary?.suspiciousJobCount)}
                    </p>
                    <p className="jpm-kpi__sub">Chỉ cảnh báo — không tự phạt</p>
                </article>
            </section>

            <section className="jpm-card">
                <div className="jpm-card__head">
                    <h2>Danh sách giám sát tin tuyển</h2>
                </div>

                {listError ? <p className="jpm-error">{listError}</p> : null}

                <div className="jpm-table-wrap" aria-busy={listLoading}>
                    <table className="jpm-table">
                        <thead>
                            <tr>
                                <th>Tin tuyển</th>
                                <th>NTD / Doanh nghiệp</th>
                                <th>Trạng thái</th>
                                <th>Lượt xem / Ứng tuyển</th>
                                <th>Báo cáo</th>
                                <th>AI / Duyệt</th>
                                <th>Cảnh báo</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {listLoading ? (
                                <tr>
                                    <td colSpan={8}>Đang tải danh sách…</td>
                                </tr>
                            ) : null}
                            {!listLoading && jobs.length === 0 ? (
                                <tr>
                                    <td colSpan={8}>Không có job phù hợp bộ lọc.</td>
                                </tr>
                            ) : null}
                            {!listLoading &&
                                jobs.map((job) => {
                                    const indicators = Array.isArray(job.suspiciousIndicators)
                                        ? job.suspiciousIndicators
                                        : [];
                                    const decisionLabel = formatReviewDecisionLabel(job.reviewDecision);
                                    const reportCount = Number(job.reportCount || 0);
                                    return (
                                        <tr key={job.jobId} className="jpm-table__row">
                                            <td>
                                                <strong>{job.title || `Job #${job.jobId}`}</strong>
                                                <div className="jpm-muted">#{job.jobId}</div>
                                            </td>
                                            <td>
                                                <div>{job.businessName || '—'}</div>
                                                <div className="jpm-muted">
                                                    {job.recruiterName || '—'}
                                                    {job.recruiterId != null ? ` · REC-${job.recruiterId}` : ''}
                                                </div>
                                            </td>
                                            <td>
                                                <span
                                                    className={`jpm-badge jpm-badge--${getJobStatusTone(job.jobStatus)}`}
                                                >
                                                    {formatJobStatusLabel(job.jobStatus)}
                                                </span>
                                            </td>
                                            <td>
                                                {formatMetricsNumber(job.viewCount)} /{' '}
                                                {formatMetricsNumber(job.applicationCount)}
                                                {job.conversionRate != null &&
                                                job.conversionRate !== '' &&
                                                !Number.isNaN(Number(job.conversionRate)) ? (
                                                    <span className="jpm-muted">
                                                        {' '}
                                                        · {formatMetricsRate(job.conversionRate)}
                                                    </span>
                                                ) : null}
                                            </td>
                                            <td>
                                                <span
                                                    className={
                                                        reportCount > 0
                                                            ? 'jpm-report-count jpm-report-count--hot'
                                                            : 'jpm-report-count'
                                                    }
                                                >
                                                    {formatMetricsNumber(job.reportCount)}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="jpm-ai-mod">
                                                    <span
                                                        className={`jpm-badge jpm-badge--${getAiRiskTone(job.aiRiskLevel)}`}
                                                    >
                                                        {formatAiRiskLabel(job.aiRiskLevel)}
                                                    </span>
                                                    <span
                                                        className={`jpm-badge jpm-badge--${getModerationStatusTone(job.moderationStatus)}`}
                                                    >
                                                        {formatModerationStatusLabel(job.moderationStatus)}
                                                    </span>
                                                    {decisionLabel ? (
                                                        <span className="jpm-muted">{decisionLabel}</span>
                                                    ) : null}
                                                </div>
                                            </td>
                                            <td>
                                                {indicators.length > 0 ? (
                                                    <div className="jpm-chip-row">
                                                        {indicators.map((code) => (
                                                            <span
                                                                key={code}
                                                                className="jpm-chip jpm-chip--warn"
                                                                title={code}
                                                            >
                                                                {getSuspiciousIndicatorLabel(code)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="jpm-muted">—</span>
                                                )}
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="jpm-icon-btn"
                                                    aria-label={`Xem chi tiết job ${job.jobId}`}
                                                    onClick={() => openDetail(job.jobId)}
                                                >
                                                    <EyeIcon width={16} height={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>

                <div className="jpm-pager">
                    <span className="jpm-pager__meta">
                        {listLoading
                            ? 'Đang tải…'
                            : `Hiển thị ${rangeStart} - ${rangeEnd} trên tổng ${totalElements}`}
                    </span>
                    <div className="jpm-pager__controls">
                        <button
                            type="button"
                            className="jpm-btn jpm-btn--ghost"
                            disabled={page <= 0 || listLoading}
                            onClick={() => handlePageChange(page - 1)}
                        >
                            Trước
                        </button>
                        <span>
                            {page + 1}/{Math.max(totalPages, 1)}
                        </span>
                        <button
                            type="button"
                            className="jpm-btn jpm-btn--ghost"
                            disabled={page + 1 >= totalPages || listLoading}
                            onClick={() => handlePageChange(page + 1)}
                        >
                            Sau
                        </button>
                    </div>
                </div>
            </section>

            {selectedJobId != null ? (
                <div className="jpm-drawer-overlay" onClick={closeDetail} role="presentation">
                    <aside
                        className="jpm-drawer"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Chi tiết job metrics"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <JobPostMetricsDetailPanel
                            detail={detail}
                            loading={detailLoading}
                            error={detailError}
                            onClose={closeDetail}
                        />
                    </aside>
                </div>
            ) : null}
        </div>
    );
};

export default PostManagerAnalyticsPage;
