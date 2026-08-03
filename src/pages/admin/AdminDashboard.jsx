import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import {
    getApiErrorMessage,
    getPlatformMonitoring,
} from '../../apis/AdminPlatformMonitoringApi.jsx';
import DashboardDataHealth from '../../components/admin/monitoring/DashboardDataHealth.jsx';
import DashboardKpiGrid from '../../components/admin/monitoring/DashboardKpiGrid.jsx';
import GovernanceQueuesCard from '../../components/admin/monitoring/GovernanceQueuesCard.jsx';
import JobsApplicationsSummary from '../../components/admin/monitoring/JobsApplicationsSummary.jsx';
import NotificationEmailHealth from '../../components/admin/monitoring/NotificationEmailHealth.jsx';
import OperationalAlertsCard from '../../components/admin/monitoring/OperationalAlertsCard.jsx';
import PlatformTrendCard from '../../components/admin/monitoring/PlatformTrendCard.jsx';
import UsersOverviewCard from '../../components/admin/monitoring/UsersOverviewCard.jsx';
import {
    ACCOUNT_STATUS_OPTIONS,
    dateInputToExclusiveToInstant,
    dateInputToFromInstant,
    exclusiveToInclusiveDateInput,
    formatInstantVi,
    formatRatePercent,
    instantToDateInput,
    isSectionAvailable,
    JOB_STATUS_OPTIONS,
    USER_ROLE_OPTIONS,
    validateMonitoringPeriod,
} from '../../utils/platformMonitoringDisplay.js';
import '../../assets/styles/AdminPlatformMonitoringStyle.css';

const EMPTY_FILTERS = {
    fromDate: '',
    toDate: '',
    userRole: '',
    accountStatus: '',
    jobStatus: '',
};

