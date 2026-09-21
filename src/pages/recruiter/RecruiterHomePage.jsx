import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import recruiterProfileApi from '../../apis/RecruiterProfileApi.jsx';
import {
    BriefcaseIcon,
    ChartIcon,
    CheckCircleIcon,
    EyeIcon,
    MailIcon,
    PlusSquareIcon,
    UserPlusIcon,
    UsersIcon,
} from '../../components/common/icons.jsx';
import { useAuth } from '../../contexts/authContext.js';
import { ROUTES, getRecruiterMyJobsPath } from '../../routes/path.js';
import {
    formatCount,
    getJobsList,
    getRecruitmentAnalyticsApiErrorMessage,
    loadRecruiterAnalyticsDashboard,
} from '../../services/recruitmentAnalyticsService.js';
import { getDeadlineCountdownLabel } from '../../utils/jobDeadlineDisplay.js';
import {
    isFullyBusinessVerified,
    needsBusinessLicenseTopUp,
    resolveRequiresBusinessLicense,
} from '../../utils/verificationDisplay.js';
import { mapBusinessTypeOptions } from '../../utils/businessTypeDisplay.js';
import '../../assets/styles/RecruiterDashboardStyle.css';

const withOverviewFrom = (path) => {
    const sep = path.includes('?') ? '&' : '?';
    return `${path}${sep}from=overview`;
};

const QUICK_ACTIONS = [
    {
        to: withOverviewFrom(ROUTES.RECRUITER_CREATE_JOB),
        label: 'Đăng tin mới',
        desc: 'Tìm nhân viên nhanh chóng',
        Icon: PlusSquareIcon,
        tone: 'blue',
        cta: 'Bắt đầu ngay',
    },
    {
        to: withOverviewFrom(ROUTES.RECRUITER_APPLICANTS),
        label: 'Xem ứng viên',
        desc: 'Quản lý hồ sơ ứng tuyển',
        Icon: UsersIcon,
        tone: 'gray',
        ctaLink: 'Xem ngay',
        ctaTone: 'blue',
    },
    {
        to: withOverviewFrom(ROUTES.RECRUITER_INVITATIONS),
        label: 'Xem lời mời',
        desc: 'Theo dõi lời mời đã gửi',
        Icon: MailIcon,
        tone: 'blue',
        ctaLink: 'Xem ngay',
    },
];

const isPendingManualVerification = (status) =>
    status === 'BUSINESS_MANUALLY' || status === 'CCCD_MANUALLY';

const isRejectedVerification = (status) =>
    status === 'BUSINESS_REJECTED' || status === 'CCCD_REJECTED';

const JOBS_PREVIEW_LIMIT = 5;

const getDeadlineMs = (job) => {
    if (!job?.applicationDeadline) return Number.POSITIVE_INFINITY;
    const ms = new Date(job.applicationDeadline).getTime();
    return Number.isNaN(ms) ? Number.POSITIVE_INFINITY : ms;
};

const getCreatedMs = (job) => {
    if (!job?.createdAt) return 0;
    const ms = new Date(job.createdAt).getTime();
    return Number.isNaN(ms) ? 0 : ms;
};

/** Preview overview: gần hết hạn trước, cùng hạn → tin mới hơn. */
const getPreviewJobs = (jobList) =>
    [...jobList]
        .sort((a, b) => {
            const deadlineDiff = getDeadlineMs(a) - getDeadlineMs(b);
            if (deadlineDiff !== 0) return deadlineDiff;
            return getCreatedMs(b) - getCreatedMs(a);
        })
        .slice(0, JOBS_PREVIEW_LIMIT);

