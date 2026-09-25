import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import RecruiterBackLink from '../../../components/recruiter/RecruiterBackLink.jsx';
import RecruitmentTrendsChart from '../../../components/recruiter/analytics/RecruitmentTrendsChart.jsx';
import JobStatusBadge from '../../../components/recruiter/jobs/JobStatusBadge.jsx';
import RecruitmentPagination from '../../../components/recruiter/RecruitmentPagination.jsx';
import {
    ROUTES,
    getRecruiterJobAnalyticsPath,
} from '../../../routes/path.js';
import {
    formatCount,
    getJobsList,
    getRecruitmentAnalyticsApiErrorMessage,
    getTrendPoints,
    lastNDays,
    loadRecruiterAnalyticsDashboard,
} from '../../../services/recruitmentAnalyticsService.js';
import { RECRUITMENT_PAGE_SIZE } from '../../../utils/recruitmentPagination.js';
import { RECRUITER_BACK_LABELS } from '../../../utils/recruiterBackNav.js';
import '../../../assets/styles/RecruiterAnalyticsStyle.css';

const PERIOD_CHIPS = [
    { days: 7, label: '7 ngày' },
    { days: 30, label: '30 ngày' },
    { days: 90, label: '90 ngày' },
];

const formatDateTime = (iso) => {
    if (!iso) return '—';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const formatPeriodDay = (iso) => {
    if (!iso) return '—';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

const formatProgress = (hired, required) => {
    const h = formatCount(hired);
    const r = formatCount(required);
    if (r === 0) return `${h}/—`;
    return `${h}/${r}`;
};

const RecruiterAnalyticsPage = () => {
    const [searchParams] = useSearchParams();
    const showBackToOverview = searchParams.get('from') === 'overview';

    const [periodDays, setPeriodDays] = useState(30);
    const [includeHistorical, setIncludeHistorical] = useState(false);
    const [page, setPage] = useState(0);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [summary, setSummary] = useState(null);
    const [trendPoints, setTrendPoints] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [periodStart, setPeriodStart] = useState(null);
    const [periodEnd, setPeriodEnd] = useState(null);
    const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const period = lastNDays(periodDays);
            const data = await loadRecruiterAnalyticsDashboard({
                ...period,
                includeHistorical,
                page,
            });
            setSummary(data?.summary ?? null);
            setTrendPoints(getTrendPoints(data));
            setJobs(getJobsList(data));
            setTotalPages(formatCount(data?.jobs?.totalPages));
            setPeriodStart(data?.periodStart ?? null);
            setPeriodEnd(data?.periodEnd ?? null);
            setLastUpdatedAt(data?.lastUpdatedAt ?? null);
        } catch (err) {
            const message = getRecruitmentAnalyticsApiErrorMessage(
                err,
                'Không tải được thống kê tuyển dụng.'
            );
            setError(message);
            setSummary(null);
            setTrendPoints([]);
            setJobs([]);
            setTotalPages(0);
            setPeriodStart(null);
            setPeriodEnd(null);
            setLastUpdatedAt(null);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [periodDays, includeHistorical, page]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        setPage(0);
    }, [periodDays, includeHistorical]);

    const handlePageChange = (nextPage) => {
        setPage(nextPage);
    };

    return (
        <div className="recruiter-analytics">
            {showBackToOverview ? (
                <RecruiterBackLink
                    to={ROUTES.RECRUITER_HOME}
                    label={RECRUITER_BACK_LABELS.overview}
                />
            ) : null}

            <header className="recruiter-analytics__header">
                <h1>Thống kê tuyển dụng</h1>
                <p className="recruiter-analytics__meta">
                    Kỳ {formatPeriodDay(periodStart)} – {formatPeriodDay(periodEnd)}
                </p>
            </header>

            {error ? (
                <p className="recruiter-analytics__error" role="alert">
                    {error}
                </p>
            ) : null}

            <div className="recruiter-analytics__filters" aria-label="Bộ lọc thống kê">
                <div className="recruiter-analytics__chips">
                    {PERIOD_CHIPS.map((chip) => (
                        <button
                            key={chip.days}
                            type="button"
                            className={`recruiter-analytics__chip${
                                periodDays === chip.days ? ' is-active' : ''
                            }`}
                            onClick={() => setPeriodDays(chip.days)}
                        >
                            {chip.label}
                        </button>
                    ))}
                </div>

                <label className="recruiter-analytics__check">
                    <input
                        type="checkbox"
                        checked={includeHistorical}
                        onChange={(e) => setIncludeHistorical(e.target.checked)}
                    />
                    Bao gồm tin cũ
                </label>
            </div>

            <section
                className="recruiter-analytics__cards recruiter-analytics__cards--4"
                aria-label="Tóm tắt"
            >
                <article className="recruiter-analytics__card">
                    <h2>Tin đang tuyển</h2>
                    <p className="recruiter-analytics__card-value">
                        {loading ? '—' : formatCount(summary?.activeJobCount)}
                    </p>
                </article>

                <article className="recruiter-analytics__card">
                    <h2>Cần tuyển thêm</h2>
                    <p className="recruiter-analytics__card-value">
                        {loading
                            ? '—'
                            : formatProgress(
                                  summary?.remainingHeadcount,
                                  summary?.requiredHeadcount
                              )}
                    </p>
                    <p className="recruiter-analytics__card-sub">
                        người (còn thiếu / tổng chỉ tiêu, dựa trên các tin đang tuyển)
                    </p>
                </article>

                <article className="recruiter-analytics__card">
                    <h2>Hồ sơ chờ xử lý</h2>
                    <p className="recruiter-analytics__card-value">
                        {loading ? '—' : formatCount(summary?.pendingApplicationCount)}
                    </p>
                </article>

                <article className="recruiter-analytics__card">
                    <h2>Đã tuyển trong kỳ</h2>
                    <p className="recruiter-analytics__card-value">
                        {loading ? '—' : formatCount(summary?.hiredInPeriodCount)}
                    </p>
                </article>
            </section>

            <section className="recruiter-analytics__panel" aria-label="Xu hướng">
                <h2>Xu hướng tuyển dụng</h2>
                {loading ? (
                    <div className="recruiter-analytics__chart-empty">Đang tải biểu đồ…</div>
                ) : (
                    <RecruitmentTrendsChart points={trendPoints} />
                )}
            </section>

            <section className="recruiter-analytics__panel" aria-label="Thống kê chi tiết">
                <div className="recruiter-analytics__panel-head">
                    <h2>Thống kê chi tiết</h2>
                </div>

                <div className="recruiter-analytics__table-wrap">
                    <table className="recruiter-analytics__table">
                        <thead>
                            <tr>
                                <th className="recruiter-analytics__table-stt">STT</th>
                                <th>Tin tuyển dụng</th>
                                <th>Chờ xử lý</th>
                                <th>Số lượng người ứng tuyển</th>
                                <th>Đã tuyển (kỳ)</th>
                                <th>Tiến độ</th>
                                <th>Chi tiết</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="recruiter-analytics__empty-row">
                                        Đang tải…
                                    </td>
                                </tr>
                            ) : jobs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="recruiter-analytics__empty-row">
                                        Không có tin phù hợp bộ lọc.
                                    </td>
                                </tr>
                            ) : (
                                jobs.map((job, index) => (
                                    <tr key={job.jobId}>
                                        <td className="recruiter-analytics__table-stt">
                                            {page * RECRUITMENT_PAGE_SIZE + index + 1}
                                        </td>
                                        <td>
                                            <div className="recruiter-analytics__job-title">
                                                {job.title || '—'}
                                            </div>
                                            {job.jobStatus ? (
                                                <div className="recruiter-analytics__job-status">
                                                    <JobStatusBadge status={job.jobStatus} />
                                                </div>
                                            ) : null}
                                        </td>
                                        <td>{formatCount(job.pendingApplicationCount)}</td>
                                        <td>{formatCount(job.newApplicationInPeriod)}</td>
                                        <td>{formatCount(job.hiredInPeriod)}</td>
                                        <td>
                                            {formatProgress(job.hiredCount, job.requiredHeadcount)}
                                        </td>
                                        <td>
                                            <Link
                                                to={getRecruiterJobAnalyticsPath(job.jobId)}
                                                state={
                                                    showBackToOverview
                                                        ? { fromOverview: true }
                                                        : undefined
                                                }
                                                className="recruiter-analytics__table-action"
                                            >
                                                Xem tin này
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <RecruitmentPagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    loading={loading}
                    ariaLabel="Phân trang thống kê tin tuyển dụng"
                />
            </section>
        </div>
    );
};

export default RecruiterAnalyticsPage;
