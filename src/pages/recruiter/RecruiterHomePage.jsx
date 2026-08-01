import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    MailIcon,
    PlusSquareIcon,
    SparklesIcon,
    UsersIcon,
} from '../../components/common/icons.jsx';
import { useAuth } from '../../contexts/authContext.js';
import { ROUTES, getRecruiterMyJobsPath } from '../../routes/path.js';
import {
    formatCount,
    formatRate,
    getRecruitmentAnalyticsApiErrorMessage,
    loadRecruiterAnalyticsDashboard,
} from '../../services/recruitmentAnalyticsService.js';
import '../../assets/styles/RecruiterDashboardStyle.css';

const QUICK_ACTIONS = [
    {
        to: ROUTES.RECRUITER_CREATE_JOB,
        label: 'Đăng tin mới',
        primary: true,
        Icon: PlusSquareIcon,
    },
    { to: ROUTES.RECRUITER_APPLICANTS, label: 'Ứng viên', Icon: UsersIcon },
    { to: ROUTES.RECRUITER_INVITATIONS, label: 'Lời mời', Icon: MailIcon },
    { to: ROUTES.RECRUITER_AI_SUGGESTIONS, label: 'AI gợi ý', Icon: SparklesIcon },
];

const formatUpdatedAt = (iso) => {
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

const RecruiterHomePage = () => {
    const { auth } = useAuth();
    const displayName = auth?.fullName || auth?.name || auth?.email || 'Nhà tuyển dụng';

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [summary, setSummary] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const data = await loadRecruiterAnalyticsDashboard({
                    includeHistorical: false,
                });
                if (cancelled) return;
                setSummary(data?.summary ?? null);
                setJobs(Array.isArray(data?.jobs) ? data.jobs : []);
                setLastUpdatedAt(data?.lastUpdatedAt ?? null);
            } catch (err) {
                if (cancelled) return;
                const message = getRecruitmentAnalyticsApiErrorMessage(
                    err,
                    'Không tải được tổng quan tuyển dụng.'
                );
                setError(message);
                setSummary(null);
                setJobs([]);
                setLastUpdatedAt(null);
                toast.error(message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    const kpis = [
        {
            key: 'jobs',
            label: 'Số tin đang tuyển',
            value: loading ? '—' : formatCount(jobs.length),
        },
        {
            key: 'apps',
            label: 'Ứng viên mới',
            value: loading ? '—' : formatCount(summary?.applicationCount),
        },
        {
            key: 'views',
            label: 'Lượt xem tin',
            value: loading ? '—' : formatCount(summary?.uniqueCandidateViews),
        },
        {
            key: 'invites',
            label: 'Lời mời đã gửi',
            value: loading ? '—' : formatCount(summary?.invitationSentCount),
        },
        {
            key: 'acceptRate',
            label: 'Tỷ lệ nhận lời mời',
            value: loading ? '—' : formatRate(summary?.invitationAcceptanceRatePercent),
        },
        {
            key: 'hires',
            label: 'Tuyển thành công',
            value: loading ? '—' : formatCount(summary?.successfulHireCount),
        },
    ];

    return (
        <div className="recruiter-dashboard">
            <header className="recruiter-dashboard__header">
                <h1>Xin chào, {displayName}!</h1>
                <p className="recruiter-dashboard__meta">Tổng quan tuyển dụng</p>
                <p className="recruiter-dashboard__period">
                    30 ngày gần nhất · Cập nhật {formatUpdatedAt(lastUpdatedAt)}
                    {loading ? ' · Đang tải…' : ''}
                </p>
            </header>

            {error ? (
                <p className="recruiter-dashboard__error" role="alert">
                    {error}
                </p>
            ) : null}

            <section className="recruiter-dashboard__section" aria-label="Chỉ số tổng quan">
                <div className="recruiter-dashboard__kpi-grid">
                    {kpis.map((item) => (
                        <article key={item.key} className="recruiter-dashboard__kpi">
                            <p className="recruiter-dashboard__kpi-label">{item.label}</p>
                            <p className="recruiter-dashboard__kpi-value">{item.value}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="recruiter-dashboard__section" aria-label="Thao tác nhanh">
                <div className="recruiter-dashboard__section-head">
                    <h2>Thao tác nhanh</h2>
                </div>
                <div className="recruiter-dashboard__actions">
                    {QUICK_ACTIONS.map(({ to, label, primary, Icon }) => (
                        <Link
                            key={to}
                            to={to}
                            className={`recruiter-dashboard__action${
                                primary ? ' recruiter-dashboard__action--primary' : ''
                            }`}
                        >
                            <Icon width={20} height={20} aria-hidden="true" />
                            <span>{label}</span>
                        </Link>
                    ))}
                </div>
            </section>

            <section className="recruiter-dashboard__section" aria-label="Tin đang tuyển">
                <div className="recruiter-dashboard__section-head">
                    <h2>Tin đang tuyển</h2>
                    <Link
                        to={getRecruiterMyJobsPath({ tab: 'open', from: 'overview' })}
                        className="recruiter-dashboard__link"
                    >
                        Xem tất cả tin →
                    </Link>
                </div>

                <div className="recruiter-dashboard__table-wrap">
                    <table className="recruiter-dashboard__table">
                        <thead>
                            <tr>
                                <th>Vị trí tuyển dụng</th>
                                <th>Lượt xem</th>
                                <th>Ứng tuyển</th>
                                <th>Lời mời</th>
                                <th>Chi tiết</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="recruiter-dashboard__empty-row">
                                        Đang tải tin đang tuyển…
                                    </td>
                                </tr>
                            ) : jobs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="recruiter-dashboard__empty-row">
                                        Chưa có tin đang tuyển trong kỳ báo cáo.
                                    </td>
                                </tr>
                            ) : (
                                jobs.map((job) => (
                                    <tr key={job.jobId}>
                                        <td>{job.title || '—'}</td>
                                        <td>{formatCount(job.uniqueCandidateViews)}</td>
                                        <td>{formatCount(job.applicationCount)}</td>
                                        <td>{formatCount(job.invitationSentCount)}</td>
                                        <td>
                                            <Link
                                                to={getRecruiterMyJobsPath({
                                                    tab: 'open',
                                                    jobId: job.jobId,
                                                    from: 'overview',
                                                })}
                                                className="recruiter-dashboard__link"
                                            >
                                                Xem tin →
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="recruiter-dashboard__footer-link">
                    <Link
                        to={`${ROUTES.RECRUITER_ANALYTICS}?from=overview`}
                        className="recruiter-dashboard__link"
                    >
                        Xem thống kê chi tiết →
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default RecruiterHomePage;
