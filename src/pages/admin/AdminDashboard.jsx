import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import {
    getApiErrorMessage,
    getPlatformMonitoring,
} from '../../apis/AdminPlatformMonitoringApi.jsx';
import { getTrustOverview } from '../../apis/AdminTrustOverviewApi.jsx';
import { getTopRecruitersOverview } from '../../apis/AdminTopRecruitersOverviewApi.jsx';
import DashboardDataHealth from '../../components/admin/monitoring/DashboardDataHealth.jsx';
import DashboardKpiGrid from '../../components/admin/monitoring/DashboardKpiGrid.jsx';
import JobsApplicationsSummary from '../../components/admin/monitoring/JobsApplicationsSummary.jsx';
import NotificationEmailHealth from '../../components/admin/monitoring/NotificationEmailHealth.jsx';
import OperationalAlertsCard from '../../components/admin/monitoring/OperationalAlertsCard.jsx';
import PlatformTrendCard from '../../components/admin/monitoring/PlatformTrendCard.jsx';
import TopRecruitersOverview from '../../components/admin/monitoring/TopRecruitersOverview.jsx';
import TrustVerificationOverview from '../../components/admin/monitoring/TrustVerificationOverview.jsx';
import {
    dateInputToExclusiveToInstant,
    dateInputToFromInstant,
    exclusiveToInclusiveDateInput,
    formatInstantVi,
    formatRatePercent,
    instantToDateInput,
    isSectionAvailable,
    validateMonitoringPeriod,
} from '../../utils/platformMonitoringDisplay.js';
import '../../assets/styles/AdminPlatformMonitoringStyle.css';

const EMPTY_FILTERS = {
    fromDate: '',
    toDate: '',
};

const AdminDashboard = () => {
    const [draft, setDraft] = useState(EMPTY_FILTERS);
    const [applied, setApplied] = useState(EMPTY_FILTERS);
    const [presetDays, setPresetDays] = useState(null);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [unavailableAll, setUnavailableAll] = useState(false);

    const [trustData, setTrustData] = useState(null);
    const [trustLoading, setTrustLoading] = useState(false);
    const [trustError, setTrustError] = useState('');

    const [topData, setTopData] = useState(null);
    const [topLoading, setTopLoading] = useState(false);
    const [topError, setTopError] = useState('');

    const inFlightRef = useRef(false);

    const loadSecondaryPanels = useCallback(async () => {
        setTrustLoading(true);
        setTopLoading(true);
        setTrustError('');
        setTopError('');
        try {
            const [trustRes, topRes] = await Promise.allSettled([
                getTrustOverview(),
                getTopRecruitersOverview(),
            ]);
            if (trustRes.status === 'fulfilled') {
                setTrustData(trustRes.value?.data?.data ?? trustRes.value?.data ?? null);
            } else {
                setTrustData(null);
                setTrustError('Không tải được Trust & Verification (mock/API).');
            }
            if (topRes.status === 'fulfilled') {
                setTopData(topRes.value?.data?.data ?? topRes.value?.data ?? null);
            } else {
                setTopData(null);
                setTopError('Không tải được Top Recruiters (mock/API).');
            }
        } finally {
            setTrustLoading(false);
            setTopLoading(false);
        }
    }, []);

    const loadDashboard = useCallback(
        async (filters) => {
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
        },
        []
    );

    useEffect(() => {
        let cancelled = false;
        queueMicrotask(() => {
            if (cancelled) return;
            loadDashboard(EMPTY_FILTERS);
            loadSecondaryPanels();
        });
        return () => {
            cancelled = true;
        };
    }, [loadDashboard, loadSecondaryPanels]);

    const handleApply = (e) => {
        e?.preventDefault?.();
        setApplied(draft);
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
        loadSecondaryPanels();
    };

    const applyPresetDays = (days) => {
        const to = new Date();
        const from = new Date();
        from.setUTCDate(from.getUTCDate() - (days - 1));
        setDraft({
            fromDate: from.toISOString().slice(0, 10),
            toDate: to.toISOString().slice(0, 10),
        });
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
                        Tổng quan hoạt động nền tảng, việc cần chú ý, Trust & Top Recruiters — chỉ giám sát,
                        không chỉnh sửa cấu hình tại đây.
                    </p>
                    {data ? (
                        <p className="admin-monitor-page__meta">
                            Kỳ {formatInstantVi(data.periodStart)} – {formatInstantVi(data.periodEnd)} · Cập
                            nhật {formatInstantVi(data.lastUpdatedAt)}
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
                <div className="admin-monitor-filters__actions">
                    <button type="submit" className="admin-monitor-btn admin-monitor-btn--primary" disabled={loading}>
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
                    <button type="button" className="admin-monitor-btn admin-monitor-btn--primary" onClick={handleRefresh}>
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
                        <TrustVerificationOverview
                            data={trustData}
                            loading={trustLoading}
                            error={trustError}
                        />
                        <TopRecruitersOverview data={topData} loading={topLoading} error={topError} />
                    </div>

                    {data ? (
                        <JobsApplicationsSummary
                            jobs={jobs}
                            applications={applications}
                            trends={trends}
                            trendRows={trendRows}
                        />
                    ) : null}

                    <div className="admin-monitor-row admin-monitor-row--2">
                        <NotificationEmailHealth communications={communications} />
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