const AdminDashboard = () => {
    const [draft, setDraft] = useState(EMPTY_FILTERS);
    const [applied, setApplied] = useState(EMPTY_FILTERS);
    const [presetDays, setPresetDays] = useState(null);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [unavailableAll, setUnavailableAll] = useState(false);

    const inFlightRef = useRef(false);

    const loadDashboard = useCallback(async (filters) => {
        if (inFlightRef.current) return;
        const periodError = validateMonitoringPeriod(filters.fromDate, filters.toDate);
        if (periodError) {
            toast.error(getApiErrorMessage({ message: periodError }));
            return;
        }

        inFlightRef.current = true;
        setLoading(true);
        setError('');
        setUnavailableAll(false);
        try {
            const params = {};
            const fromInstant = dateInputToFromInstant(filters.fromDate);
            const toInstant = dateInputToExclusiveToInstant(filters.toDate);
            if (fromInstant) params.fromDate = fromInstant;
            if (toInstant) params.toDate = toInstant;
            if (filters.userRole) params.userRole = filters.userRole;
            if (filters.accountStatus) params.accountStatus = filters.accountStatus;
            if (filters.jobStatus) params.jobStatus = filters.jobStatus;

            const res = await getPlatformMonitoring(params);
            const payload = res?.data?.data ?? res?.data ?? null;
            setData(payload);

            if (payload?.periodStart || payload?.periodEnd) {
                setDraft((prev) => ({
                    ...prev,
                    fromDate: instantToDateInput(payload.periodStart) || prev.fromDate,
                    toDate: exclusiveToInclusiveDateInput(payload.periodEnd) || prev.toDate,
                }));
            }
        } catch (err) {
            const status = err?.response?.status;
            const message = getApiErrorMessage(err, 'Không thể tải dashboard giám sát.');
            if (status === 503) {
                setUnavailableAll(true);
                setData(null);
                setError(message);
            } else {
                setError(message);
                toast.error(message);
            }
        } finally {
            setLoading(false);
            inFlightRef.current = false;
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        queueMicrotask(() => {
            if (cancelled) return;
            loadDashboard(EMPTY_FILTERS);
        });
        return () => {
            cancelled = true;
        };
    }, [loadDashboard]);

    const handleApply = (e) => {
        e?.preventDefault?.();
        setApplied(draft);
        setPresetDays(null);
        loadDashboard(draft);
    };

    const handleReset = () => {
        setDraft(EMPTY_FILTERS);
        setApplied(EMPTY_FILTERS);
        setPresetDays(null);
        loadDashboard(EMPTY_FILTERS);
    };

    const handleRefresh = () => {
        loadDashboard(applied);
    };

    const applyPresetDays = (days) => {
        const to = new Date();
        const from = new Date();
        from.setUTCDate(from.getUTCDate() - (days - 1));
        setDraft((prev) => ({
            ...prev,
            fromDate: from.toISOString().slice(0, 10),
            toDate: to.toISOString().slice(0, 10),
        }));
        setPresetDays(days);
    };

    const patchDraft = (field, value) => {
        setDraft((prev) => ({ ...prev, [field]: value }));
        setPresetDays(null);
    };

    const applications = data?.applications;
    const jobs = data?.jobs;
    const communications = data?.communications;
    const trends = data?.trends;
    const warnings = Array.isArray(data?.warnings) ? data.warnings : [];
    const trendRows = isSectionAvailable(trends) ? trends.data?.daily || [] : [];

    const summary = {
        users: isSectionAvailable(data?.users) ? data.users.data.createdUsers : null,
        jobs: isSectionAvailable(jobs) ? jobs.data.createdJobs : null,
        applications: isSectionAvailable(applications)
            ? applications.data.submittedApplications
            : null,
        hires: isSectionAvailable(applications) ? applications.data.successfulHires : null,
        hireRate: isSectionAvailable(applications)
            ? formatRatePercent(applications.data.applicationToHireRatePercent)
            : '—',
    };

    return (
        <div className="admin-monitor-page">
            <header className="admin-monitor-page__header">
                <div>
                    <div className="admin-monitor-page__title-row">
                        <h1 className="admin-monitor-page__title">Giám sát nền tảng</h1>
                        {data?.availability ? (
                            <span
                                className={`admin-monitor-pill ${
                                    data.availability === 'AVAILABLE'
                                        ? 'admin-monitor-pill--ok'
                                        : 'admin-monitor-pill--warn'
                                }`}
                                title={
                                    data.availability === 'AVAILABLE'
                                        ? 'Tất cả nhóm số liệu truy xuất được'
                                        : 'Một hoặc nhiều nhóm số liệu tạm thiếu'
                                }
                            >
                                {data.availability === 'AVAILABLE' ? 'Đầy đủ' : 'Thiếu một phần'}
                            </span>
                        ) : null}
                    </div>
                    <p className="admin-monitor-page__subtitle">
                        Tổng quan users, jobs, ứng tuyển, báo cáo, xác minh, kiểm duyệt và sức khỏe vận
                        hành theo UC-47 — chỉ giám sát, không chỉnh sửa dữ liệu tại đây.
                    </p>
                    {data ? (
                        <p className="admin-monitor-page__meta">
                            Kỳ {formatInstantVi(data.periodStart)} – {formatInstantVi(data.periodEnd)} ·
                            Cập nhật {formatInstantVi(data.lastUpdatedAt)}
                        </p>
                    ) : null}
                </div>
                <button
                    type="button"
                    className="admin-monitor-btn admin-monitor-btn--primary"
                    onClick={handleRefresh}
                    disabled={loading}
                >
                    {loading ? 'Đang tải...' : 'Làm mới'}
                </button>
            </header>

            <form className="admin-monitor-filters" onSubmit={handleApply}>
                <div className="admin-monitor-presets">
                    {[7, 14, 30].map((days) => (
                        <button
                            key={days}
                            type="button"
                            className={`admin-monitor-btn admin-monitor-btn--sm ${
                                presetDays === days
                                    ? 'admin-monitor-btn--preset-active'
                                    : 'admin-monitor-btn--ghost'
                            }`}
                            onClick={() => applyPresetDays(days)}
                            aria-pressed={presetDays === days}
                        >
                            {days} ngày
                        </button>
                    ))}
                </div>
                <label className="admin-monitor-field">
                    <span>Từ ngày</span>
                    <input
                        type="date"
                        value={draft.fromDate}
                        onChange={(e) => patchDraft('fromDate', e.target.value)}
                    />
                </label>
                <label className="admin-monitor-field">
                    <span>Đến ngày</span>
                    <input
                        type="date"
                        value={draft.toDate}
                        onChange={(e) => patchDraft('toDate', e.target.value)}
                    />
                </label>
                <label className="admin-monitor-field">
                    <span>Vai trò</span>
                    <select
                        value={draft.userRole}
                        onChange={(e) => patchDraft('userRole', e.target.value)}
                    >
                        {USER_ROLE_OPTIONS.map((opt) => (
                            <option key={opt.value || 'all-roles'} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="admin-monitor-field">
                    <span>Trạng thái TK</span>
                    <select
                        value={draft.accountStatus}
                        onChange={(e) => patchDraft('accountStatus', e.target.value)}
                    >
                        {ACCOUNT_STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value || 'all-account'} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="admin-monitor-field">
                    <span>Trạng thái tin</span>
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
                <div className="admin-monitor-filters__actions">
                    <button
                        type="submit"
                        className="admin-monitor-btn admin-monitor-btn--primary"
                        disabled={loading}
                    >
                        Áp dụng
                    </button>
                    <button
                        type="button"
                        className="admin-monitor-btn admin-monitor-btn--ghost"
                        onClick={handleReset}
                        disabled={loading}
                    >
                        Đặt lại
                    </button>
                </div>
            </form>

            {error ? <p className="admin-monitor-page__error">{error}</p> : null}

            {unavailableAll ? (
                <div className="admin-monitor-empty">
                    <h2>Thống kê tạm thời không khả dụng</h2>
                    <p>Không có nhóm dữ liệu nào truy xuất được. Vui lòng thử lại sau.</p>
                    <button
                        type="button"
                        className="admin-monitor-btn admin-monitor-btn--primary"
                        onClick={handleRefresh}
                    >
                        Thử lại
                    </button>
                </div>
            ) : null}

            {!unavailableAll ? (
                <>
                    <DashboardKpiGrid summary={summary} loading={loading && !data} />

                    <div className="admin-monitor-row admin-monitor-row--trend-alerts">
                        <PlatformTrendCard trends={trends} trendRows={trendRows} />
                        <OperationalAlertsCard warnings={warnings} />
                    </div>

                    <div className="admin-monitor-row admin-monitor-row--2">
                        <UsersOverviewCard users={data?.users} />
                        <NotificationEmailHealth communications={communications} />
                    </div>

                    <GovernanceQueuesCard
                        reports={data?.reports}
                        verification={data?.verification}
                        moderation={data?.moderation}
                    />

                    {data ? (
                        <JobsApplicationsSummary
                            jobs={jobs}
                            applications={applications}
                            trends={trends}
                            trendRows={trendRows}
                        />
                    ) : null}

                    <div className="admin-monitor-row admin-monitor-row--2">
                        <DashboardDataHealth data={data} />
                    </div>
                </>
            ) : null}

            {loading && !data ? (
                <p className="admin-monitor-page__loading">Đang tải bảng điều khiển...</p>
            ) : null}
        </div>
    );
};

export default AdminDashboard;
