import { useEffect, useId, useState } from 'react';
import { StarIcon } from '../common/icons.jsx';
import '../../assets/styles/ReviewSubmitModalStyle.css';

/**
 * Modal đánh giá dùng chung: Chat / Recruiter Ứng viên / Candidate.
 * Parent giữ applicationId và gọi API trong onSubmit({ rating, comment }).
 *
 * @param {'page' | 'dock'} [variant]
 * @param {'edit' | 'view'} [mode] view = chỉ xem, không gửi lại
 */
const ReviewSubmitModal = ({
    open,
    busy = false,
    onClose,
    onSubmit,
    title = 'Viết đánh giá',
    subtitle = '',
    variant = 'page',
    mode = 'edit',
    initialRating = 5,
    initialComment = '',
}) => {
    const ratingGroupId = useId();
    const commentId = useId();
    const isView = mode === 'view';
    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');

    useEffect(() => {
        if (!open) return undefined;
        setRating(Number(initialRating) > 0 ? Number(initialRating) : 5);
        setHoverRating(0);
        setComment(initialComment || '');
        return undefined;
    }, [open, initialRating, initialComment]);

    if (!open) return null;

    const displayRating = hoverRating || rating;

    const handleSubmit = (event) => {
        event.preventDefault();
        if (busy || isView) return;
        onSubmit?.({ rating: Number(rating), comment: comment.trim() });
    };

    return (
        <div
            className={`review-submit-modal review-submit-modal--${variant}`}
            role="dialog"
            aria-modal="true"
            aria-label={title}
        >
            <div className="review-submit-modal__panel">
                <div className="review-submit-modal__head">
                    <div className="review-submit-modal__titles">
                        <h3 className="review-submit-modal__title">{title}</h3>
                        {subtitle ? (
                            <p className="review-submit-modal__subtitle">{subtitle}</p>
                        ) : null}
                    </div>
                    <button
                        type="button"
                        className="review-submit-modal__close"
                        onClick={onClose}
                        disabled={busy}
                        aria-label="Đóng"
                    >
                        ×
                    </button>
                </div>
                <form className="review-submit-modal__form" onSubmit={handleSubmit}>
                    <div
                        className="review-submit-modal__rating"
                        role="group"
                        aria-labelledby={ratingGroupId}
                        onMouseLeave={() => {
                            if (!isView && !busy) setHoverRating(0);
                        }}
                    >
                        <span id={ratingGroupId} className="review-submit-modal__label">
                            Điểm ({rating}/5)
                        </span>
                        <div className="review-submit-modal__stars">
                            {[1, 2, 3, 4, 5].map((value) => {
                                const active = value <= displayRating;
                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        className={`review-submit-modal__star${
                                            active ? ' is-active' : ''
                                        }`}
                                        disabled={busy || isView}
                                        aria-label={`${value} sao`}
                                        aria-pressed={value <= rating}
                                        onMouseEnter={() => {
                                            if (!isView && !busy) setHoverRating(value);
                                        }}
                                        onClick={() => {
                                            if (!isView && !busy) setRating(value);
                                        }}
                                    >
                                        <StarIcon
                                            width={36}
                                            height={36}
                                            fill={active ? 'currentColor' : 'none'}
                                            stroke="currentColor"
                                            strokeWidth={1.5}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <label className="review-submit-modal__label" htmlFor={commentId}>
                        Nhận xét {isView ? '' : '(tuỳ chọn)'}
                    </label>
                    <textarea
                        id={commentId}
                        className="review-submit-modal__textarea"
                        rows={3}
                        maxLength={2000}
                        value={comment}
                        disabled={busy || isView}
                        placeholder={isView ? 'Không có nhận xét.' : 'Chia sẻ trải nghiệm làm việc...'}
                        onChange={(e) => setComment(e.target.value)}
                    />

                    <div className="review-submit-modal__actions">
                        {isView ? (
                            <button
                                type="button"
                                className="btn btn--primary"
                                onClick={onClose}
                                disabled={busy}
                            >
                                Đóng
                            </button>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    className="btn btn--ghost"
                                    onClick={onClose}
                                    disabled={busy}
                                >
                                    Huỷ
                                </button>
                                <button type="submit" className="btn btn--primary" disabled={busy}>
                                    {busy ? 'Đang gửi...' : 'Gửi đánh giá'}
                                </button>
                            </>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReviewSubmitModal;
