import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {
    entriesFromMap,
    formatCount,
    localizeKey,
} from '../../../utils/platformMonitoringDisplay.js';

export const CHART_COLORS = [
    '#2f5fdb',
    '#16a34a',
    '#d97706',
    '#dc2626',
    '#4976B1',
    '#1e2433',
    '#0d9488',
    '#7c3aed',
];

export const mapToChartData = (map, { hideZero = false, labelMap } = {}) => {
    const rows = entriesFromMap(map).map(([name, value]) => ({
        name: localizeKey(name, labelMap),
        value: Number(value) || 0,
    }));
    return hideZero ? rows.filter((r) => r.value > 0) : rows;
};

const tooltipStyle = {
    borderRadius: 10,
    border: '1px solid #e6e9f0',
    fontSize: 12,
};

export const MonitorDonut = ({ data, height = 180 }) => {
    const chartData = Array.isArray(data) ? data : [];
    const hasValue = chartData.some((d) => d.value > 0);
    if (!hasValue) {
        return <p className="admin-monitor-chart-empty">Chưa có dữ liệu phân bổ.</p>;
    }
    return (
        <div className="admin-monitor-chart" style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="55%"
                        outerRadius="80%"
                        paddingAngle={2}
                        stroke="#fff"
                        strokeWidth={2}
                    >
                        {chartData.map((entry, index) => (
                            <Cell
                                key={`${entry.name}-${index}`}
                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value) => formatCount(value)}
                    />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        wrapperStyle={{ fontSize: 11 }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export const MonitorBar = ({ data, height = 200, layout = 'horizontal' }) => {
    const chartData = Array.isArray(data) ? data : [];
    const hasValue = chartData.some((d) => d.value > 0);
    if (!hasValue) {
        return <p className="admin-monitor-chart-empty">Chưa có dữ liệu biểu đồ.</p>;
    }

    if (layout === 'vertical') {
        return (
            <div className="admin-monitor-chart" style={{ height }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 12 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e6e9f0" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                        <YAxis
                            type="category"
                            dataKey="name"
                            width={100}
                            tick={{ fontSize: 10 }}
                        />
                        <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatCount(value)} />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`${entry.name}-${index}`}
                                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        );
    }

    return (
        <div className="admin-monitor-chart" style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ left: 0, right: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e6e9f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={36} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatCount(value)} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell
                                key={`${entry.name}-${index}`}
                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export const MonitorTrendChart = ({ rows, height = 280, includeReports = false }) => {
    const data = Array.isArray(rows) ? rows : [];
    if (data.length === 0) {
        return <p className="admin-monitor-chart-empty">Không có điểm xu hướng trong kỳ.</p>;
    }

    const chartData = data.map((row) => ({
        date: String(row.date || '').slice(5), // MM-DD
        fullDate: row.date,
        users: Number(row.usersCreated) || 0,
        jobs: Number(row.jobsCreated) || 0,
        applications: Number(row.applicationsSubmitted) || 0,
        hires: Number(row.successfulHires) || 0,
        reports: Number(row.reportsCreated) || 0,
    }));

    return (
        <div className="admin-monitor-chart admin-monitor-chart--trend" style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
                    <defs>
                        <linearGradient id="fillUsers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2f5fdb" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#2f5fdb" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="fillJobs" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#16a34a" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#16a34a" stopOpacity={0.02} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e6e9f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={36} />
                    <Tooltip
                        contentStyle={tooltipStyle}
                        labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate || ''}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area
                        type="monotone"
                        dataKey="users"
                        name="Người dùng"
                        stroke="#2f5fdb"
                        fill="url(#fillUsers)"
                        strokeWidth={2}
                    />
                    <Area
                        type="monotone"
                        dataKey="jobs"
                        name="Tin tuyển"
                        stroke="#16a34a"
                        fill="url(#fillJobs)"
                        strokeWidth={2}
                    />
                    <Area
                        type="monotone"
                        dataKey="applications"
                        name="Đơn ứng tuyển"
                        stroke="#d97706"
                        fill="transparent"
                        strokeWidth={2}
                    />
                    <Area
                        type="monotone"
                        dataKey="hires"
                        name="Tuyển thành công"
                        stroke="#0d9488"
                        fill="transparent"
                        strokeWidth={2}
                    />
                    {includeReports ? (
                        <Area
                            type="monotone"
                            dataKey="reports"
                            name="Báo cáo"
                            stroke="#dc2626"
                            fill="transparent"
                            strokeWidth={2}
                        />
                    ) : null}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

/** Combined jobs / applications / hires trend — highlights hiring funnel relationship. */
export const MonitorHiringRelationChart = ({ rows, height = 260 }) => {
    const data = Array.isArray(rows) ? rows : [];
    if (data.length === 0) {
        return <p className="admin-monitor-chart-empty">Không có điểm xu hướng trong kỳ.</p>;
    }

    const chartData = data.map((row) => {
        const jobs = Number(row.jobsCreated) || 0;
        const applications = Number(row.applicationsSubmitted) || 0;
        const hires = Number(row.successfulHires) || 0;
        return {
            date: String(row.date || '').slice(5),
            fullDate: row.date,
            jobs,
            applications,
            hires,
            appsPerJob: jobs > 0 ? applications / jobs : null,
        };
    });

    return (
        <div className="admin-monitor-chart admin-monitor-chart--trend" style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
                    <defs>
                        <linearGradient id="fillRelJobs" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2f5fdb" stopOpacity={0.28} />
                            <stop offset="100%" stopColor="#2f5fdb" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="fillRelApps" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#d97706" stopOpacity={0.22} />
                            <stop offset="100%" stopColor="#d97706" stopOpacity={0.02} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e6e9f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={36} />
                    <Tooltip
                        content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            const row = payload[0]?.payload;
                            const ratio =
                                row?.appsPerJob == null ? 'N/A' : Number(row.appsPerJob).toFixed(1);
                            return (
                                <div className="admin-monitor-tooltip">
                                    <p className="admin-monitor-tooltip__date">{row?.fullDate || label}</p>
                                    {payload.map((entry) => (
                                        <p key={entry.dataKey} style={{ color: entry.color }}>
                                            {entry.name}: {formatCount(entry.value)}
                                        </p>
                                    ))}
                                    <p className="admin-monitor-tooltip__ratio">≈ {ratio} đơn / tin</p>
                                </div>
                            );
                        }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area
                        type="monotone"
                        dataKey="jobs"
                        name="Tin tuyển"
                        stroke="#2f5fdb"
                        fill="url(#fillRelJobs)"
                        strokeWidth={2}
                    />
                    <Area
                        type="monotone"
                        dataKey="applications"
                        name="Đơn ứng tuyển"
                        stroke="#d97706"
                        fill="url(#fillRelApps)"
                        strokeWidth={2}
                    />
                    <Area
                        type="monotone"
                        dataKey="hires"
                        name="Tuyển thành công"
                        stroke="#0d9488"
                        fill="transparent"
                        strokeWidth={2}
                        strokeDasharray="5 4"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
