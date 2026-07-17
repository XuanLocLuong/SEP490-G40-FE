import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import JobCard from '../job/JobCard.jsx';
import { ROUTES } from '../../routes/path.js';
import { fetchJobListPage, LANDING_PREVIEW_SIZE } from '../../utils/jobQuery.js';

const FeaturedJobsSection = ({ size = LANDING_PREVIEW_SIZE, compact = false }) => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const previewSize = Math.max(1, Number(size) || LANDING_PREVIEW_SIZE);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            setLoading(true);
            setError('');
            try {
                const pageData = await fetchJobListPage(0, previewSize, null);
                if (!cancelled) {
                    setJobs(pageData.content);
                }
            } catch {
                if (!cancelled) {
                    setError('Không thể tải danh sách việc làm. Vui lòng thử lại sau.');
                    setJobs([]);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [previewSize]);

    const gridClass = [
        'landing-jobs__grid',
        compact ? 'landing-jobs__grid--compact' : '',
        loading && jobs.length === 0 ? 'landing-jobs__grid--loading' : '',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <section className="landing-section landing-jobs">
            <div className="landing-section__header">
                <h2 className="landing-section__title">Việc làm nổi bật</h2>
                <div className="landing-section__header-actions">
                    <Link to={ROUTES.JOB_LIST} className="landing-section__link">
                        Xem tất cả →
                    </Link>
                </div>
            </div>

            {loading && jobs.length === 0 && (
                <div className={gridClass}>
                    {Array.from({ length: previewSize }).map((_, i) => (
                        <div
                            key={i}
                            className={`job-card job-card--skeleton${compact ? ' job-card--compact' : ''}`}
                        />
                    ))}
                </div>
            )}

            {error && <p className="landing-section__error">{error}</p>}

            {!error && !loading && jobs.length === 0 && (
                <p className="landing-section__empty">Chưa có việc làm nổi bật.</p>
            )}

            {jobs.length > 0 && (
                <div className={gridClass}>
                    {jobs.map((job) => (
                        <JobCard key={job.id} job={job} compact={compact} />
                    ))}
                </div>
            )}
        </section>
    );
};

export default FeaturedJobsSection;
