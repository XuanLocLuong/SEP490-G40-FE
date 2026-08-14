import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import recruiterJobApi, {
    getRecruiterJobApiErrorMessage,
} from '../../../apis/RecruiterJobApi.jsx';
import {
    fetchRecommendedCandidates,
    getInvitationSkipReasonMessage,
    getRecruiterRecommendationErrorMessage,
    sendCandidateInvitation,
} from '../../../apis/RecruiterRecommendationApi.jsx';
import CandidateRecommendationCard from '../../../components/recruiter/recommendations/CandidateRecommendationCard.jsx';
import SendInvitationModal from '../../../components/recruiter/recommendations/SendInvitationModal.jsx';
import { RefreshIcon } from '../../../components/common/icons.jsx';
import {
    getRecruiterApplicantsPath,
    getRecruiterJobSuggestionsPath,
    getRecruiterMyJobsPath,
    ROUTES,
} from '../../../routes/path.js';
import { openChatPanel, RECRUITMENT_CHANGED_EVENT } from '../../../utils/chatEvents.js';
import '../../../assets/styles/RecruiterRecommendationsStyle.css';

const PAGE_SIZE = 10;

const RecruiterRecommendationsPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const lockedJobId = searchParams.get('jobId') || '';
    const fromSource = searchParams.get('from') || '';
    const showBackToOverview = fromSource === 'overview';

    const [jobs, setJobs] = useState([]);
    const [selectedJobId, setSelectedJobId] = useState('');
    const [focusJob, setFocusJob] = useState(null);
    const [jobsLoading, setJobsLoading] = useState(true);
    const [jobsError, setJobsError] = useState('');

    const [candidates, setCandidates] = useState([]);
    const [recommendationsLoading, setRecommendationsLoading] = useState(false);
    const [recommendationsError, setRecommendationsError] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    /** null = đóng modal; [] không dùng; danh sách UV đang mời (1 hoặc nhiều). */
    const [inviteTargets, setInviteTargets] = useState(null);
    const [sending, setSending] = useState(false);
    const [sentCandidateIds, setSentCandidateIds] = useState(() => new Set());
    const [selectedCandidateIds, setSelectedCandidateIds] = useState(() => new Set());

    const selectedJob = useMemo(() => {
        if (focusJob && String(focusJob.id) === String(selectedJobId)) return focusJob;
        return jobs.find((job) => String(job.id) === String(selectedJobId)) ?? null;
    }, [jobs, selectedJobId, focusJob]);

    const selectableCandidates = useMemo(
        () =>
            candidates.filter(
                (c) => c?.candidateId != null && !sentCandidateIds.has(c.candidateId)
            ),
        [candidates, sentCandidateIds]
    );

    const selectedOnPageCount = useMemo(
        () =>
            selectableCandidates.filter((c) => selectedCandidateIds.has(c.candidateId))
                .length,
        [selectableCandidates, selectedCandidateIds]
    );

    const allSelectableSelected =
        selectableCandidates.length > 0 &&
        selectedOnPageCount === selectableCandidates.length;

    const loadRecommendations = useCallback(async (jobId, page = 0) => {
        if (!jobId) return;
        setRecommendationsLoading(true);
        setRecommendationsError('');
        try {
            const pageData = await fetchRecommendedCandidates(jobId, page, PAGE_SIZE);
            const content = Array.isArray(pageData?.content) ? pageData.content : [];
            setCandidates(content);
            setCurrentPage(pageData?.currentPage ?? page);
            setTotalPages(pageData?.totalPages ?? 0);
            setTotalElements(pageData?.totalElements ?? content.length);
            setSelectedCandidateIds(new Set());
        } catch (error) {
            setCandidates([]);
            setCurrentPage(0);
            setTotalPages(0);
            setTotalElements(0);
            setSelectedCandidateIds(new Set());
            setRecommendationsError(
                getRecruiterRecommendationErrorMessage(
                    error,
                    'Không thể tải danh sách ứng viên được gợi ý.'
                )
            );
        } finally {
            setRecommendationsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (lockedJobId) return;
        toast.info('Chọn tin tuyển dụng từ mục Tin của tôi để xem gợi ý ứng viên.');
        navigate(ROUTES.RECRUITER_MY_JOBS, { replace: true });
    }, [lockedJobId, navigate]);

    useEffect(() => {
        if (!lockedJobId) return;
        let active = true;

        const loadJobContext = async () => {
            try {
                const pageData = await recruiterJobApi.getMyJobs({
                    status: 'OPEN',
                    page: 0,
                    size: 100,
                });
                if (!active) return;
                const openJobs = Array.isArray(pageData?.content) ? pageData.content : [];
                setJobs(openJobs);
                setJobsError('');

                const matchedJob = openJobs.find(
                    (job) => String(job.id) === String(lockedJobId)
                );
                if (matchedJob) {
                    setFocusJob(null);
                    setSelectedJobId(String(matchedJob.id));
                    loadRecommendations(String(matchedJob.id), 0);
                    return;
                }

                try {
                    const detail = await recruiterJobApi.getJobDetail(lockedJobId);
                    if (!active) return;
                    if (detail?.status === 'OPEN') {
                        setFocusJob(detail);
                        setSelectedJobId(String(detail.id));
                        loadRecommendations(String(detail.id), 0);
                        return;
                    }
                    setJobsError('Tin tuyển dụng này không còn ở trạng thái đang tuyển.');
                } catch {
                    if (active) {
                        setJobsError('Không tìm thấy tin tuyển dụng hoặc bạn không có quyền truy cập.');
                    }
                }
            } catch (error) {
                if (active) {
                    setJobsError(
                        getRecruiterJobApiErrorMessage(
                            error,
                            'Không thể tải danh sách tin tuyển dụng.'
                        )
                    );
                }
            } finally {
                if (active) setJobsLoading(false);
            }
        };

        setJobsLoading(true);
        setSelectedJobId(String(lockedJobId));
        loadJobContext();
        return () => {
            active = false;
        };
    }, [lockedJobId, loadRecommendations]);

    // Refresh recommendations when invite is sent/accepted via chat float.
    useEffect(() => {
        const onRecruitmentChanged = (event) => {
            const detail = event?.detail || {};
            if (detail.kind && detail.kind !== 'invitation') return;
            if (!selectedJobId) return;
            if (
                detail.jobId != null &&
                String(detail.jobId) !== String(selectedJobId)
            ) {
                return;
            }
            void loadRecommendations(selectedJobId, currentPage);
        };

        window.addEventListener(RECRUITMENT_CHANGED_EVENT, onRecruitmentChanged);
        return () =>
            window.removeEventListener(RECRUITMENT_CHANGED_EVENT, onRecruitmentChanged);
    }, [selectedJobId, currentPage, loadRecommendations]);

    const backLink = useMemo(() => {
        if (showBackToOverview) {
            return { to: ROUTES.RECRUITER_HOME, label: '← Quay lại tổng quan' };
        }
        if (fromSource === 'applicants' && lockedJobId) {
            return {
                to: getRecruiterApplicantsPath(lockedJobId, { from: 'my-jobs' }),
                label: '← Quay lại ứng viên',
            };
        }
        return {
            to: getRecruiterMyJobsPath({ tab: 'open', jobId: lockedJobId || undefined }),
            label: '← Quay lại Tin của tôi',
        };
    }, [showBackToOverview, fromSource, lockedJobId]);

    const profileBackTo = useMemo(() => {
        if (!selectedJobId) {
            return { path: ROUTES.RECRUITER_MY_JOBS, label: 'Quay lại Tin của tôi' };
        }
        return {
            path: getRecruiterJobSuggestionsPath(selectedJobId, {
                from: fromSource || 'my-jobs',
            }),
            label: 'Quay lại gợi ý ứng viên',
        };
    }, [selectedJobId, fromSource]);

    const toggleSelect = (candidateId) => {
        if (candidateId == null || sentCandidateIds.has(candidateId)) return;
        setSelectedCandidateIds((prev) => {
            const next = new Set(prev);
            if (next.has(candidateId)) next.delete(candidateId);
            else next.add(candidateId);
            return next;
        });
    };

    const toggleSelectAllOnPage = () => {
        setSelectedCandidateIds((prev) => {
            const next = new Set(prev);
            if (allSelectableSelected) {
                selectableCandidates.forEach((c) => next.delete(c.candidateId));
            } else {
                selectableCandidates.forEach((c) => next.add(c.candidateId));
            }
            return next;
        });
    };

    const clearSelection = () => {
        setSelectedCandidateIds(new Set());
    };

    const openBulkInvite = () => {
        const targets = candidates.filter(
            (c) =>
                selectedCandidateIds.has(c.candidateId) &&
                !sentCandidateIds.has(c.candidateId)
        );
        if (targets.length === 0) {
            toast.info('Chọn ít nhất một ứng viên để gửi lời mời.');
            return;
        }
        setInviteTargets(targets);
    };

    const handleSendInvitation = async (message) => {
        if (!inviteTargets?.length || !selectedJobId || sending) return;
        setSending(true);

        try {
            const candidateIds = inviteTargets.map((c) => c.candidateId);
            const matchScores = Object.fromEntries(
                inviteTargets.map((c) => [c.candidateId, Number(c.matchScore) || 0])
            );

            const response = await sendCandidateInvitation(selectedJobId, {
                candidateIds,
                type: 'JOB_INVITATION',
                message: message || null,
                matchScores,
            });

            const results = Array.isArray(response?.results) ? response.results : [];
            const sentIds = results
                .filter((item) => item?.status === 'SENT')
                .map((item) => item.candidateId);
            const skipped = results.filter((item) => item?.status !== 'SENT');

            if (sentIds.length > 0) {
                setSentCandidateIds((previous) => {
                    const next = new Set(previous);
                    sentIds.forEach((id) => next.add(id));
                    return next;
                });
                setSelectedCandidateIds((previous) => {
                    const next = new Set(previous);
                    sentIds.forEach((id) => next.delete(id));
                    return next;
                });
            }

            const sentCount = Number(response?.sentCount) || sentIds.length;
            if (sentCount > 0) {
                toast.success(
                    sentCount === 1
                        ? `Đã gửi lời mời đến ${inviteTargets[0]?.fullName || 'ứng viên'}.`
                        : `Đã gửi ${sentCount}/${candidateIds.length} lời mời.`
                );
            }

            if (skipped.length > 0) {
                const first = skipped[0];
                toast.info(
                    skipped.length === 1
                        ? getInvitationSkipReasonMessage(first?.reason || first?.message)
                        : `${skipped.length} ứng viên bị bỏ qua (đã mời / không hợp lệ).`
                );
            } else if (sentCount === 0) {
                toast.info('Không gửi được lời mời nào.');
            }

            setInviteTargets(null);
        } catch (error) {
            toast.error(
                getRecruiterRecommendationErrorMessage(
                    error,
                    'Không thể gửi lời mời ứng tuyển.'
                )
            );
        } finally {
            setSending(false);
        }
    };

    const canGoPrev = currentPage > 0;
    const canGoNext = totalPages > 1 && currentPage + 1 < totalPages;

    const pageItems = useMemo(() => {
        if (totalPages <= 1) return [];
        if (totalPages <= 4) {
            return Array.from({ length: totalPages }, (_, i) => i);
        }
        const last = totalPages - 1;
        const set = new Set([
            0,
            last,
            currentPage,
            currentPage - 1,
            currentPage + 1,
            currentPage - 2,
            currentPage + 2,
        ]);
        const sorted = [...set].filter((p) => p >= 0 && p <= last).sort((a, b) => a - b);
        const items = [];
        let prev = null;
        sorted.forEach((p) => {
            if (prev != null && p - prev > 1) items.push('ellipsis');
            items.push(p);
            prev = p;
        });
        return items;
    }, [currentPage, totalPages]);

    const goToPage = (nextPage) => {
        if (recommendationsLoading || !selectedJobId) return;
        if (nextPage < 0 || nextPage >= totalPages || nextPage === currentPage) return;
        loadRecommendations(selectedJobId, nextPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleRefreshRecommendations = () => {
        if (!selectedJobId || recommendationsLoading) return;
        loadRecommendations(selectedJobId, currentPage);
    };

    if (!lockedJobId) return null;

    return (
        <div className="recruiter-recommendations-page">
            <Link to={backLink.to} className="recruiter-back-overview">
                {backLink.label}
            </Link>
            <h1 className="recruiter-recommendations__sr-only">Gợi ý ứng viên phù hợp</h1>
            <p className="recruiter-recommendations__intro">
                Những ứng viên phù hợp nhất với tin tuyển dụng của bạn.
            </p>

            <section className="recruiter-recommendations__toolbar">
                {jobsLoading ? (
                    <div className="recruiter-recommendations__job-loading">
                        Đang tải tin tuyển dụng...
                    </div>
                ) : jobsError ? (
                    <div className="recruiter-recommendations__message recruiter-recommendations__message--error">
                        {jobsError}
                    </div>
                ) : selectedJob ? (
                    <div className="recruiter-recommendations__job-title-row">
                        <p className="recruiter-recommendations__job-title">{selectedJob.title}</p>
                        <button
                            type="button"
                            className={`recruiter-recommendations__refresh-btn${
                                recommendationsLoading ? ' is-loading' : ''
                            }`}
                            onClick={handleRefreshRecommendations}
                            disabled={recommendationsLoading}
                            aria-label="Tải lại danh sách gợi ý"
                            title="Tải lại danh sách gợi ý"
                        >
                            <RefreshIcon width={18} height={18} aria-hidden="true" />
                        </button>
                    </div>
                ) : (
                    <div className="recruiter-recommendations__message">
                        <span>Không tìm thấy tin tuyển dụng.</span>
                        <Link to={ROUTES.RECRUITER_MY_JOBS}>Quay lại Tin của tôi</Link>
                    </div>
                )}

                {selectedJobId && !recommendationsError && (
                    <p className="recruiter-recommendations__count">
                        <strong>{totalElements}</strong> ứng viên phù hợp
                    </p>
                )}
            </section>

            {candidates.length > 0 && (
                <div className="recruiter-recommendations__bulk-bar">
                    <div className="recruiter-recommendations__bulk-left">
                        <label className="recruiter-recommendations__select-all">
                            <input
                                type="checkbox"
                                checked={allSelectableSelected}
                                disabled={
                                    selectableCandidates.length === 0 || recommendationsLoading
                                }
                                onChange={toggleSelectAllOnPage}
                            />
                            Chọn tất cả trên trang
                        </label>
                        {selectedOnPageCount > 0 ? (
                            <button
                                type="button"
                                className="recruiter-recommendations__clear-btn"
                                disabled={sending}
                                onClick={clearSelection}
                            >
                                Bỏ chọn
                            </button>
                        ) : null}
                    </div>
                    <button
                        type="button"
                        className="btn btn--primary recruiter-recommendations__bulk-invite"
                        disabled={selectedOnPageCount === 0 || sending}
                        onClick={openBulkInvite}
                    >
                        Gửi lời mời{selectedOnPageCount > 0 ? ` (${selectedOnPageCount})` : ''}
                    </button>
                </div>
            )}

            {recommendationsLoading && candidates.length === 0 && (
                <div className="recruiter-recommendations__loading">
                    Đang phân tích ứng viên phù hợp...
                </div>
            )}

            {!recommendationsLoading && recommendationsError && (
                <div className="recruiter-recommendations__empty">
                    <p>{recommendationsError}</p>
                    <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={() => loadRecommendations(selectedJobId, 0)}
                    >
                        Thử lại
                    </button>
                </div>
            )}

            {!recommendationsLoading &&
                selectedJobId &&
                !recommendationsError &&
                candidates.length === 0 && (
                    <div className="recruiter-recommendations__empty">
                        <p>JobLink chưa tìm thấy ứng viên phù hợp cho tin này.</p>
                        <span>
                            Kết quả phụ thuộc vào lịch rảnh, kỹ năng, khoảng cách và trạng thái sẵn
                            sàng làm việc của ứng viên.
                        </span>
                    </div>
                )}

            {candidates.length > 0 && (
                <div
                    className={`recruiter-recommendations__grid${
                        recommendationsLoading ? ' is-loading' : ''
                    }`}
                >
                    {candidates.map((candidate) => (
                        <CandidateRecommendationCard
                            key={candidate.candidateId}
                            candidate={candidate}
                            selected={selectedCandidateIds.has(candidate.candidateId)}
                            onToggleSelect={toggleSelect}
                            sending={
                                sending &&
                                inviteTargets?.some(
                                    (t) => t.candidateId === candidate.candidateId
                                )
                            }
                            sent={sentCandidateIds.has(candidate.candidateId)}
                            profileBackTo={profileBackTo}
                            onInvite={(c) => setInviteTargets([c])}
                            onChat={(c) => {
                                if (c?.userId == null) {
                                    toast.error('Thiếu userId để mở chat.');
                                    return;
                                }
                                if (!selectedJobId) {
                                    toast.error('Chưa chọn tin tuyển dụng.');
                                    return;
                                }
                                openChatPanel({
                                    jobId: selectedJobId,
                                    otherUserId: c.userId,
                                });
                            }}
                        />
                    ))}
                </div>
            )}

            {totalPages > 1 ? (
                <nav
                    className="recruiter-recommendations__pagination"
                    aria-label="Phân trang gợi ý ứng viên"
                >
                    <button
                        type="button"
                        className="recruiter-recommendations__page-btn recruiter-recommendations__page-btn--nav"
                        disabled={!canGoPrev || recommendationsLoading}
                        onClick={() => goToPage(currentPage - 1)}
                        aria-label="Trang trước"
                    >
                        ‹
                    </button>
                    {pageItems.map((item, index) =>
                        item === 'ellipsis' ? (
                            <span
                                key={`e-${index}`}
                                className="recruiter-recommendations__page-ellipsis"
                                aria-hidden="true"
                            >
                                …
                            </span>
                        ) : (
                            <button
                                key={item}
                                type="button"
                                className={`recruiter-recommendations__page-btn${
                                    item === currentPage ? ' is-active' : ''
                                }`}
                                disabled={recommendationsLoading}
                                aria-current={item === currentPage ? 'page' : undefined}
                                aria-label={`Trang ${item + 1}`}
                                onClick={() => goToPage(item)}
                            >
                                {item + 1}
                            </button>
                        )
                    )}
                    <button
                        type="button"
                        className="recruiter-recommendations__page-btn recruiter-recommendations__page-btn--nav"
                        disabled={!canGoNext || recommendationsLoading}
                        onClick={() => goToPage(currentPage + 1)}
                        aria-label="Trang sau"
                    >
                        ›
                    </button>
                </nav>
            ) : null}

            {inviteTargets?.length > 0 && (
                <SendInvitationModal
                    key={`${selectedJobId}-${inviteTargets.map((c) => c.candidateId).join('-')}`}
                    candidates={inviteTargets}
                    jobTitle={selectedJob?.title}
                    loading={sending}
                    onConfirm={handleSendInvitation}
                    onCancel={() => {
                        if (!sending) setInviteTargets(null);
                    }}
                />
            )}
        </div>
    );
};

export default RecruiterRecommendationsPage;
