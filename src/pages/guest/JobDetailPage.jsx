import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { fetchJobDetail } from '../../apis/JobApi.jsx';
import JobListSearch from '../../components/joblist/JobListSearch.jsx';
import JobCompactCard from '../../components/jobdetail/JobCompactCard.jsx';
import JobDetailPanel from '../../components/jobdetail/JobDetailPanel.jsx';
import BookmarkLoginRedirect from '../../components/job/BookmarkLoginRedirect.jsx';
import { ROUTES } from '../../routes/path.js';
import {
    fetchJobListPage,
    isSearchQuery,
    JOB_DETAIL_SIDEBAR_PAGE_SIZE,
    LANDING_PREVIEW_SIZE,
    buildJobListSearchParams,
    parseJobListSearchParams,
} from '../../utils/jobQuery.js';
import '../../assets/styles/JobDetailPageStyle.css';

const mergeJobPages = (existing, incoming) => {
    const seen = new Set(existing.map((item) => item.id));
    const next = [...existing];
    incoming.forEach((item) => {
        if (!seen.has(item.id)) {
            seen.add(item.id);
            next.push(item);
        }
    });
    return next;
};

const JobDetailPage = () => {
    const { jobId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    const [jobs, setJobs] = useState([]);
    const [listLoading, setListLoading] = useState(true);
    const [listError, setListError] = useState('');
    const [loadingMore, setLoadingMore] = useState(false);
    const [listPage, setListPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [activeQuery, setActiveQuery] = useState(null);

    const [job, setJob] = useState(null);
    const [detailLoading, setDetailLoading] = useState(true);
    const [detailError, setDetailError] = useState('');

    const layoutRef = useRef(null);
    const detailColRef = useRef(null);
    const activeQueryRef = useRef(null);

    const urlQuery = parseJobListSearchParams(searchParams);
    const searchSuffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const selectedJobId = Number(jobId);

    const hasMore = listPage + 1 < totalPages;

    const listBackUrl = useMemo(
        () => (searchSuffix ? `${ROUTES.JOB_LIST}${searchSuffix}` : ROUTES.JOB_LIST),
        [searchSuffix]
    );

    const applyListPage = useCallback((pageData, query, append) => {
        setJobs((prev) => (append ? mergeJobPages(prev, pageData.content) : pageData.content));
        setListPage(pageData.currentPage);
        setTotalPages(pageData.totalPages);
        setTotalElements(pageData.totalElements);
        setActiveQuery(query);
        activeQueryRef.current = query;
    }, []);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            setListLoading(true);
            setListError('');
            setLoadingMore(false);
            try {
                const parsedQuery = parseJobListSearchParams(searchParams);
                const resolvedQuery = parsedQuery?.nearMe ? null : parsedQuery;
                const pageData = await fetchJobListPage(
                    0,
                    JOB_DETAIL_SIDEBAR_PAGE_SIZE,
                    resolvedQuery
                );
                if (!cancelled) {
                    applyListPage(pageData, resolvedQuery, false);
                }
            } catch (err) {
                if (!cancelled) {
                    setListError(err.message || 'Không thể tải danh sách việc làm. Vui lòng thử lại sau.');
                    setJobs([]);
                    setListPage(0);
                    setTotalPages(0);
                    setTotalElements(0);
                }
            } finally {
                if (!cancelled) {
                    setListLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [searchParams, applyListPage]);

    useEffect(() => {
        let cancelled = false;

        if (!jobId) {
            setJob(null);
            setDetailError('');
            setDetailLoading(false);
            return undefined;
        }

        (async () => {
            setDetailLoading(true);
            setDetailError('');
            try {
                const res = await fetchJobDetail(jobId);
                if (!cancelled) {
                    setJob(res.data.data);
                }
            } catch (err) {
                if (!cancelled) {
                    setJob(null);
                    setDetailError(
                        err.response?.status === 404
                            ? 'Không tìm thấy việc làm này hoặc tin đã đóng.'
                            : err.message || 'Không thể tải chi tiết việc làm. Vui lòng thử lại sau.'
                    );
                }
            } finally {
                if (!cancelled) {
                    setDetailLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [jobId]);

    useEffect(() => {
        const layout = layoutRef.current;
        const detailCol = detailColRef.current;
        if (!layout || !detailCol) return undefined;

        const syncListHeight = () => {
            const panel = detailCol.querySelector('.job-detail-panel');
            if (!panel) {
                layout.style.removeProperty('--job-detail-panel-height');
                return;
            }
            layout.style.setProperty('--job-detail-panel-height', `${panel.offsetHeight}px`);
        };

        syncListHeight();

        const panel = detailCol.querySelector('.job-detail-panel');
        if (!panel || typeof ResizeObserver === 'undefined') {
            return undefined;
        }

        const observer = new ResizeObserver(syncListHeight);
        observer.observe(panel);

        return () => observer.disconnect();
    }, [job, detailLoading, detailError, jobs.length]);

    const handleLoadMore = async () => {
        if (loadingMore || listLoading || !hasMore) return;

        setLoadingMore(true);
        setListError('');
        try {
            const nextPage = listPage + 1;
            const pageData = await fetchJobListPage(
                nextPage,
                JOB_DETAIL_SIDEBAR_PAGE_SIZE,
                activeQueryRef.current
            );
            applyListPage(pageData, activeQueryRef.current, true);
        } catch (err) {
            setListError(err.message || 'Không thể tải thêm việc làm. Vui lòng thử lại sau.');
        } finally {
            setLoadingMore(false);
        }
    };

    const handleSearch = ({ keyword, city, ward, nearMe }) => {
        if (nearMe) {
            return;
        }

        if (keyword || city || ward) {
            setSearchParams(buildJobListSearchParams({ keyword, city, ward }));
        } else {
            setSearchParams({});
        }
    };

    const handleReset = () => {
        setSearchParams({});
    };

    return (
        <div className="job-detail-page">
            <BookmarkLoginRedirect />

            <div className="job-detail-page__toolbar">
                <Link to={listBackUrl} className="job-detail-page__back">
                    ← Danh sách việc làm
                </Link>
            </div>

            <JobListSearch
                initialKeyword={urlQuery?.keyword || ''}
                initialCity={urlQuery?.city || ''}
                initialWard={urlQuery?.ward || ''}
                onSearch={handleSearch}
                loading={listLoading}
            />

            {isSearchQuery(activeQuery) && (
                <div className="job-detail-page__filter-actions">
                    <button type="button" className="job-detail-page__reset" onClick={handleReset}>
                        Xóa bộ lọc
                    </button>
                </div>
            )}

            <div className="job-detail-page__layout" ref={layoutRef}>
                <aside className="job-detail-page__list-col">
                    {listError && <p className="job-detail-page__error">{listError}</p>}

                    {listLoading && jobs.length === 0 && (
                        <div className="job-detail-page__list-scroll">
                            <div className="job-detail-page__list">
                                {Array.from({ length: LANDING_PREVIEW_SIZE }).map((_, i) => (
                                    <div key={i} className="job-compact-card job-compact-card--skeleton" />
                                ))}
                            </div>
                        </div>
                    )}

                    {!listLoading && !listError && jobs.length === 0 && (
                        <p className="job-detail-page__empty">Chưa có việc làm phù hợp.</p>
                    )}

                    {jobs.length > 0 && (
                        <div className="job-detail-page__list-scroll">
                            <div className="job-detail-page__list">
                                {jobs.map((item) => (
                                    <JobCompactCard
                                        key={item.id}
                                        job={item}
                                        active={item.id === selectedJobId}
                                        searchSuffix={searchSuffix}
                                    />
                                ))}
                            </div>

                            {(hasMore || loadingMore) && (
                                <div className="job-detail-page__load-more">
                                    {totalElements > 0 && (
                                        <p className="job-detail-page__load-more-info">
                                            Đã hiển thị {jobs.length} / {totalElements} việc làm
                                        </p>
                                    )}
                                    <button
                                        type="button"
                                        className="btn btn--ghost job-detail-page__load-more-btn"
                                        disabled={loadingMore || !hasMore}
                                        onClick={handleLoadMore}
                                    >
                                        {loadingMore ? 'Đang tải...' : 'Xem thêm việc làm'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </aside>

                <section className="job-detail-page__detail-col" ref={detailColRef}>
                    <JobDetailPanel
                        job={job}
                        loading={detailLoading}
                        error={detailError}
                        onApplied={() => setJob((prev) => (prev ? { ...prev, applied: true } : prev))}
                    />
                </section>
            </div>
        </div>
    );
};

export default JobDetailPage;
