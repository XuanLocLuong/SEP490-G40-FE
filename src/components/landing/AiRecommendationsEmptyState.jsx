import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../routes/path.js';
import {
    EMPTY_RECOMMENDATION_GAPS,
    fetchRecommendationProfileGaps,
    hasRecommendationGaps,
} from '../../utils/recommendationProfileGaps.js';

const AiRecommendationsEmptyState = () => {
    const [loading, setLoading] = useState(true);
    const [missing, setMissing] = useState(EMPTY_RECOMMENDATION_GAPS);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const next = await fetchRecommendationProfileGaps();
                if (!cancelled) setMissing(next);
            } catch {
                if (!cancelled) {
                    setMissing({ location: true, skills: true, availability: true });
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    const hasMissing = useMemo(() => hasRecommendationGaps(missing), [missing]);

    if (loading) {
        return <p className="landing-section__empty">Đang kiểm tra thông tin hồ sơ...</p>;
    }

    if (!hasMissing) {
        return (
            <div className="landing-section__empty ai-empty-state">
                <p className="ai-empty-state__title">
                    Hiện chưa có việc phù hợp với hồ sơ và lịch rảnh của bạn.
                </p>
                <div className="ai-empty-state__actions">
                    <Link to={ROUTES.JOB_LIST} className="btn btn--ghost">
                        Xem tất cả việc làm
                    </Link>
                    <Link to={ROUTES.CANDIDATE_AVAILABILITY} className="btn btn--primary">
                        Cập nhật lịch rảnh
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="landing-section__empty ai-empty-state">
            <p className="ai-empty-state__title">
                Bạn cần cập nhật thêm thông tin để nhận gợi ý chính xác hơn.
            </p>
            <ul className="ai-empty-state__checklist">
                {missing.location && <li>Thiếu vị trí làm việc (tọa độ).</li>}
                {missing.skills && <li>Chưa có kỹ năng trong hồ sơ.</li>}
                {missing.availability && <li>Chưa có lịch rảnh.</li>}
            </ul>
            <div className="ai-empty-state__actions">
                {(missing.location || missing.skills) && (
                    <Link to={ROUTES.CANDIDATE_PROFILE} className="btn btn--ghost">
                        Cập nhật hồ sơ
                    </Link>
                )}
                {missing.availability && (
                    <Link to={ROUTES.CANDIDATE_AVAILABILITY} className="btn btn--primary">
                        Thiết lập lịch rảnh
                    </Link>
                )}
            </div>
        </div>
    );
};

export default AiRecommendationsEmptyState;
