import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import JobCard from '../job/JobCard.jsx';
import { SparklesIcon } from '../common/icons.jsx';
import { fetchRecommendedJobs } from '../../apis/RecommendationApi.jsx';
import { mapRecommendationToJob } from '../../utils/formatters.js';
import { ROUTES } from '../../routes/path.js';
import AiRecommendationsEmptyState from './AiRecommendationsEmptyState.jsx';
import AiRecommendationsProfileHint from './AiRecommendationsProfileHint.jsx';

const PREVIEW_SIZE = 4;

const AiRecommendationsSection = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        (async () => {
            setLoading(true);
            setError('');
            try {
                const res = await fetchRecommendedJobs(0, PREVIEW_SIZE);
                const content = res.data?.data?.content || [];
                if (!cancelled) {
                    setJobs(content.map(mapRecommendationToJob).filter(Boolean));
                }
            } catch {
                if (!cancelled) {
                    setError('Không thể tải gợi ý việc làm.');
                    setJobs([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <section className="landing-section landing-jobs candidate-home-section">
            <div className="landing-section__header">
                <h2 className="landing-section__title candidate-home-section__title">
                    <SparklesIcon width={22} height={22} aria-hidden="true" />
                    AI gợi ý cho bạn
                </h2>
                <div className="landing-section__header-actions">
                    <Link to={ROUTES.CANDIDATE_AI_SUGGESTIONS} className="landing-section__link">
                        Xem tất cả →
                    </Link>
                </div>
            </div>

            {loading && jobs.length === 0 && (
                <div className="landing-jobs__grid landing-jobs__grid--compact landing-jobs__grid--loading">
                    {Array.from({ length: PREVIEW_SIZE }).map((_, i) => (
                        <div key={i} className="job-card job-card--skeleton job-card--compact" />
                    ))}
                </div>
            )}

            {error && <p className="landing-section__error">{error}</p>}

            {!error && !loading && jobs.length === 0 && <AiRecommendationsEmptyState />}

            {jobs.length > 0 && (
                <>
                    <AiRecommendationsProfileHint />
                    <div className="landing-jobs__grid landing-jobs__grid--compact">
                        {jobs.map((job) => (
                            <JobCard key={job.id} job={job} compact showDistance />
                        ))}
                    </div>
                </>
            )}
        </section>
    );
};

export default AiRecommendationsSection;
