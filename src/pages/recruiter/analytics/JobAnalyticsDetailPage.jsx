import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import JobStatusBadge from '../../../components/recruiter/jobs/JobStatusBadge.jsx';
import RecruitmentTrendsChart from '../../../components/recruiter/analytics/RecruitmentTrendsChart.jsx';
import {
    formatCount,
    getRecruitmentAnalyticsApiErrorMessage,
    getTrendPoints,
    lastNDays,
    loadJobRecruitmentAnalytics,
} from '../../../services/recruitmentAnalyticsService.js';
import { formatSalaryRange } from '../../../utils/formatters.js';
import {
    ROUTES,
    getRecruiterApplicantsPath,
    getRecruiterInvitationsPath,
} from '../../../routes/path.js';
import '../../../assets/styles/RecruiterAnalyticsStyle.css';
import '../../../assets/styles/JobPostStyle.css';

const DETAIL_PERIOD_CHIPS = [
    { days: 7, label: '7 ngày' },
    { days: 30, label: '30 ngày' },
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

const formatDateOnly = (iso) => {
    if (!iso) return '—';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

const getDaysLeftLabel = (deadline) => {
    if (!deadline) return null;
    const end = new Date(deadline);
    if (Number.isNaN(end.getTime())) return null;
    const diff = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Đã hết hạn';
    if (diff === 0) return 'Hết hạn hôm nay';
    return `Còn ${diff} ngày`;
};

/** AF-1 — thống kê chi tiết một tin (1 API: jobMeta + summary + trend). */
const JobAnalyticsDetailPage = () => {
    const { jobId } = useParams();
    const location = useLocation();
    const analyticsBackPath = location.state?.fromOverview
        ? `${ROUTES.RECRUITER_ANALYTICS}?from=overview`
        : ROUTES.RECRUITER_ANALYTICS;
    const [periodDays, setPeriodDays] = useState(30);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [summary, setSummary] = useState(null);
    const [trendPoints, setTrendPoints] = useState([]);
    const [jobMeta, setJobMeta] = useState(null);
    const [periodStart, setPeriodStart] = useState(null);
    const [periodEnd, setPeriodEnd] = useState(null);
    const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

    const loadAnalytics = useCallback(async () => {
        if (!jobId) return;
        setLoading(true);
        setError('');
        try {
            const period = lastNDays(periodDays);
            const data = await loadJobRecruitmentAnalytics(jobId, period);
            setJobMeta(data?.jobMeta ?? null);
            setSummary(data?.summary ?? null);
            setTrendPoints(getTrendPoints(data));
            setPeriodStart(data?.periodStart ?? null);
            setPeriodEnd(data?.periodEnd ?? null);
            setLastUpdatedAt(data?.lastUpdatedAt ?? null);
            if (!data?.jobMeta) {
                setError('Không tìm thấy tin tuyển dụng hoặc bạn không có quyền xem.');
            }
        } catch (err) {
            const message = getRecruitmentAnalyticsApiErrorMessage(
                err,
                'Không tải được thống kê chi tiết tin.'
            );
            setError(message);
            setJobMeta(null);
            setSummary(null);
            setTrendPoints([]);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [jobId, periodDays]);

    useEffect(() => {
        loadAnalytics();
    }, [loadAnalytics]);

    const deadline = jobMeta?.applicationDeadline;
    const daysLeft = getDaysLeftLabel(deadline);
    const displayTitle = jobMeta?.title || 'Thống kê chi tiết';
    const displayStatus = jobMeta?.status;
    const displayUrgent = Boolean(jobMeta?.urgent);
    const salaryLabel = formatSalaryRange(jobMeta?.salaryMin, jobMeta?.salaryMax);

    return (
        <div className="recruiter-analytics recruiter-analytics--detail">
            <Link to={analyticsBackPath} className="recruiter-analytics__back">
                ← Quay lại thống kê
            </Link>

            <header className="recruiter-analytics__detail-header">
                <div className="recruiter-analytics__detail-heading">
                    <h1>{loading && !jobMeta ? 'Đang tải…' : displayTitle}</h1>
                    <div className="recruiter-analytics__detail-badges">
                        {displayStatus ? <JobStatusBadge status={displayStatus} /> : null}
                        {displayUrgent ? (
                            <span className="recruiter-analytics__urgent-badge">Tuyển gấp</span>
                        ) : null}
                    </div>
                    <p className="recruiter-analytics__meta">
                        Kỳ {formatDateOnly(periodStart)} – {formatDateOnly(periodEnd)}
                        {' · '}
                        Cập nhật {formatDateTime(lastUpdatedAt)}
                    </p>
                </div>

                {jobId ? (
                    <div className="recruiter-analytics__detail-actions">
                        <Link
                            to={getRecruiterApplicantsPath(jobId, { from: 'analytics' })}
                            state={location.state}
                            className="recruiter-analytics__btn recruiter-analytics__btn--primary"
                        >
                            Xem ứng viên
                        </Link>
                        <Link
                            to={getRecruiterInvitationsPath(jobId, { from: 'analytics' })}
                            state={location.state}
                            className="recruiter-analytics__btn recruiter-analytics__btn--ghost"
                        >
                            Xem lời mời
                        </Link>
                    </div>
                ) : null}
            </header>

            {error ? (
                <p className="recruiter-analytics__error" role="alert">
                    {error}
                </p>
            ) : null}

            <section className="recruiter-analytics__cards recruiter-analytics__cards--4" aria-label="KPI tin">
                <article className="recruiter-analytics__card">
                    <h2>Chỉ tiêu</h2>
                    <p className="recruiter-analytics__card-value">
                        {loading ? '—' : formatCount(summary?.requiredHeadcount)}
                    </p>
                </article>
                <article className="recruiter-analytics__card">
                    <h2>Đã tuyển</h2>
                    <p className="recruiter-analytics__card-value">
                        {loading ? '—' : formatCount(summary?.hiredCount)}
                    </p>
                </article>
                <article className="recruiter-analytics__card">
                    <h2>Còn thiếu</h2>
                    <p className="recruiter-analytics__card-value">
                        {loading ? '—' : formatCount(summary?.remainingHeadcount)}
                    </p>
                </article>
                <article className="recruiter-analytics__card">
                    <h2>Hồ sơ chờ xử lý</h2>
                    <p className="recruiter-analytics__card-value">
                        {loading ? '—' : formatCount(summary?.pendingApplicationCount)}
                    </p>
                </article>
            </section>

            <div className="recruiter-analytics__detail-grid">
                <section className="recruiter-analytics__panel" aria-label="Xu hướng">
                    <div className="recruiter-analytics__panel-head">
                        <h2>Biểu đồ xu hướng tuyển dụng</h2>
                        <div className="recruiter-analytics__chips">
                            {DETAIL_PERIOD_CHIPS.map((chip) => (
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
                    </div>
                    {loading ? (
                        <div className="recruiter-analytics__chart-empty">Đang tải biểu đồ…</div>
                    ) : (
                        <RecruitmentTrendsChart points={trendPoints} />
                    )}
                </section>

                <aside className="recruiter-analytics__side-panel" aria-label="Thông tin tin">
                    <h2>Thông tin tin tuyển dụng</h2>
                    <dl className="recruiter-analytics__meta-list">
                        <div>
                            <dt>Ngày tạo</dt>
                            <dd>{formatDateOnly(jobMeta?.createdAt)}</dd>
                        </div>
                        <div>
                            <dt>Hạn nộp hồ sơ</dt>
                            <dd>
                                {formatDateOnly(deadline)}
                                {daysLeft ? ` (${daysLeft})` : ''}
                            </dd>
                        </div>
                        <div>
                            <dt>Khu vực làm việc</dt>
                            <dd>{loading ? '…' : jobMeta?.locationLabel || '—'}</dd>
                        </div>
                        <div>
                            <dt>Mức lương</dt>
                            <dd>{loading ? '…' : salaryLabel || '—'}</dd>
                        </div>
                    </dl>
                </aside>
            </div>
        </div>
    );
};

export default JobAnalyticsDetailPage;
