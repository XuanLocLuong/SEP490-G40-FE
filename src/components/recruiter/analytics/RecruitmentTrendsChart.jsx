import { useMemo } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    LabelList,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { formatCount } from '../../../services/recruitmentAnalyticsService.js';

const SERIES = [
    { dataKey: 'newApps', name: 'Hồ sơ mới', color: '#2563eb' },
    { dataKey: 'hires', name: 'Đã tuyển', color: '#334155' },
];

const toDdMm = (iso) => {
    const parts = String(iso).trim().split('-');
    if (parts.length !== 3) return iso;
    const [, month, day] = parts;
    return `${day}/${month}`;
};

/** BE trả ISO (ngày hoặc tuần); FE format dd/MM cho trục X. */
export const formatTrendLabel = (label) => {
    if (!label) return '';
    const text = String(label);
    const dashIndex = text.indexOf('–');
    if (dashIndex === -1) {
        return toDdMm(text);
    }
    const from = text.slice(0, dashIndex).trim();
    const to = text.slice(dashIndex + 1).trim();
    return `${toDdMm(from)}–${toDdMm(to)}`;
};

const formatBarLabel = (value) => {
    const count = formatCount(value);
    return count > 0 ? String(count) : '';
};

const TrendTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const row = payload[0]?.payload;
    if (!row) return null;

    return (
        <div className="recruiter-analytics__chart-tooltip">
            <p className="recruiter-analytics__chart-tooltip-title">{row.name}</p>
            <ul className="recruiter-analytics__chart-tooltip-list">
                {SERIES.map((series) => (
                    <li key={series.dataKey}>
                        <span
                            className="recruiter-analytics__chart-tooltip-swatch"
                            style={{ background: series.color }}
                        />
                        <span className="recruiter-analytics__chart-tooltip-label">
                            {series.name}
                        </span>
                        <strong>{formatCount(row[series.dataKey])}</strong>
                    </li>
                ))}
            </ul>
        </div>
    );
};

/** Biểu đồ 2 series: hồ sơ mới + đã tuyển (BE đã bucket). */
const RecruitmentTrendsChart = ({ points }) => {
    const chartData = useMemo(
        () =>
            (Array.isArray(points) ? points : []).map((point, index) => ({
                name: formatTrendLabel(point.label) || `Kỳ ${index + 1}`,
                newApps: formatCount(point.newApplicationCount),
                hires: formatCount(point.hiredCount),
            })),
        [points]
    );

    const hasValue = chartData.some((row) => row.newApps > 0 || row.hires > 0);
    const labelInterval = chartData.length <= 8 ? 0 : Math.ceil(chartData.length / 8) - 1;

    if (chartData.length === 0) {
        return (
            <div className="recruiter-analytics__chart-empty">
                Không có dữ liệu xu hướng trong kỳ đã chọn.
            </div>
        );
    }

    if (!hasValue) {
        return (
            <div className="recruiter-analytics__chart-empty">
                Không có hoạt động tuyển dụng trong kỳ đã chọn.
            </div>
        );
    }

    return (
        <div
            className="recruiter-analytics__chart recruiter-analytics__chart--recharts"
            role="img"
            aria-label="Biểu đồ xu hướng hồ sơ mới và đã tuyển"
        >
            <ResponsiveContainer width="100%" height={300}>
                <BarChart
                    data={chartData}
                    margin={{ top: 22, right: 8, left: 0, bottom: 4 }}
                    barCategoryGap="28%"
                    barGap={4}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={false}
                        interval={labelInterval}
                    />
                    <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                        width={32}
                    />
                    <Tooltip
                        content={<TrendTooltip />}
                        cursor={{ fill: 'rgba(37, 99, 235, 0.04)' }}
                    />
                    <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    />
                    {SERIES.map((series) => (
                        <Bar
                            key={series.dataKey}
                            dataKey={series.dataKey}
                            name={series.name}
                            fill={series.color}
                            radius={[3, 3, 0, 0]}
                            maxBarSize={14}
                        >
                            <LabelList
                                dataKey={series.dataKey}
                                position="top"
                                formatter={formatBarLabel}
                                className="recruiter-analytics__chart-bar-label"
                                fill={series.color}
                            />
                        </Bar>
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RecruitmentTrendsChart;
