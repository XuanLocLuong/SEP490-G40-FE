import { useCallback, useEffect, useState } from 'react';
import {
    fetchCandidateReviews,
    getReviewApiErrorMessage,
} from '../../services/candidateReviewsService.js';
import { formatDate } from '../../utils/profileFormat.js';

const PAGE_SIZE = 20;

const ReviewStars = ({ rating = 0, size = 14 }) => {
    const filled = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
    return (
        <span className="cpp-review-stars" aria-label={`${filled} trên 5 sao`}>
            {Array.from({ length: 5 }, (_, i) => (
                <span
                    key={i}
                    className={
                        'cpp-review-stars__star' +
                        (i < filled ? ' cpp-review-stars__star--filled' : '')
                    }
                    style={{ fontSize: size }}
                >
                    ★
                </span>
            ))}
        </span>
    );
};

/**
 * Panel list đánh giá về candidate.
 * @param {string|number|null} userId — users.id (bắt buộc để gọi API)
 * @param {string} [emptyText]
 * @param {string} [missingUserIdText]
 */
const CandidateReceivedReviewsPanel = ({
    userId,
    emptyText = 'Chưa có đánh giá nào.',
    missingUserIdText = 'Không tải được đánh giá vì thiếu mã người dùng ứng viên.',
    title = 'Đánh giá nhận được',
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [averageRating, setAverageRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [reviews, setReviews] = useState([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);

    const load = useCallback(
        async (pageToLoad = 0, append = false) => {
            if (userId == null || userId === '') {
                setError('');
                setReviews([]);
                setTotalReviews(0);
                setAverageRating(0);
                return;
            }

            setLoading(true);
            setError('');
            try {
                const data = await fetchCandidateReviews(userId, {
                    page: pageToLoad,
                    size: PAGE_SIZE,
                });
                setAverageRating(data.averageRating);
                setTotalReviews(data.totalReviews);
                setReviews((prev) => {
                    const next = append
                        ? [...prev, ...data.recentReviews]
                        : data.recentReviews;
                    setHasMore(next.length < data.totalReviews);
                    return next;
                });
                setPage(pageToLoad);
            } catch (err) {
                setError(getReviewApiErrorMessage(err, 'Không tải được đánh giá.'));
                if (!append) {
                    setReviews([]);
                    setTotalReviews(0);
                    setAverageRating(0);
                }
            } finally {
                setLoading(false);
            }
        },
        // reviews.length chỉ dùng khi append — cố ý không put vào deps để tránh loop
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [userId]
    );

    useEffect(() => {
        load(0, false);
    }, [load]);

    if (userId == null || userId === '') {
        return (
            <section className="cpp-card">
                <h2 className="cpp-card__title">{title}</h2>
                <p className="cpp-empty-text">{missingUserIdText}</p>
            </section>
        );
    }

    return (
        <section className="cpp-card">
            <div className="cpp-reviews-header">
                <h2 className="cpp-card__title">{title}</h2>
                {!loading && !error && totalReviews > 0 && (
                    <div className="cpp-reviews-summary">
                        <ReviewStars rating={averageRating} size={18} />
                        <strong>{Number(averageRating).toFixed(1)}</strong>
                        <span>{totalReviews} đánh giá</span>
                    </div>
                )}
            </div>

            {loading && reviews.length === 0 && (
                <p className="cpp-empty-text">Đang tải đánh giá…</p>
            )}

            {error && (
                <div className="cpp-error-state">
                    <p>{error}</p>
                    <button
                        type="button"
                        className="btn btn--secondary"
                        disabled={loading}
                        onClick={() => load(0, false)}
                    >
                        {loading ? 'Đang tải…' : 'Thử lại'}
                    </button>
                </div>
            )}

            {!loading && !error && reviews.length === 0 && (
                <p className="cpp-empty-text">{emptyText}</p>
            )}

            {reviews.length > 0 && (
                <ul className="cpp-reviews-list">
                    {reviews.map((review) => (
                        <li key={review.id} className="cpp-review-item">
                            <div className="cpp-review-item__top">
                                {review.reviewerProfilePicture ? (
                                    <img
                                        src={review.reviewerProfilePicture}
                                        alt=""
                                        className="cpp-review-item__avatar"
                                    />
                                ) : (
                                    <div
                                        className="cpp-review-item__avatar cpp-review-item__avatar--placeholder"
                                        aria-hidden="true"
                                    >
                                        {(review.reviewerName || '?').charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="cpp-review-item__meta">
                                    <strong>{review.reviewerName}</strong>
                                    <div className="cpp-review-item__rating-row">
                                        <ReviewStars rating={review.rating} size={14} />
                                        {review.createdAt && (
                                            <time dateTime={review.createdAt}>
                                                {formatDate(review.createdAt)}
                                            </time>
                                        )}
                                        {review.status === 'HIDDEN' && (
                                            <span className="cpp-review-item__badge">Đã ẩn</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {review.comment ? (
                                <p className="cpp-review-item__comment">{review.comment}</p>
                            ) : null}
                        </li>
                    ))}
                </ul>
            )}

            {hasMore && (
                <div className="cpp-reviews-more">
                    <button
                        type="button"
                        className="btn btn--secondary"
                        disabled={loading}
                        onClick={() => load(page + 1, true)}
                    >
                        {loading ? 'Đang tải…' : 'Xem thêm'}
                    </button>
                </div>
            )}
        </section>
    );
};

export default CandidateReceivedReviewsPanel;
