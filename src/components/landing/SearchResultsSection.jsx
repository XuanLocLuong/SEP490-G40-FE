import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import JobCard from '../job/JobCard.jsx';
import { ROUTES } from '../../routes/path.js';
import {
    fetchJobListPage,
    LANDING_PREVIEW_SIZE,
    buildJobListSearchParams,
} from '../../utils/jobQuery.js';

const SearchResultsSection = ({ query, onClear }) => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        (async () => {
            setLoading(true);
            setError('');
            try {
                const pageData = await fetchJobListPage(0, LANDING_PREVIEW_SIZE, query);
                if (!cancelled) {
                    setJobs(pageData.content);
                }
            } catch {
                if (!cancelled) {
                    setError('Không thể tải kết quả tìm kiếm. Vui lòng thử lại sau.');
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
    }, [query]);

    const viewAllUrl = `${ROUTES.JOB_LIST}?${buildJobListSearchParams(query).toString()}`;

    return (
        <section className="landing-section landing-jobs landing-jobs--search">
            <div className="landing-section__header">
                <div>
                    <h2 className="landing-section__title">Kết quả tìm kiếm</h2>
                    <p className="landing-section__desc">Từ toàn bộ việc đang tuyển trên JobLink</p>
                </div>
                <div className="landing-section__header-actions">
                    <button type="button" className="landing-section__link" onClick={onClear}>
                        Xóa bộ lọc
                    </button>
                    <Link to={viewAllUrl} className="landing-section__link">
                        Xem tất cả →
                    </Link>
                </div>
            </div>

            {loading && jobs.length === 0 && (
                <div className="landing-jobs__grid landing-jobs__grid--loading">
                    {Array.from({ length: LANDING_PREVIEW_SIZE }).map((_, i) => (
                        <div key={i} className="job-card job-card--skeleton" />
                    ))}
                </div>
            )}

            {error && <p className="landing-section__error">{error}</p>}

            {!error && !loading && jobs.length === 0 && (
                <p className="landing-section__empty">Chưa có việc làm phù hợp. Hãy thử bộ lọc khác.</p>
            )}

            {jobs.length > 0 && (
                <div className="landing-jobs__grid">
                    {jobs.map((job) => (
                        <JobCard key={job.id} job={job} />
                    ))}
                </div>
            )}
        </section>
    );
};

export default SearchResultsSection;
