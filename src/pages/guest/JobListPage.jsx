import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import JobListSearch from '../../components/joblist/JobListSearch.jsx';
import JobListItem from '../../components/job/JobListItem.jsx';
import BookmarkLoginRedirect from '../../components/job/BookmarkLoginRedirect.jsx';
import { useAuth } from '../../contexts/authContext.js';
import { USER_ROLES } from '../../utils/Constants.jsx';
import {
    applyCandidateScheduleAccess,
    fetchJobListPage,
    isSearchQuery,
    JOB_LIST_PAGE_SIZE,
    LANDING_PREVIEW_SIZE,
    buildJobListSearchParams,
    parseJobListSearchParams,
} from '../../utils/jobQuery.js';
import '../../assets/styles/JobListPageStyle.css';

const JobListPage = () => {
    const { auth } = useAuth();
    const isCandidate = auth?.role === USER_ROLES.CANDIDATE;
    const [searchParams, setSearchParams] = useSearchParams();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [activeQuery, setActiveQuery] = useState(null);

    const urlQuery = useMemo(() => {
        const parsed = parseJobListSearchParams(searchParams);
        return applyCandidateScheduleAccess(parsed, isCandidate);
    }, [searchParams, isCandidate]);

    const loadPage = useCallback(async (pageNum, query) => {
        setLoading(true);
        setError('');
        try {
            const pageData = await fetchJobListPage(pageNum, JOB_LIST_PAGE_SIZE, query);
            setJobs(pageData.content);
            setTotalPages(pageData.totalPages);
            setTotalElements(pageData.totalElements);
            setPage(pageData.currentPage);
            setActiveQuery(query);
        } catch (err) {
            setError(err.message || 'Không thể tải danh sách việc làm. Vui lòng thử lại sau.');
            setJobs([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            setLoading(true);
            setError('');
            try {
                const parsedQuery = applyCandidateScheduleAccess(
                    parseJobListSearchParams(searchParams),
                    isCandidate
                );
                const pageData = await fetchJobListPage(0, JOB_LIST_PAGE_SIZE, parsedQuery);
                if (!cancelled) {
                    setJobs(pageData.content);
                    setTotalPages(pageData.totalPages);
                    setTotalElements(pageData.totalElements);
                    setPage(pageData.currentPage);
                    setActiveQuery(parsedQuery);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.message || 'Không thể tải danh sách việc làm. Vui lòng thử lại sau.');
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
    }, [searchParams, isCandidate]);

    const handleSearch = (payload) => {
        const nextQuery = applyCandidateScheduleAccess(payload, isCandidate);
        if (isSearchQuery(nextQuery)) {
            setSearchParams(buildJobListSearchParams(nextQuery));
        } else {
            setSearchParams({});
        }
    };

    const handlePageChange = (nextPage) => {
        if (nextPage < 0 || nextPage >= totalPages || nextPage === page) return;
        loadPage(nextPage, activeQuery);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleReset = () => {
        setSearchParams({});
    };

    const searching = isSearchQuery(activeQuery);
    const isFirstPage = page <= 0;
    const isLastPage = totalPages > 0 && page >= totalPages - 1;

    return (
        <div className="job-list-page">
            <BookmarkLoginRedirect />
            <header className="job-list-page__header">
                <h1 className="job-list-page__title">Danh sách việc làm</h1>
            </header>

            <JobListSearch
                initialKeyword={urlQuery?.keyword || ''}
                initialCity={urlQuery?.city || ''}
                initialWard={urlQuery?.ward || ''}
                initialJobType={urlQuery?.jobType || ''}
                initialSalaryMin={urlQuery?.salaryMin ?? null}
                initialSalaryMax={urlQuery?.salaryMax ?? null}
                initialSkillIds={urlQuery?.skillIds || []}
                initialSchedules={urlQuery?.schedules || []}
                initialNearMe={Boolean(urlQuery?.nearMe)}
                initialLatitude={urlQuery?.latitude ?? null}
                initialLongitude={urlQuery?.longitude ?? null}
                onSearch={handleSearch}
                loading={loading}
            />

            {error && <p className="job-list-page__error">{error}</p>}

            <div className="job-list-page__results-meta">
                <div className="job-list-page__results-text">
                    {searching && (
                        <p className="job-list-page__search-hint">Kết quả tìm kiếm</p>
                    )}
                    <p className="job-list-page__subtitle">
                        {totalElements > 0
                            ? `${totalElements} việc làm đang tuyển`
                            : searching
                              ? 'Không có việc làm phù hợp'
                              : 'Tìm việc part-time phù hợp với bạn'}
                    </p>
                </div>
                {searching && (
                    <button type="button" className="job-list-page__reset" onClick={handleReset}>
                        Xóa bộ lọc
                    </button>
                )}
            </div>

            {loading && jobs.length === 0 && (
                <div className="job-list-page__list">
                    {Array.from({ length: LANDING_PREVIEW_SIZE }).map((_, i) => (
                        <div key={i} className="job-list-item job-list-item--skeleton" />
                    ))}
                </div>
            )}

            {!loading && !error && jobs.length === 0 && (
                <p className="job-list-page__empty">Chưa có việc làm phù hợp. Hãy thử bộ lọc khác.</p>
            )}

            {jobs.length > 0 && (
                <>
                    <div className="job-list-page__list">
                        {jobs.map((job) => (
                            <JobListItem
                                key={job.id}
                                job={job}
                                nearMe={Boolean(urlQuery?.nearMe)}
                            />
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <nav className="job-list-pagination" aria-label="Phân trang">
                            <button
                                type="button"
                                className="btn btn--ghost"
                                disabled={isFirstPage || loading}
                                onClick={() => handlePageChange(page - 1)}
                                aria-disabled={isFirstPage || loading}
                            >
                                Trước
                            </button>
                            <span className="job-list-pagination__info">
                                Trang {page + 1} / {totalPages}
                            </span>
                            <button
                                type="button"
                                className="btn btn--ghost"
                                disabled={isLastPage || loading}
                                onClick={() => handlePageChange(page + 1)}
                                aria-disabled={isLastPage || loading}
                            >
                                Sau
                            </button>
                        </nav>
                    )}
                </>
            )}
        </div>
    );
};

export default JobListPage;
