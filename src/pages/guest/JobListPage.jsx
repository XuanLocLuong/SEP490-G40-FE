import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import JobListSearch from '../../components/joblist/JobListSearch.jsx';
import JobListItem from '../../components/job/JobListItem.jsx';
import BookmarkLoginRedirect from '../../components/job/BookmarkLoginRedirect.jsx';
import AiRecommendationsEmptyState from '../../components/landing/AiRecommendationsEmptyState.jsx';
import AiRecommendationsPendingOfferHint from '../../components/landing/AiRecommendationsPendingOfferHint.jsx';
import AiRecommendationsProfileHint from '../../components/landing/AiRecommendationsProfileHint.jsx';
import ScheduleSoftWarningBanner from '../../components/candidate/ScheduleSoftWarningBanner.jsx';
import { useAuth } from '../../contexts/authContext.js';
import { useScheduleSummary } from '../../hooks/useScheduleSummary.js';
import { USER_ROLES } from '../../utils/Constants.jsx';
import {
    applyCandidateScheduleAccess,
    fetchJobListPage,
    isSearchQuery,
    isSearchableJobListSection,
    INTERACTION_TYPES,
    JOB_LIST_PAGE_SIZE,
    JOB_LIST_SECTIONS,
    JOB_LIST_SECTION_META,
    LANDING_PREVIEW_SIZE,
    buildJobListSearchParams,
    parseJobListSearchParams,
    parseJobListSection,
    parseInteractionType,
} from '../../utils/jobQuery.js';
import { resolveJobListBack, buildHomeScrollState } from '../../utils/jobNavReturn.js';
import { RECOMMENDATION_LOAD_ERROR_MESSAGE } from '../../utils/aiErrorMessage.js';
import '../../assets/styles/JobListPageStyle.css';

