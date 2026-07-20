import { getBusinessInitial } from '../../utils/formatters.js';
import {
    formatQueueTime,
    getQueueTypeLabel,
    getQueueTypeTone,
    getRiskDisplay,
    RISK_TABS,
} from '../../utils/jobReviewDisplay.js';

const JobReviewQueueList = ({
    items,
    selectedReviewId,
    activeRiskTab,
    onRiskTabChange,
    riskCounts,
    search,
    onSearchChange,
    loading,
    onSelect,
}) => (
    <aside className="pm-queue__sidebar">
        <div className="pm-queue__tabs" role="tablist">
            {RISK_TABS.map((tab) => {
                const count = riskCounts[tab.id] ?? 0;
                const isActive = activeRiskTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        className={`pm-queue__tab pm-queue__tab--${tab.id.toLowerCase()}${
                            isActive ? ' pm-queue__tab--active' : ''
                        }`}
                        onClick={() => onRiskTabChange(tab.id)}
                    >
                        {tab.label}
                        <span className="pm-queue__tab-count">({count})</span>
                    </button>
                );
            })}
        </div>

        <div className="pm-queue__search">
            <input
                type="search"
                className="pm-queue__search-input"
                placeholder="Tìm tin đăng..."
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
                <p className="pm-queue__empty">Không có tin nào trong hàng chờ.</p>
            )}

            {items.map((item) => {
                const risk = getRiskDisplay(item.aiRiskLevel);
                const isActive = item.reviewId === selectedReviewId;
                const queueLabel = getQueueTypeLabel(item.queueType);
                const queueTone = getQueueTypeTone(item.queueType);

                return (
                    <button
                        key={item.reviewId}
                        type="button"
                        className={`pm-queue-card${isActive ? ' pm-queue-card--active' : ''}`}
                        onClick={() => onSelect(item.reviewId)}
                    >
                        <div className="pm-queue-card__top">
                            <span className={`pm-queue-card__risk pm-queue-card__risk--${risk.tone}`}>
                                {risk.shortLabel}
                            </span>
                            {queueLabel && (
                                <span
                                    className={`pm-queue-card__queue-type${
                                        queueTone ? ` pm-queue-card__queue-type--${queueTone}` : ''
                                    }`}
                                >
                                    {queueLabel}
                                </span>
                            )}
                        </div>

                        <div className="pm-queue-card__body">
                            <span className="pm-queue-card__logo" aria-hidden="true">
                                {getBusinessInitial(item.businessName)}
                            </span>
                            <div className="pm-queue-card__info">
                                <h3 className="pm-queue-card__title">{item.jobTitle || '—'}</h3>
                                <p className="pm-queue-card__company">{item.businessName || '—'}</p>
                                <p className="pm-queue-card__meta">
                                    {item.recruiterName && <span>{item.recruiterName}</span>}
                                    {item.autoApprovalScore != null && (
                                        <span>Điểm: {Math.round(item.autoApprovalScore)}</span>
                                    )}
                                </p>
                            </div>
                        </div>

                        <p className="pm-queue-card__time">{formatQueueTime(item.createdAt)}</p>
                    </button>
                );
            })}
        </div>
    </aside>
);

export default JobReviewQueueList;
