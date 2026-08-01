import { useMemo } from 'react';
import { formatCount } from '../../../services/recruitmentAnalyticsService.js';

export const formatTrendLabel = (dateStr) => {
    if (!dateStr) return '';
    const parts = String(dateStr).split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}`;
};

const startOfWeekMonday = (dateStr) => {
    const date = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(date.getTime())) return dateStr;
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diff);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export const aggregateTrendsByWeek = (trends) => {
    const buckets = new Map();
    (Array.isArray(trends) ? trends : []).forEach((row) => {
        const key = startOfWeekMonday(row.date);
        const prev = buckets.get(key) || {
            date: key,
            label: `Tuần ${formatTrendLabel(key)}`,
            uniqueCandidateViews: 0,
            applicationCount: 0,
            successfulHireCount: 0,
        };
        prev.uniqueCandidateViews += formatCount(row.uniqueCandidateViews);
        prev.applicationCount += formatCount(row.applicationCount);
        prev.successfulHireCount += formatCount(row.successfulHireCount);
        buckets.set(key, prev);
    });
    return Array.from(buckets.values()).sort((a, b) => a.date.localeCompare(b.date));
};

export const buildChartPoints = (trends, periodDays) => {
    const granularity = periodDays >= 30 ? 'week' : 'day';
    if (granularity === 'week') {
        return { granularity, points: aggregateTrendsByWeek(trends) };
    }
    return {
        granularity,
        points: (Array.isArray(trends) ? trends : []).map((row) => ({
            ...row,
            label: formatTrendLabel(row.date),
        })),
    };
};

/** Luôn hiện 3 series: xem / ứng tuyển / tuyển được. */
const RecruitmentTrendsChart = ({ points }) => {
    const rows = Array.isArray(points) ? points : [];
    const maxValue = useMemo(() => {
        let max = 0;
        rows.forEach((row) => {
            max = Math.max(
                max,
                formatCount(row.uniqueCandidateViews),
                formatCount(row.applicationCount),
                formatCount(row.successfulHireCount)
            );
        });
        return Math.max(max, 1);
    }, [rows]);

    if (rows.length === 0) {
        return (
            <div className="recruiter-analytics__chart-empty">
                Không có dữ liệu xu hướng trong kỳ đã chọn.
            </div>
        );
    }

    const showEvery = Math.max(1, Math.ceil(rows.length / 8));

    return (
        <div className="recruiter-analytics__chart">
            <div className="recruiter-analytics__chart-legend">
                <span className="recruiter-analytics__legend-item recruiter-analytics__legend-item--views">
                    Lượt xem
                </span>
                <span className="recruiter-analytics__legend-item recruiter-analytics__legend-item--apps">
                    Ứng tuyển
                </span>
                <span className="recruiter-analytics__legend-item recruiter-analytics__legend-item--hires">
                    Tuyển được
                </span>
            </div>
            <div className="recruiter-analytics__chart-plot" role="img" aria-label="Biểu đồ xu hướng">
                {rows.map((row) => {
                    const views = formatCount(row.uniqueCandidateViews);
                    const apps = formatCount(row.applicationCount);
                    const hires = formatCount(row.successfulHireCount);
                    return (
                        <div
                            key={row.date}
                            className="recruiter-analytics__chart-col"
                            title={row.label || row.date}
                        >
                            <div className="recruiter-analytics__chart-bars">
                                <span
                                    className="recruiter-analytics__bar recruiter-analytics__bar--views"
                                    style={{ height: `${(views / maxValue) * 100}%` }}
                                />
                                <span
                                    className="recruiter-analytics__bar recruiter-analytics__bar--apps"
                                    style={{ height: `${(apps / maxValue) * 100}%` }}
                                />
                                <span
                                    className="recruiter-analytics__bar recruiter-analytics__bar--hires"
                                    style={{ height: `${(hires / maxValue) * 100}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="recruiter-analytics__chart-axis">
                {rows.map((row, index) => (
                    <span key={row.date} className="recruiter-analytics__chart-tick">
                        {index % showEvery === 0 || index === rows.length - 1
                            ? row.label || formatTrendLabel(row.date)
                            : ''}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default RecruitmentTrendsChart;
