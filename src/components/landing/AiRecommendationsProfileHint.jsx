import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../routes/path.js';
import {
    EMPTY_RECOMMENDATION_GAPS,
    fetchRecommendationProfileGaps,
    hasRecommendationGaps,
    summarizeRecommendationGaps,
} from '../../utils/recommendationProfileGaps.js';

/** Banner ngắn trên homepage khi AI vẫn trả job nhưng hồ sơ chưa đủ (cold start). */
const AiRecommendationsProfileHint = () => {
    const [gaps, setGaps] = useState(EMPTY_RECOMMENDATION_GAPS);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const next = await fetchRecommendationProfileGaps();
                if (!cancelled) setGaps(next);
            } catch {
                if (!cancelled) {
                    setGaps({ location: true, skills: true, availability: true });
                }
            } finally {
                if (!cancelled) setReady(true);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    if (!ready || !hasRecommendationGaps(gaps)) return null;

    const summary = summarizeRecommendationGaps(gaps);
    if (!summary) return null;

    const href =
        summary.primaryHref === 'availability'
            ? ROUTES.CANDIDATE_AVAILABILITY
            : ROUTES.CANDIDATE_PROFILE;
    const linkText =
        summary.primaryHref === 'availability' ? 'Thiết lập lịch rảnh' : 'Cập nhật hồ sơ';

    return (
        <p className="ai-profile-hint">
            <span>
                Đang ở chế độ khám phá — {summary.label.toLowerCase()}. Bổ sung để gợi ý chính xác hơn.
            </span>{' '}
            <Link to={href} className="ai-profile-hint__link">
                {linkText} →
            </Link>
        </p>
    );
};

export default AiRecommendationsProfileHint;
