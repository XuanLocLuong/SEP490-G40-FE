import {
    formatAiResultLabel,
    formatAiScore,
    formatQueueTime,
    formatStars,
    getAiResultTone,
} from '../../utils/reviewModerationDisplay.js';

const ReviewModerationQueueList = ({
    items,
    selectedId,
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
                placeholder="Tìm theo người gửi, người nhận, nội dung..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
            />
        </div>

        <div className="pm-queue__list" aria-busy={loading}>
            {loading &&
                items.length === 0 &&
                Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="pm-queue-card pm-queue-card--skeleton" />
                ))}

            {!loading && items.length === 0 && (
                <p className="pm-queue__empty">Không có đánh giá nào trong hàng chờ.</p>
            )}

            {items.map((item) => {
                const id = item.contentValidationId;
                const isActive = id === selectedId;
                const tone = getAiResultTone(item.aiResult);
                const scoreLabel =
                    item.aiScore == null || Number.isNaN(Number(item.aiScore))
                        ? '—'
                        : `${formatAiScore(item.aiScore)}/1`;

                return (
                    <button
                        key={id}
                        type="button"
                        className={`pm-queue-card${isActive ? ' pm-queue-card--active' : ''}`}
                        onClick={() => onSelect(id)}
                    >
                        <div className="pm-queue-card__top">
                            <span className={`pm-queue-card__risk pm-queue-card__risk--${tone}`}>
                                {formatAiResultLabel(item.aiResult)}
                            </span>
                            <span className="pm-queue-card__queue-type">Điểm {scoreLabel}</span>
                        </div>

                        <div className="pm-queue-card__body">
                            <div className="pm-queue-card__info">
                                <h3 className="pm-queue-card__title">
                                    <span className="mc-review-card__stars" aria-hidden="true">
                                        {formatStars(item.rating)}
                                    </span>{' '}
                                    {item.rating != null ? `${item.rating}/5` : '—'}
                                </h3>
                                <p className="pm-queue-card__company">
                                    {item.reviewerName || '—'} → {item.revieweeName || '—'}
                                </p>
                                <p className="pm-queue-card__meta mc-review-card__preview">
                                    {item.commentPreview || 'Không có nội dung'}
                                </p>
                            </div>
                        </div>

                        {(item.assignedAt || item.createdAt) && (
                            <p className="pm-queue-card__time">
                                {formatQueueTime(item.assignedAt || item.createdAt)}
                            </p>
                        )}
                    </button>
                );
            })}
        </div>
    </aside>
);

export default ReviewModerationQueueList;