const INTERACTION_TABS = [
    {
        value: INTERACTION_TYPES.SAVED,
        label: 'Đã lưu',
        subtitle: 'Những việc làm bạn đang lưu để xem lại',
        empty: 'Bạn chưa lưu việc làm nào.',
    },
    {
        value: INTERACTION_TYPES.VIEWED,
        label: 'Đã xem',
        subtitle: 'Những việc làm bạn đã mở trang chi tiết',
        empty: 'Bạn chưa xem việc làm nào.',
    },
    {
        value: INTERACTION_TYPES.APPLIED,
        label: 'Đã ứng tuyển',
        subtitle: 'Những việc làm bạn đã ứng tuyển',
        empty: 'Bạn chưa ứng tuyển việc làm nào.',
    },
];

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

    const section = useMemo(() => parseJobListSection(searchParams), [searchParams]);
    const sectionMeta = section ? JOB_LIST_SECTION_META[section] : null;
    const isAiSection = section === JOB_LIST_SECTIONS.AI;
    const isInteractionSection = section === JOB_LIST_SECTIONS.INTERACTIONS;
    const interactionType = useMemo(
        () => (isInteractionSection ? parseInteractionType(searchParams) : null),
        [isInteractionSection, searchParams]
    );
    const interactionTab = useMemo(
        () => INTERACTION_TABS.find((tab) => tab.value === interactionType) || null,
        [interactionType]
    );
    const { summary: scheduleSummary, loading: scheduleSummaryLoading } = useScheduleSummary({
        enabled: isCandidate && isAiSection,
    });
    const listBack = useMemo(
        () => resolveJobListBack(auth?.role, section),
        [auth?.role, section]
    );
    const showSearch = !section || isSearchableJobListSection(section);

    const urlQuery = useMemo(() => {
        if (section === JOB_LIST_SECTIONS.INTERACTIONS) {
            return { actionType: parseInteractionType(searchParams) };
        }
        if (section && !isSearchableJobListSection(section)) return null;
        const parsed = parseJobListSearchParams(searchParams);
        return applyCandidateScheduleAccess(parsed, isCandidate);
    }, [searchParams, isCandidate, section]);

    const applyPageData = (pageData, query) => {
        setJobs(pageData.content || []);
        setTotalPages(pageData.totalPages || 0);
        setTotalElements(pageData.totalElements || 0);
        setPage(pageData.currentPage ?? pageData.number ?? 0);
        setActiveQuery(query);
    };

    const loadPage = useCallback(
        async (pageNum, query, listSection) => {
            setLoading(true);
            setError('');
            try {
                const pageData = await fetchJobListPage(
                    pageNum,
                    JOB_LIST_PAGE_SIZE,
                    query,
                    listSection
                );
                applyPageData(pageData, query);
            } catch (err) {
                setError(
                    isAiSection
                        ? RECOMMENDATION_LOAD_ERROR_MESSAGE
                        : err.message ||
                          sectionMeta?.error ||
                          'Không thể tải danh sách việc làm. Vui lòng thử lại sau.'
                );
                setJobs([]);
            } finally {
                setLoading(false);
            }
        },
        [sectionMeta?.error, isAiSection]
    );

    useEffect(() => {
        let cancelled = false;

        (async () => {
            setLoading(true);
            setError('');
            const listSection = parseJobListSection(searchParams);
            try {
                const parsedQuery =
                    listSection === JOB_LIST_SECTIONS.INTERACTIONS
                        ? { actionType: parseInteractionType(searchParams) }
                        : listSection && !isSearchableJobListSection(listSection)
                        ? null
                        : applyCandidateScheduleAccess(
                              parseJobListSearchParams(searchParams),
                              isCandidate
                          );
                const pageData = await fetchJobListPage(
                    0,
                    JOB_LIST_PAGE_SIZE,
                    parsedQuery,
                    listSection
                );
                if (!cancelled) {
                    applyPageData(pageData, parsedQuery);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        listSection === JOB_LIST_SECTIONS.AI
                            ? RECOMMENDATION_LOAD_ERROR_MESSAGE
                            : err.message ||
                              sectionMeta?.error ||
                              'Không thể tải danh sách việc làm. Vui lòng thử lại sau.'
                    );
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
    }, [searchParams, isCandidate, section, sectionMeta?.error]);

    const handleSearch = (payload) => {
        const nextQuery = applyCandidateScheduleAccess(payload, isCandidate);
        const keepSection = isSearchableJobListSection(section) ? section : null;
        if (isSearchQuery(nextQuery)) {
            setSearchParams(buildJobListSearchParams(nextQuery, { section: keepSection }));
        } else if (keepSection) {
            setSearchParams(buildJobListSearchParams(null, { section: keepSection }));
        } else {
            setSearchParams({});
        }
    };

    const handlePageChange = (nextPage) => {
        if (nextPage < 0 || nextPage >= totalPages || nextPage === page) return;
        loadPage(nextPage, activeQuery, section);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleReset = () => {
        if (isSearchableJobListSection(section)) {
            setSearchParams(buildJobListSearchParams(null, { section }));
        } else {
            setSearchParams({});
        }
    };

    const handleInteractionTabChange = (nextType) => {
        if (nextType === interactionType || loading) return;
        setSearchParams({
            section: JOB_LIST_SECTIONS.INTERACTIONS,
            actionType: nextType,
        });
    };

    const handleSavedChange = (jobId, saved) => {
        if (!isInteractionSection || interactionType !== INTERACTION_TYPES.SAVED || saved) {
            return;
        }
        setJobs((current) => current.filter((job) => Number(job.id) !== Number(jobId)));
        const targetPage = jobs.length === 1 && page > 0 ? page - 1 : page;
        loadPage(targetPage, activeQuery, section);
    };

    const searching = showSearch && isSearchQuery(activeQuery);
    const isFirstPage = page <= 0;
    const isLastPage = totalPages > 0 && page >= totalPages - 1;
    return (
        <div className="job-list-page">
            <BookmarkLoginRedirect />
            <header className="job-list-page__header">
                <Link
                    to={listBack.path}
                    state={buildHomeScrollState(listBack.scrollToSection)}
                    className="job-list-page__back"
                >
                    ← {listBack.label}
                </Link>
                <h1 className="job-list-page__title">
                    {sectionMeta?.title || 'Việc làm nổi bật'}
                </h1>
            </header>

            {isInteractionSection && (
                <div
                    className="job-list-page__interaction-tabs"
                    role="tablist"
                    aria-label="Loại lịch sử tương tác"
                >
                    {INTERACTION_TABS.map((tab) => {
                        const active = tab.value === interactionType;
                        return (
                            <button
                                key={tab.value}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                className={`job-list-page__interaction-tab${
                                    active ? ' job-list-page__interaction-tab--active' : ''
                                }`}
                                onClick={() => handleInteractionTabChange(tab.value)}
                                disabled={loading}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            )}

            {showSearch && (
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
            )}

            {error && <p className="job-list-page__error">{error}</p>}

            <div className="job-list-page__results-meta">
                <div className="job-list-page__results-text">
                    {searching && (
                        <p className="job-list-page__search-hint">Kết quả tìm kiếm</p>
                    )}
                    <p className="job-list-page__subtitle">
                        {totalElements > 0
                            ? `${totalElements} việc làm`
                            : searching
                              ? 'Không có việc làm phù hợp'
                              : isInteractionSection
                                ? interactionTab?.empty
                              : section
                                ? sectionMeta?.empty
                                : 'Tìm việc part-time phù hợp với bạn'}
                    </p>
                    {section && totalElements > 0 && !searching && (
                        <p className="job-list-page__search-hint">
                            {isInteractionSection
                                ? interactionTab?.subtitle
                                : sectionMeta?.subtitle}
                        </p>
                    )}
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
                section === JOB_LIST_SECTIONS.AI ? (
                    <>
                        <ScheduleSoftWarningBanner
                            summary={scheduleSummary}
                            loading={scheduleSummaryLoading}
                            className="schedule-soft-banner--job-list"
                        />
                        <AiRecommendationsEmptyState />
                    </>
                ) : (
                    <div className="job-list-page__empty">
                        <p>
                            {searching
                                ? 'Chưa có việc làm phù hợp. Hãy thử bộ lọc khác.'
                                : isInteractionSection
                                  ? interactionTab?.empty
                                : sectionMeta?.empty ||
                                  'Chưa có việc làm phù hợp. Hãy thử bộ lọc khác.'}
                        </p>
                    </div>
                )
            )}

            {jobs.length > 0 && (
                <>
                    {section === JOB_LIST_SECTIONS.AI && (
                        <>
                            <ScheduleSoftWarningBanner
                                summary={scheduleSummary}
                                loading={scheduleSummaryLoading}
                                className="schedule-soft-banner--job-list"
                            />
                            <AiRecommendationsPendingOfferHint />
                            <AiRecommendationsProfileHint />
                        </>
                    )}
                    <div className="job-list-page__list">
                        {jobs.map((job, index) => (
                            <JobListItem
                                key={`${job.id}-${job.interactionType || ''}-${index}`}
                                job={job}
                                nearMe={Boolean(urlQuery?.nearMe) || section === 'ai'}
                                onSavedChange={handleSavedChange}
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
