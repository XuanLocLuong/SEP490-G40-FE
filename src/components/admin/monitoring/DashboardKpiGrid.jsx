import {
    formatCount,
    HIRE_RATE_TOOLTIP,
} from '../../../utils/platformMonitoringDisplay.js';

const KPI_ITEMS = [
    { key: 'users', label: 'Người dùng mới', unit: 'tài khoản', tooltip: 'Số tài khoản được tạo trong kỳ báo cáo.' },
    { key: 'jobs', label: 'Tin tuyển mới', unit: 'tin', tooltip: 'Số tin tuyển được tạo trong kỳ.' },
    { key: 'applications', label: 'Đơn ứng tuyển', unit: 'đơn', tooltip: 'Số đơn ứng tuyển nộp trong kỳ.' },
    { key: 'hires', label: 'Tuyển thành công', unit: 'lượt', tooltip: 'Số lần đơn chuyển sang HIRED trong kỳ (theo log trạng thái).' },
    {
        key: 'hireRate',
        label: 'Tỷ lệ tuyển',
        unit: '',
        tooltip: HIRE_RATE_TOOLTIP,
        isRate: true,
    },
];

const DashboardKpiGrid = ({ summary, loading }) => (
    <section className="admin-monitor-summary" aria-label="Chỉ số chính">
        {KPI_ITEMS.map((item) => {
            const raw = summary?.[item.key];
            const display = item.isRate
                ? raw ?? '—'
                : raw == null
                  ? '—'
                  : formatCount(raw);
            return (
                <div
                    key={item.key}
                    className={`admin-monitor-summary__card ${loading ? 'is-loading' : ''}`}
                    title={item.tooltip}
                >
                    <span>{item.label}</span>
                    <strong className={item.isRate ? 'admin-monitor-summary__rate' : undefined}>
                        {loading && raw == null ? '…' : display}
                    </strong>
                    {item.unit ? <em className="admin-monitor-summary__unit">{item.unit}</em> : null}
                </div>
            );
        })}
    </section>
);

export default DashboardKpiGrid;
