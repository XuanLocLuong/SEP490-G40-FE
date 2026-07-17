import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { BriefcaseIcon, UsersIcon, CheckCircleIcon, TrendingIcon } from '../common/icons.jsx';
import {
    fetchHiringHistory,
    getHiringHistoryApiErrorMessage,
} from '../../services/hiringHistoryService.js';
import { formatDate } from '../../utils/profileFormat.js';
import '../../assets/styles/HiringHistoryTab.css';

const CLOSE_REASON_LABEL = {
    FILLED: { text: 'Đã tuyển đủ', tone: 'ok' },
    EXPIRED: { text: 'Hết hạn', tone: 'muted' },
    MANUAL: { text: 'Đóng thủ công', tone: 'muted' },
};

const formatPercent = (value) => {
    if (value == null || Number.isNaN(value)) return '—';
    return `${(value * 100).toFixed(1)}%`;
};

const getProgressPercent = (hired, required) =>
    required > 0 ? Math.min(100, Math.round((hired / required) * 100)) : 0;

const HiringHistoryTab = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [yearFilter, setYearFilter] = useState('all');

    useEffect(() => {
        let active = true;
        setLoading(true);
        fetchHiringHistory()
            .then((res) => {
                if (active) setData(res);
            })
            .catch((err) => {
                if (active) toast.error(getHiringHistoryApiErrorMessage(err));
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, []);

    const items = data?.items ?? [];

    const years = useMemo(() => {
        const set = new Set(
            items
                .map((it) => (it.closedAt ? new Date(it.closedAt).getFullYear() : null))
                .filter(Boolean)
        );
        return Array.from(set).sort((a, b) => b - a);
    }, [items]);

    const filteredItems = useMemo(() => {
        if (yearFilter === 'all') return items;
        return items.filter(
            (it) => it.closedAt && String(new Date(it.closedAt).getFullYear()) === yearFilter
        );
    }, [items, yearFilter]);

    if (loading) {
        return <p className="account-settings__hint">Đang tải lịch sử tuyển dụng...</p>;
    }

    const summary = data?.summary ?? {
        totalClosedJobs: 0,
        totalApplications: 0,
        totalHired: 0,
        successRate: 0,
    };

    const stats = [
        {
            id: 'jobs',
            icon: <BriefcaseIcon width={18} height={18} />,
            label: 'Tin đã kết thúc',
            value: summary.totalClosedJobs,
        },
        {
            id: 'apps',
            icon: <UsersIcon width={18} height={18} />,
            label: 'Lượt ứng tuyển',
            value: summary.totalApplications,
        },
        {
            id: 'hired',
            icon: <CheckCircleIcon width={18} height={18} />,
            label: 'Đã tuyển',
            value: summary.totalHired,
        },
        {
            id: 'rate',
            icon: <TrendingIcon width={18} height={18} />,
            label: 'Tỷ lệ tuyển',
            value: formatPercent(summary.successRate),
        },
    ];

    return (
        <div className="hiring-history">
            <div className="hiring-history__stats">
                {stats.map((stat) => (
                    <div key={stat.id} className="hiring-history__stat">
                        <span className="hiring-history__stat-icon">{stat.icon}</span>
                        <div className="hiring-history__stat-body">
                            <strong className="hiring-history__stat-value">{stat.value}</strong>
                            <span className="hiring-history__stat-label">{stat.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="hiring-history__toolbar">
                <h3 className="hiring-history__section-title">Tin tuyển dụng đã kết thúc</h3>
                {years.length > 0 && (
                    <select
                        className="hiring-history__year-select"
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                    >
                        <option value="all">Tất cả các năm</option>
                        {years.map((year) => (
                            <option key={year} value={String(year)}>
                                Năm {year}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {filteredItems.length === 0 ? (
                <div className="hiring-history__empty">
                    Chưa có tin tuyển dụng nào kết thúc.
                </div>
            ) : (
                <ul className="hiring-history__list">
                    {filteredItems.map((item) => {
                        const reason =
                            CLOSE_REASON_LABEL[item.closeReason] || CLOSE_REASON_LABEL.MANUAL;
                        const counts = item.applicationCounts || {};
                        const required = Number(item.requiredCandidates) || 1;
                        const hired = Number(counts.hired) || 0;
                        const progress = getProgressPercent(hired, required);
                        return (
                            <li key={item.jobId} className="hiring-history__item">
                                <div className="hiring-history__item-head">
                                    <span className="hiring-history__item-title">{item.title}</span>
                                    <span
                                        className={`hiring-history__badge hiring-history__badge--${reason.tone}`}
                                    >
                                        {reason.text}
                                    </span>
                                </div>

                                <div className="hiring-history__item-time">
                                    {formatDate(item.postedAt)} — {formatDate(item.closedAt)}
                                </div>

                                <div className="hiring-history__progress">
                                    <div className="hiring-history__progress-header">
                                        <span>Tiến độ tuyển dụng</span>
                                        <span>
                                            {hired}/{required} ứng viên đã tuyển
                                        </span>
                                    </div>
                                    <div className="hiring-history__progress-bar">
                                        <div
                                            className="hiring-history__progress-fill"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="hiring-history__counts">
                                    <span className="hiring-history__count">
                                        <strong>{required}</strong> cần tuyển
                                    </span>
                                    <span className="hiring-history__count">
                                        <strong>{counts.total ?? 0}</strong> ứng tuyển
                                    </span>
                                    <span className="hiring-history__count hiring-history__count--accepted">
                                        <strong>{counts.accepted ?? 0}</strong> chấp nhận
                                    </span>
                                    <span className="hiring-history__count hiring-history__count--rejected">
                                        <strong>{counts.rejected ?? 0}</strong> từ chối
                                    </span>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export default HiringHistoryTab;