const RecruiterHomePage = () => {
    const { auth } = useAuth();
    const displayName = auth?.fullName || auth?.name || auth?.email || 'Nhà tuyển dụng';

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [summary, setSummary] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [badge, setBadge] = useState(null);
    const [verificationStatus, setVerificationStatus] = useState(null);
    const [businessType, setBusinessType] = useState(null);
    const [requiresBusinessLicense, setRequiresBusinessLicense] = useState(undefined);
    const [businessTypeOptions, setBusinessTypeOptions] = useState([]);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const [data, profile, rawBusinessTypes] = await Promise.all([
                    loadRecruiterAnalyticsDashboard({ includeHistorical: false }),
                    recruiterProfileApi.getProfile().catch(() => null),
                    recruiterProfileApi.getBusinessTypes().catch(() => []),
                ]);
                if (cancelled) return;
                setSummary(data?.summary ?? null);
                setJobs(getJobsList(data));
                setBadge(profile?.badge ?? null);
                setVerificationStatus(profile?.verificationStatus ?? null);
                setBusinessType(profile?.businessType ?? null);
                setRequiresBusinessLicense(
                    typeof profile?.requiresBusinessLicense === 'boolean'
                        ? profile.requiresBusinessLicense
                        : undefined
                );
                setBusinessTypeOptions(mapBusinessTypeOptions(rawBusinessTypes));
            } catch (err) {
                if (cancelled) return;
                const message = getRecruitmentAnalyticsApiErrorMessage(
                    err,
                    'Không tải được tổng quan tuyển dụng.'
                );
                setError(message);
                setSummary(null);
                setJobs([]);
                setBadge(null);
                setVerificationStatus(null);
                setBusinessType(null);
                setRequiresBusinessLicense(undefined);
                setBusinessTypeOptions([]);
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

    const needsLicense = resolveRequiresBusinessLicense({
        businessType,
        typeOptions: businessTypeOptions,
        profileRequiresBusinessLicense: requiresBusinessLicense,
    });
    const isVerified = isFullyBusinessVerified({
        badge,
        verificationStatus,
        needsLicense,
    });
    const needsLicenseTopUp = needsBusinessLicenseTopUp({
        verificationStatus,
        needsLicense,
        badge,
    });
    const previewJobs = getPreviewJobs(jobs);

    const kpis = [
        {
            key: 'jobs',
            label: 'Số tin đang tuyển',
            value: loading ? '—' : formatCount(summary?.activeJobCount),
            Icon: BriefcaseIcon,
            tone: 'blue',
        },
        {
            key: 'remaining',
            label: 'Vị trí còn trống',
            value: loading ? '—' : formatCount(summary?.remainingHeadcount),
            Icon: UserPlusIcon,
            tone: 'green',
        },
        {
            key: 'pending',
            label: 'Hồ sơ chờ xử lý',
            value: loading ? '—' : formatCount(summary?.pendingApplicationCount),
            Icon: EyeIcon,
            tone: 'blue',
        },
        {
            key: 'hires',
            label: 'Đã tuyển (30 ngày)',
            value: loading ? '—' : formatCount(summary?.hiredInPeriodCount),
            Icon: CheckCircleIcon,
            tone: 'gold',
        },
    ];

    return (
        <div className="recruiter-dashboard">
            <header className="recruiter-dashboard__header">
                <h1 className="recruiter-dashboard__greeting">
                    Xin chào, {displayName}!
                    {isVerified ? (
                        <span className="recruiter-dashboard__badge recruiter-dashboard__badge--verified">
                            <CheckCircleIcon width={14} height={14} aria-hidden="true" />
                            Đã xác thực
                        </span>
                    ) : isPendingManualVerification(verificationStatus) ? (
                        <span className="recruiter-dashboard__badge recruiter-dashboard__badge--muted">
                            Đang chờ duyệt
                        </span>
                    ) : (
                        <>
                            <span className="recruiter-dashboard__badge recruiter-dashboard__badge--muted">
                                {isRejectedVerification(verificationStatus)
                                    ? 'Xác minh chưa đạt'
                                    : needsLicenseTopUp
                                      ? 'Cần xác thực GPKD'
                                      : 'Chưa xác thực'}
                            </span>
                            <Link
                                to={
                                    isRejectedVerification(verificationStatus)
                                        ? `${ROUTES.RECRUITER_VERIFICATION}?retry=1`
                                        : ROUTES.RECRUITER_VERIFICATION
                                }
                                className="recruiter-dashboard__badge recruiter-dashboard__badge--verify-cta"
                            >
                                {isRejectedVerification(verificationStatus)
                                    ? 'Thử lại ngay'
                                    : needsLicenseTopUp
                                      ? 'Xác thực Giấy phép kinh doanh'
                                      : 'Đề xuất: Xác minh ngay'}
                            </Link>
                        </>
                    )}
                </h1>
                <p className="recruiter-dashboard__meta">Tổng quan tuyển dụng</p>
            </header>

            {error ? (
                <p className="recruiter-dashboard__error" role="alert">
                    {error}
                </p>
            ) : null}

            <section className="recruiter-dashboard__section" aria-label="Chỉ số tổng quan">
                <div className="recruiter-dashboard__kpi-grid">
                    {kpis.map(({ key, label, value, Icon, tone }) => (
                        <article key={key} className="recruiter-dashboard__kpi">
                            <span
                                className={`recruiter-dashboard__kpi-icon recruiter-dashboard__kpi-icon--${tone}`}
                                aria-hidden="true"
                            >
                                <Icon width={22} height={22} />
                            </span>
                            <div className="recruiter-dashboard__kpi-text">
                                <p className="recruiter-dashboard__kpi-value">{value}</p>
                                <p className="recruiter-dashboard__kpi-label">{label}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <section className="recruiter-dashboard__split" aria-label="Thao tác và tin đang tuyển">
                <div className="recruiter-dashboard__panel recruiter-dashboard__panel--actions">
                    <div className="recruiter-dashboard__section-head">
                        <h2>Thao tác nhanh</h2>
                    </div>
                    <div className="recruiter-dashboard__actions">
                        {QUICK_ACTIONS.map(({ to, label, desc, Icon, tone, cta, ctaLink, ctaTone }) => (
                            <Link key={to} to={to} className="recruiter-dashboard__action">
                                <span
                                    className={`recruiter-dashboard__action-icon recruiter-dashboard__action-icon--${tone}`}
                                    aria-hidden="true"
                                >
                                    <Icon width={20} height={20} />
                                </span>
                                <strong className="recruiter-dashboard__action-label">{label}</strong>
                                <span className="recruiter-dashboard__action-desc">{desc}</span>
                                <span className="recruiter-dashboard__action-footer">
                                    {cta ? (
                                        <span className="recruiter-dashboard__action-cta">{cta}</span>
                                    ) : null}
                                    {ctaLink ? (
                                        <span
                                            className={`recruiter-dashboard__action-cta-link recruiter-dashboard__action-cta-link--${
                                                ctaTone || tone
                                            }`}
                                        >
                                            {ctaLink}
                                        </span>
                                    ) : null}
                                </span>
                            </Link>
                        ))}
                        <Link
                            to={`${ROUTES.RECRUITER_ANALYTICS}?from=overview`}
                            className="recruiter-dashboard__action"
                        >
                            <span
                                className="recruiter-dashboard__action-icon recruiter-dashboard__action-icon--blue"
                                aria-hidden="true"
                            >
                                <ChartIcon width={20} height={20} />
                            </span>
                            <strong className="recruiter-dashboard__action-label">
                                Xem thống kê chi tiết
                            </strong>
                            <span className="recruiter-dashboard__action-desc">
                                Phân tích hiệu quả tuyển dụng
                            </span>
                            <span className="recruiter-dashboard__action-footer">
                                <span className="recruiter-dashboard__action-cta-link recruiter-dashboard__action-cta-link--blue">
                                    Xem ngay
                                </span>
                            </span>
                        </Link>
                    </div>
                </div>

                <div className="recruiter-dashboard__panel recruiter-dashboard__panel--jobs-col">
                    <div className="recruiter-dashboard__section-head">
                        <div className="recruiter-dashboard__section-title">
                            <h2>Tin đang tuyển</h2>
                            {!loading && summary?.activeJobCount > 0 ? (
                                <span className="recruiter-dashboard__count-chip">
                                    {formatCount(summary.activeJobCount)} Active
                                </span>
                            ) : null}
                        </div>
                        <Link
                            to={getRecruiterMyJobsPath({ tab: 'open', from: 'overview' })}
                            className="recruiter-dashboard__link"
                        >
                            Xem tất cả →
                        </Link>
                    </div>

                    <div className="recruiter-dashboard__jobs-box">
                        {loading ? (
                            <p className="recruiter-dashboard__job-empty">Đang tải tin đang tuyển…</p>
                        ) : previewJobs.length === 0 ? (
                            <p className="recruiter-dashboard__job-empty">
                                Chưa có tin đang tuyển trong kỳ báo cáo.
                            </p>
                        ) : (
                            previewJobs.map((job) => {
                                const daysLeft = getDeadlineCountdownLabel(job.applicationDeadline);
                                return (
                                    <article key={job.jobId} className="recruiter-dashboard__job-row">
                                        <div className="recruiter-dashboard__job-main">
                                            <div className="recruiter-dashboard__job-top">
                                                <h3 className="recruiter-dashboard__job-title">
                                                    {job.title || '—'}
                                                </h3>
                                                <span className="recruiter-dashboard__job-status">
                                                    Đang tuyển
                                                </span>
                                            </div>
                                            <div className="recruiter-dashboard__job-chips">
                                                <span className="recruiter-dashboard__job-chip recruiter-dashboard__job-chip--green">
                                                    {formatCount(job.pendingApplicationCount)} chờ xử lý
                                                </span>
                                                <span className="recruiter-dashboard__job-chip recruiter-dashboard__job-chip--blue">
                                                    {formatCount(job.hiredCount)}/
                                                    {formatCount(job.requiredHeadcount)} đã tuyển
                                                </span>
                                                {daysLeft ? (
                                                    <span className="recruiter-dashboard__job-chip recruiter-dashboard__job-chip--amber">
                                                        {daysLeft}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                        <Link
                                            to={getRecruiterMyJobsPath({
                                                tab: 'open',
                                                jobId: job.jobId,
                                                from: 'overview',
                                            })}
                                            className="recruiter-dashboard__link recruiter-dashboard__job-link"
                                        >
                                            Xem tin →
                                        </Link>
                                    </article>
                                );
                            })
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default RecruiterHomePage;
