import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import JobStatusBadge from '../../../components/recruiter/jobs/JobStatusBadge.jsx';
import RecruitmentTrendsChart, {
    buildChartPoints,
} from '../../../components/recruiter/analytics/RecruitmentTrendsChart.jsx';
import recruiterJobApi, {
    getRecruiterJobApiErrorMessage,
} from '../../../apis/RecruiterJobApi.jsx';
import {
    formatCount,
    formatRate,
    getRecruitmentAnalyticsApiErrorMessage,
    lastNDays,
    loadJobRecruitmentAnalytics,
} from '../../../services/recruitmentAnalyticsService.js';
import { formatLocation, formatSalaryRange } from '../../../utils/formatters.js';
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

const getWorkLocationLabel = (detail) => {
    if (!detail?.location) return '—';
    const loc = detail.location;
    const parts = [loc.address || loc.name, loc.ward || loc.district, loc.city].filter(
        Boolean
    );
    if (parts.length) return [...new Set(parts)].join(', ');
    return formatLocation(loc);
};

/**
 * AF-1 — thống kê chi tiết một tin.
 * Analytics API + (cách A) getJobDetail để lấy lương / khu vực.
 */
const JobAnalyticsDetailPage = () => {
    const { jobId } = useParams();
    const location = useLocation();
    const analyticsBackPath = location.state?.fromOverview
        ? `${ROUTES.RECRUITER_ANALYTICS}?from=overview`
        : ROUTES.RECRUITER_ANALYTICS;
    const [periodDays, setPeriodDays] = useState(30);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(true);
    const [error, setError] = useState('');
    const [summary, setSummary] = useState(null);
    const [trends, setTrends] = useState([]);
    const [job, setJob] = useState(null);
    const [jobDetail, setJobDetail] = useState(null);
    const [periodStart, setPeriodStart] = useState(null);
    const [periodEnd, setPeriodEnd] = useState(null);
    const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

    useEffect(() => {
        if (!jobId) return undefined;
        let cancelled = false;
        setDetailLoading(true);
        recruiterJobApi
            .getJobDetail(jobId)
            .then((detail) => {
                if (!cancelled) setJobDetail(detail || null);
            })
            .catch((err) => {
                if (!cancelled) {
                    setJobDetail(null);
                    toast.error(
                        getRecruiterJobApiErrorMessage(
                            err,
                            'Không tải được thông tin chi tiết tin.'
                        )
                    );
                }
            })
            .finally(() => {
                if (!cancelled) setDetailLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [jobId]);

    const loadAnalytics = useCallback(async () => {
        if (!jobId) return;
        setLoading(true);
        setError('');
        try {
            const period = lastNDays(periodDays);
            const data = await loadJobRecruitmentAnalytics(jobId, period);
            const nextJob = Array.isArray(data?.jobs) ? data.jobs[0] : null;
            setSummary(data?.summary ?? null);
            setTrends(Array.isArray(data?.trends) ? data.trends : []);
            setJob(nextJob);
            setPeriodStart(data?.periodStart ?? null);
            setPeriodEnd(data?.periodEnd ?? null);
            setLastUpdatedAt(data?.lastUpdatedAt ?? null);
            if (!nextJob) {
                setError('Không tìm thấy tin tuyển dụng hoặc bạn không có quyền xem.');
            }
        } catch (err) {
            const message = getRecruitmentAnalyticsApiErrorMessage(
                err,
                'Không tải được thống kê chi tiết tin.'
            );
            setError(message);
            setSummary(null);
            setTrends([]);
            setJob(null);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [jobId, periodDays]);

    useEffect(() => {
        loadAnalytics();
    }, [loadAnalytics]);

    const { points } = useMemo(
        () => buildChartPoints(trends, periodDays),
        [trends, periodDays]
    );

    const hireRate = formatRate(summary?.applicationToHireRatePercent);
    const applyRate = formatRate(summary?.viewToApplicationRatePercent);
    const createdAt = jobDetail?.createdAt || job?.createdAt;
    const deadline = jobDetail?.applicationDeadline || job?.applicationDeadline;
    const daysLeft = getDaysLeftLabel(deadline);
    const displayTitle = jobDetail?.title || job?.title || 'Thống kê chi tiết';
    const displayStatus = jobDetail?.status || job?.jobStatus;
    const displayUrgent = Boolean(jobDetail?.urgent ?? job?.urgent);
    const salaryLabel = formatSalaryRange(jobDetail?.salaryMin, jobDetail?.salaryMax);

    return (
        <div className="recruiter-analytics recruiter-analytics--detail">
            <Link to={analyticsBackPath} className="recruiter-analytics__back">
                ← Quay lại thống kê
            </Link>

            <header className="recruiter-analytics__detail-header">
                <div className="recruiter-analytics__detail-heading">
                    <h1>{loading && !job && !jobDetail ? 'Đang tải…' : displayTitle}</h1>
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
                        <RecruitmentTrendsChart points={points} />
                    )}
                </section>

                <aside className="recruiter-analytics__side-panel" aria-label="Thông tin tin">
                    <h2>Thông tin tin tuyển dụng</h2>
                    <dl className="recruiter-analytics__meta-list">
                        <div>
                            <dt>Ngày tạo</dt>
                            <dd>{formatDateOnly(createdAt)}</dd>
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
                            <dd>{detailLoading ? '…' : getWorkLocationLabel(jobDetail)}</dd>
                        </div>
                        <div>
                            <dt>Mức lương</dt>
                            <dd>{detailLoading ? '…' : salaryLabel || '—'}</dd>
                        </div>
                    </dl>
                </aside>
            </div>
        </div>
    );
};

export default JobAnalyticsDetailPage;
