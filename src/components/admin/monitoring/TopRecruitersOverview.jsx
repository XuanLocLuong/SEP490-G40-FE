import { formatCount, formatInstantVi } from '../../../utils/platformMonitoringDisplay.js';

const CONFIG_LABELS = {
    minimumTrustScore: 'Minimum Trust Score',
    minimumAccountAgeDays: 'Tuổi tài khoản tối thiểu (ngày)',
    accountAgeReference: 'Trường tham chiếu tuổi TK',
    minimumValidReviewCount: 'Số review hợp lệ tối thiểu',
    minimumSuccessfulHireCount: 'Số tuyển thành công tối thiểu',
    resultLimit: 'Giới hạn kết quả xếp hạng',
};

const STATUS_LABELS = {
    ACTIVE: 'Đang áp dụng',
    INACTIVE: 'Tạm tắt',
    INVALID: 'Không hợp lệ',
    MISSING: 'Thiếu cấu hình',
};

const TopRecruitersOverview = ({ data, loading, error }) => {
    const config = data?.activeConfiguration || null;
    const preview = Array.isArray(data?.topBusinesses) ? data.topBusinesses.slice(0, 5) : [];

    return (
        <section className="admin-monitor-card">
            <header className="admin-monitor-card__header">
                <div>
                    <h2>Top Recruiters Overview</h2>
                    <p className="admin-monitor-hint">
                        Tóm tắt xếp hạng nhà tuyển dụng (đọc-only).
                        {data?._source === 'MOCK' ? ' · Demo mock (chưa có API BE)' : ''}
                    </p>
                </div>
                <span
                    className={`admin-monitor-pill ${
                        error
                            ? 'admin-monitor-pill--warn'
                            : data?.configurationStatus === 'ACTIVE'
                              ? 'admin-monitor-pill--ok'
                              : 'admin-monitor-pill--warn'
                    }`}
                >
                    {error
                        ? 'Lỗi'
                        : loading && !data
                          ? 'Đang tải'
                          : STATUS_LABELS[data?.configurationStatus] || data?.configurationStatus || '—'}
                </span>
            </header>

            {error ? (
                <p className="admin-monitor-card__empty">{error}</p>
            ) : loading && !data ? (
                <p className="admin-monitor-card__empty">Đang tải Top Recruiters…</p>
            ) : data ? (
                <div className="admin-monitor-card__body">
                    <div className="admin-monitor-compact-metrics">
                        <div>
                            <span>Business đủ điều kiện</span>
                            <strong>{formatCount(data.eligibleBusinessCount)}</strong>
                        </div>
                        <div>
                            <span>Đang hiển thị</span>
                            <strong>{formatCount(data.displayedBusinessCount)}</strong>
                        </div>
                        <div>
                            <span>Giới hạn hạng</span>
                            <strong>{formatCount(data.resultLimit)}</strong>
                        </div>
                        <div>
                            <span>Refresh xếp hạng</span>
                            <strong className="admin-monitor-compact-metrics__text">
                                {formatInstantVi(data.lastRankingRefreshAt)}
                            </strong>
                        </div>
                    </div>

                    {config ? (
                        <div className="admin-monitor-config-summary">
                            <h3>Cấu hình đang áp dụng</h3>
                            <dl>
                                {Object.keys(CONFIG_LABELS).map((key) =>
                                    config[key] == null && config[key] !== 0 ? null : (
                                        <div key={key}>
                                            <dt>{CONFIG_LABELS[key]}</dt>
                                            <dd>{String(config[key])}</dd>
                                        </div>
                                    )
                                )}
                            </dl>
                            <p className="admin-monitor-hint">
                                Giá trị lấy từ cấu hình Admin (mock/API) — không hardcode trên UI.
                            </p>
                        </div>
                    ) : null}

                    <div className="admin-monitor-top-preview">
                        <h3>Top 5 (theo thứ tự Backend)</h3>
                        {preview.length === 0 ? (
                            <p className="admin-monitor-card__empty">Chưa có business trong bảng xếp hạng.</p>
                        ) : (
                            <div className="admin-monitor-top-preview__scroll">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Business</th>
                                            <th>Xác minh</th>
                                            <th>Trust</th>
                                            <th>Rating</th>
                                            <th>Review</th>
                                            <th>Hire</th>
                                            <th>Job</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preview.map((row) => (
                                            <tr key={row.businessId ?? row.rank}>
                                                <td>{row.rank}</td>
                                                <td>{row.businessName || '—'}</td>
                                                <td>{row.verified ? 'Đã xác minh' : 'Chưa'}</td>
                                                <td>
                                                    {row.trustScore == null
                                                        ? '—'
                                                        : Number(row.trustScore).toLocaleString('vi-VN', {
                                                              maximumFractionDigits: 1,
                                                          })}
                                                </td>
                                                <td>
                                                    {row.averageRating == null
                                                        ? '—'
                                                        : Number(row.averageRating).toLocaleString('vi-VN', {
                                                              maximumFractionDigits: 1,
                                                          })}
                                                </td>
                                                <td>{formatCount(row.validReviewCount)}</td>
                                                <td>{formatCount(row.successfulHireCount)}</td>
                                                <td>{formatCount(row.activeJobCount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <p className="admin-monitor-hint">
                            Nút xem đầy đủ / cấu hình sẽ bật khi có route Admin tương ứng.
                        </p>
                    </div>
                </div>
            ) : (
                <p className="admin-monitor-card__empty">Không có dữ liệu Top Recruiters.</p>
            )}
        </section>
    );
};

export default TopRecruitersOverview;
