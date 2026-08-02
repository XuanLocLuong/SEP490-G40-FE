import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import RecruitmentTrendsChart, {
    buildChartPoints,
} from '../../../components/recruiter/analytics/RecruitmentTrendsChart.jsx';
import {
    ROUTES,
    getRecruiterJobAnalyticsPath,
} from '../../../routes/path.js';
import {
    formatCount,
    formatRate,
    getRecruitmentAnalyticsApiErrorMessage,
    lastNDays,
    loadRecruiterAnalyticsDashboard,
} from '../../../services/recruitmentAnalyticsService.js';
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

const RecruiterAnalyticsPage = () => {
    const [searchParams] = useSearchParams();
    /** Chỉ hiện khi vào từ Tổng quan (?from=overview). */
    const showBackToOverview = searchParams.get('from') === 'overview';

    const [periodDays, setPeriodDays] = useState(30);
    const [includeHistorical, setIncludeHistorical] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [summary, setSummary] = useState(null);
    const [trends, setTrends] = useState([]);
    const [jobs, setJobs] = useState([]);
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
            });
            setSummary(data?.summary ?? null);
            setTrends(Array.isArray(data?.trends) ? data.trends : []);
            setJobs(Array.isArray(data?.jobs) ? data.jobs : []);
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
            setTrends([]);
            setJobs([]);
            setPeriodStart(null);
            setPeriodEnd(null);
            setLastUpdatedAt(null);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [periodDays, includeHistorical]);

    useEffect(() => {
        load();
    }, [load]);

    const { points } = useMemo(
        () => buildChartPoints(trends, periodDays),
        [trends, periodDays]
    );

    const hireRate = formatRate(summary?.applicationToHireRatePercent);
    const applyRate = formatRate(summary?.viewToApplicationRatePercent);

    return (
        <div className="recruiter-analytics">
            {showBackToOverview ? (
                <Link to={ROUTES.RECRUITER_HOME} className="recruiter-back-overview">
                    ← Quay lại tổng quan
                </Link>
            ) : null}

            <header className="recruiter-analytics__header">
                <h1>Thống kê tuyển dụng</h1>
                <p className="recruiter-analytics__meta">
                    Kỳ {formatPeriodDay(periodStart)} – {formatPeriodDay(periodEnd)}
                    {' · '}
                    Cập nhật {formatDateTime(lastUpdatedAt)}
                    {loading ? ' · Đang tải…' : ''}
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
                    <h2>Lượt xem tin</h2>
                    <p className="recruiter-analytics__card-value">
                        {loading ? '—' : formatCount(summary?.uniqueCandidateViews)}
                    </p>
                </article>

                <article className="recruiter-analytics__card">
                    <h2>Lượt ứng tuyển</h2>
                    <p className="recruiter-analytics__card-value">
                        {loading ? '—' : formatCount(summary?.applicationCount)}
                    </p>
                    <p className="recruiter-analytics__card-sub">
                        Tỷ lệ ứng tuyển: {loading ? '—' : applyRate}
                    </p>
                </article>

                <article className="recruiter-analytics__card">
                    <h2>Lời mời đã gửi</h2>
                    <p className="recruiter-analytics__card-value">
                        {loading ? '—' : formatCount(summary?.invitationSentCount)}
                    </p>
                    <p className="recruiter-analytics__card-sub">
                        Nhận: {loading ? '—' : formatCount(summary?.acceptedInvitationCount)}
                        {' · '}
                        Từ chối: {loading ? '—' : formatCount(summary?.rejectedInvitationCount)}
                        {' · '}
                        Hết hạn: {loading ? '—' : formatCount(summary?.expiredInvitationCount)}
                    </p>
                </article>

                <article className="recruiter-analytics__card">
                    <h2>Tỷ lệ tuyển thành công</h2>
                    <p className="recruiter-analytics__card-value">
                        {loading ? '—' : hireRate}
                    </p>
                </article>
            </section>

            <section className="recruiter-analytics__panel" aria-label="Xu hướng">
                <h2>Xu hướng tuyển dụng</h2>
                {loading ? (
                    <div className="recruiter-analytics__chart-empty">Đang tải biểu đồ…</div>
                ) : (
                    <RecruitmentTrendsChart points={points} />
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
                                <th>Tin tuyển dụng</th>
                                <th>Lượt xem</th>
                                <th>Ứng tuyển</th>
                                <th>Đã tuyển</th>
                                <th>Tỷ lệ tuyển thành công</th>
                                <th>Chi tiết</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="recruiter-analytics__empty-row">
                                        Đang tải…
                                    </td>
                                </tr>
                            ) : jobs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="recruiter-analytics__empty-row">
                                        Không có tin phù hợp bộ lọc.
                                    </td>
                                </tr>
                            ) : (
                                jobs.map((job) => (
                                    <tr key={job.jobId}>
                                        <td>
                                            <div className="recruiter-analytics__job-title">
                                                {job.title || '—'}
                                            </div>
                                            {job.jobStatus ? (
                                                <div className="recruiter-analytics__job-status">
                                                    {job.jobStatus}
                                                </div>
                                            ) : null}
                                        </td>
                                        <td>{formatCount(job.uniqueCandidateViews)}</td>
                                        <td>{formatCount(job.applicationCount)}</td>
                                        <td>{formatCount(job.successfulHireCount)}</td>
                                        <td>
                                            {formatRate(job.applicationToHireRatePercent)}
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
            </section>
        </div>
    );
};

export default RecruiterAnalyticsPage;
