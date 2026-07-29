import { formatCount, formatInstantVi } from '../../../utils/platformMonitoringDisplay.js';

const display = (value, { isRate = false, digits = 1 } = {}) => {
    if (value == null || value === '') return '—';
    const n = Number(value);
    if (Number.isNaN(n)) return '—';
    if (isRate) return n.toLocaleString('vi-VN', { maximumFractionDigits: digits });
    return formatCount(n);
};

const TrustVerificationOverview = ({ data, loading, error }) => (
    <section className="admin-monitor-card">
        <header className="admin-monitor-card__header">
            <div>
                <h2>Trust & Verification</h2>
                <p className="admin-monitor-hint">
                    Tổng quan uy tín và xác minh doanh nghiệp/ứng viên.
                    {data?._source === 'MOCK' ? ' · Demo mock (chưa có API BE)' : ''}
                </p>
            </div>
            <span
                className={`admin-monitor-pill ${
                    error ? 'admin-monitor-pill--warn' : 'admin-monitor-pill--ok'
                }`}
            >
                {error ? 'Lỗi' : loading ? 'Đang tải' : 'Sẵn sàng'}
            </span>
        </header>

        {error ? (
            <p className="admin-monitor-card__empty">{error}</p>
        ) : loading && !data ? (
            <p className="admin-monitor-card__empty">Đang tải Trust & Verification…</p>
        ) : data ? (
            <div className="admin-monitor-card__body">
                <div className="admin-monitor-compact-metrics">
                    <div>
                        <span>DN đã xác minh</span>
                        <strong>{display(data.verifiedBusinessCount)}</strong>
                    </div>
                    <div>
                        <span>Chờ xác minh DN</span>
                        <strong>{display(data.pendingBusinessVerificationCount)}</strong>
                    </div>
                    <div>
                        <span>Chờ xác minh UV</span>
                        <strong>{display(data.pendingCandidateVerificationCount)}</strong>
                    </div>
                    <div title="Trung bình Trust Score doanh nghiệp — không tính trên FE">
                        <span>Trust DN trung bình</span>
                        <strong>{display(data.averageBusinessTrustScore, { isRate: true })}</strong>
                    </div>
                    <div
                        title={
                            data.activeWarningThreshold != null
                                ? `Dưới ngưỡng cấu hình: ${data.activeWarningThreshold}`
                                : undefined
                        }
                    >
                        <span>DN dưới ngưỡng</span>
                        <strong>{display(data.businessBelowThresholdCount)}</strong>
                    </div>
                    <div>
                        <span>Hạn chế scam</span>
                        <strong className={data.confirmedScamRestrictionCount > 0 ? 'is-warn' : ''}>
                            {display(data.confirmedScamRestrictionCount)}
                        </strong>
                    </div>
                </div>
                <p className="admin-monitor-hint">
                    Cập nhật {formatInstantVi(data.lastUpdatedAt)}
                    {data.verificationOverdueCount == null
                        ? ' · SLA xác minh: chưa có trên API (không giả lập)'
                        : ` · Quá SLA: ${display(data.verificationOverdueCount)}`}
                </p>
            </div>
        ) : (
            <p className="admin-monitor-card__empty">Không có dữ liệu Trust & Verification.</p>
        )}
    </section>
);

export default TrustVerificationOverview;
