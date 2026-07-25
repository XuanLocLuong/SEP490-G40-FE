import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { BriefcaseIcon, UsersIcon, CheckCircleIcon, TrendingIcon } from '../common/icons.jsx';
import {
    fetchHiringHistory,
    fetchHiringHistorySummary,
    getHiringHistoryApiErrorMessage,
} from '../../services/hiringHistoryService.js';
import { formatDate } from '../../utils/profileFormat.js';
import '../../assets/styles/HiringHistoryTab.css';

const formatPercent = (value) => {
    if (value == null || Number.isNaN(value)) return '—';
    return `${(value * 100).toFixed(1)}%`;
};

const getProgressPercent = (hired, required) =>
    required > 0 ? Math.min(100, Math.round((hired / required) * 100)) : 0;

const HiringHistoryTab = ({ businessId }) => {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({
        totalClosedJobs: 0,
        totalApplications: 0,
        totalHired: 0,
        successRate: 0,
    });
    const [items, setItems] = useState([]);

    useEffect(() => {
        let active = true;
        setLoading(true);

        const params = { businessId };

        Promise.all([fetchHiringHistorySummary(params), fetchHiringHistory(params)])
            .then(([summaryRes, listRes]) => {
                if (!active) return;
                setSummary(summaryRes);
                setItems(listRes.items ?? []);
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
    }, [businessId]);

    const stats = useMemo(
        () => [
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
        ],
        [summary]
    );

    if (loading) {
        return <p className="account-settings__hint">Đang tải lịch sử tuyển dụng...</p>;
    }

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
            </div>

            {items.length === 0 ? (
                <div className="hiring-history__empty">
                    Chưa có tin tuyển dụng nào kết thúc.
                </div>
            ) : (
                <ul className="hiring-history__list">
                    {items.map((item) => {
                        const required = Number(item.requiredCandidates) || 1;
                        const hired = Number(item.hiredCount) || 0;
                        const applications = Number(item.applicationCount) || 0;
                        const progress = getProgressPercent(hired, required);
                        return (
                            <li key={item.jobId} className="hiring-history__item">
                                <div className="hiring-history__item-head">
                                    <span className="hiring-history__item-title">{item.title}</span>
                                </div>

                                <div className="hiring-history__item-time">
                                    {formatDate(item.postedAt)}
                                    {item.closedAt ? ` — ${formatDate(item.closedAt)}` : ''}
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
                                        <strong>{applications}</strong> ứng tuyển
                                    </span>
                                    <span className="hiring-history__count hiring-history__count--hired">
                                        <strong>{hired}</strong> đã tuyển
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
