import { getBusinessInitial } from '../../utils/formatters.js';
import {
    formatQueueTime,
    getCategoryLabel,
} from '../../utils/reportReviewDisplay.js';

const ReportCaseQueueList = ({
    items,
    selectedJobId,
    search,
    onSearchChange,
    loading,
    onSelect,
}) => (
    <aside className="pm-queue__sidebar">
        <div className="pm-queue__search">
            <input
                type="search"
                className="pm-queue__search-input"
                placeholder="Tìm tin / doanh nghiệp / lý do…"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
            />
        </div>

        <div className="pm-queue__list" aria-busy={loading}>
            {loading && items.length === 0 &&
                Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="pm-queue-card pm-queue-card--skeleton" />
                ))}

            {!loading && items.length === 0 && (
                <p className="pm-queue__empty">Không có case báo cáo nào đang chờ.</p>
            )}

            {items.map((item) => {
                const isActive = item.jobId === selectedJobId;
                const unread = Number(item.unreadReports || 0);
                const categories = Array.isArray(item.categories) ? item.categories : [];

                return (
                    <button
                        key={item.jobId}
                        type="button"
                        className={`pm-queue-card${isActive ? ' pm-queue-card--active' : ''}${
                            unread > 0 ? ' pm-report-card--unread' : ''
                        }`}
                        onClick={() => onSelect(item.jobId)}
                    >
                        <div className="pm-queue-card__top pm-report-card__top">
                            <span className="pm-queue-card__time">
                                {formatQueueTime(item.latestReportAt)}
                            </span>
                        </div>

                        <div className="pm-queue-card__body">
                            <span className="pm-queue-card__logo" aria-hidden="true">
                                {getBusinessInitial(item.businessName)}
                            </span>
                            <div className="pm-queue-card__info">
                                <h3 className="pm-queue-card__title">{item.jobTitle || '—'}</h3>
                                <p className="pm-queue-card__company">{item.businessName || '—'}</p>
                                {categories.length > 0 && (
                                    <p className="pm-report-card__categories">
                                        {categories
                                            .slice(0, 3)
                                            .map((code) => getCategoryLabel(code))
                                            .join(' · ')}
                                        {categories.length > 3 ? '…' : ''}
                                    </p>
                                )}
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    </aside>
);

export default ReportCaseQueueList;
