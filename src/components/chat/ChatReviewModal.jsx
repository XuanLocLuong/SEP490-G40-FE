import { useState } from 'react';

/**
 * Lightweight review form used inside chat dock.
 * Submits { rating, comment } via parent onSubmit.
 */
const ChatReviewModal = ({ open, busy, onClose, onSubmit }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    if (!open) return null;

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit?.({ rating: Number(rating), comment: comment.trim() });
    };

    return (
        <div className="chat-review-modal" role="dialog" aria-modal="true" aria-label="Viết đánh giá">
            <div className="chat-review-modal__panel">
                <div className="chat-review-modal__head">
                    <h3 className="chat-review-modal__title">Viết đánh giá</h3>
                    <button
                        type="button"
                        className="chat-review-modal__close"
                        onClick={onClose}
                        disabled={busy}
                        aria-label="Đóng"
                    >
                        ×
                    </button>
                </div>
                <form className="chat-review-modal__form" onSubmit={handleSubmit}>
                    <label className="chat-review-modal__label" htmlFor="chat-review-rating">
                        Điểm (1–5)
                    </label>
                    <select
                        id="chat-review-rating"
                        className="chat-review-modal__select"
                        value={rating}
                        disabled={busy}
                        onChange={(e) => setRating(e.target.value)}
                    >
                        {[5, 4, 3, 2, 1].map((n) => (
                            <option key={n} value={n}>
                                {n} sao
                            </option>
                        ))}
                    </select>

                    <label className="chat-review-modal__label" htmlFor="chat-review-comment">
                        Nhận xét (tuỳ chọn)
                    </label>
                    <textarea
                        id="chat-review-comment"
                        className="chat-review-modal__textarea"
                        rows={3}
                        maxLength={2000}
                        value={comment}
                        disabled={busy}
                        placeholder="Chia sẻ trải nghiệm làm việc..."
                        onChange={(e) => setComment(e.target.value)}
                    />

                    <div className="chat-review-modal__actions">
                        <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy}>
                            Huỷ
                        </button>
                        <button type="submit" className="btn btn--primary" disabled={busy}>
                            {busy ? 'Đang gửi...' : 'Gửi đánh giá'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChatReviewModal;
