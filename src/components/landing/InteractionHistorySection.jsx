import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import JobCard from '../job/JobCard.jsx';
import { ClockIcon } from '../common/icons.jsx';
import { fetchDedupedInteractionPage } from '../../utils/jobQuery.js';
import { ROUTES } from '../../routes/path.js';

const PREVIEW_SIZE = 4;

const InteractionHistorySection = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        (async () => {
            setLoading(true);
            setError('');
            try {
                const pageData = await fetchDedupedInteractionPage(0, PREVIEW_SIZE);
                if (!cancelled) {
                    setJobs(pageData.content || []);
                }
            } catch {
                if (!cancelled) {
                    setError('Không thể tải lịch sử tương tác.');
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
                    <ClockIcon width={22} height={22} aria-hidden="true" />
                    Lịch sử tương tác
                </h2>
                <div className="landing-section__header-actions">
                    <Link to={ROUTES.CANDIDATE_INTERACTIONS} className="landing-section__link">
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

            {!error && !loading && jobs.length === 0 && (
                <p className="landing-section__empty">
                    Bạn chưa xem hoặc lưu việc làm nào. Hãy khám phá danh sách việc làm.
                </p>
            )}

            {jobs.length > 0 && (
                <div className="landing-jobs__grid landing-jobs__grid--compact">
                    {jobs.map((job, index) => (
                        <JobCard
                            key={`${job.id}-${job.interactionType}-${index}`}
                            job={job}
                            compact
                        />
                    ))}
                </div>
            )}
        </section>
    );
};

export default InteractionHistorySection;
