import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import JobCard from '../job/JobCard.jsx';
import { TrendingIcon } from '../common/icons.jsx';
import { fetchUrgentJobs } from '../../apis/JobApi.jsx';
import { ROUTES } from '../../routes/path.js';

const PREVIEW_SIZE = 4;

const UrgentJobsSection = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        (async () => {
            setLoading(true);
            setError('');
            try {
                const res = await fetchUrgentJobs({ page: 0, size: PREVIEW_SIZE });
                if (!cancelled) {
                    setJobs(res.data?.data?.content || []);
                }
            } catch {
                if (!cancelled) {
                    setError('Không thể tải việc làm tuyển gấp.');
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
                    <TrendingIcon width={22} height={22} aria-hidden="true" />
                    Việc làm tuyển gấp
                </h2>
                <div className="landing-section__header-actions">
                    <Link to={ROUTES.JOB_LIST_URGENT} className="landing-section__link">
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
                <p className="landing-section__empty">Chưa có việc làm tuyển gấp.</p>
            )}

            {jobs.length > 0 && (
                <div className="landing-jobs__grid landing-jobs__grid--compact">
                    {jobs.map((job) => (
                        <JobCard key={job.id} job={job} compact />
                    ))}
                </div>
            )}
        </section>
    );
};

export default UrgentJobsSection;
