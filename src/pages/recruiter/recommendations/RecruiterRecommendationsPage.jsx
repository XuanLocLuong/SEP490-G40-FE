import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import recruiterJobApi, {
    getRecruiterJobApiErrorMessage,
} from '../../../apis/RecruiterJobApi.jsx';
import {
    fetchRecommendedCandidates,
    getRecruiterRecommendationErrorMessage,
    sendCandidateInvitation,
} from '../../../apis/RecruiterRecommendationApi.jsx';
import CandidateRecommendationCard from '../../../components/recruiter/recommendations/CandidateRecommendationCard.jsx';
import SendInvitationModal from '../../../components/recruiter/recommendations/SendInvitationModal.jsx';
import { ROUTES } from '../../../routes/path.js';
import '../../../assets/styles/RecruiterRecommendationsStyle.css';

const PAGE_SIZE = 10;

const SKIP_REASON_MESSAGES = {
    ALREADY_APPLIED: 'Ứng viên đã nộp hồ sơ vào tin tuyển dụng này.',
    ALREADY_INVITED: 'Ứng viên đã được gửi lời mời trước đó.',
    SCHEDULE_CONFLICT: 'Ứng viên đang có lịch làm việc bị trùng.',
    CANDIDATE_NOT_FOUND: 'Không tìm thấy hồ sơ ứng viên.',
    CANDIDATE_NOT_AVAILABLE: 'Ứng viên hiện không sẵn sàng nhận việc.',
};

const RecruiterRecommendationsPage = () => {
    const [jobs, setJobs] = useState([]);
    const [selectedJobId, setSelectedJobId] = useState('');
    const [jobsLoading, setJobsLoading] = useState(true);
    const [jobsError, setJobsError] = useState('');

    const [candidates, setCandidates] = useState([]);
    const [recommendationsLoading, setRecommendationsLoading] = useState(false);
    const [recommendationsError, setRecommendationsError] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    const [inviteTarget, setInviteTarget] = useState(null);
    const [sendingCandidateId, setSendingCandidateId] = useState(null);
    const [sentCandidateIds, setSentCandidateIds] = useState(() => new Set());

    const selectedJob = useMemo(
        () => jobs.find((job) => String(job.id) === String(selectedJobId)) ?? null,
        [jobs, selectedJobId]
    );

    const loadRecommendations = useCallback(async (jobId, page = 0, append = false) => {
        if (!jobId) return;
        setRecommendationsLoading(true);
        setRecommendationsError('');
        try {
            const pageData = await fetchRecommendedCandidates(jobId, page, PAGE_SIZE);
            const content = Array.isArray(pageData?.content) ? pageData.content : [];
            setCandidates((previous) => (append ? [...previous, ...content] : content));
            setCurrentPage(pageData?.currentPage ?? page);
            setTotalPages(pageData?.totalPages ?? 0);
            setTotalElements(pageData?.totalElements ?? content.length);
        } catch (error) {
            if (!append) {
                setCandidates([]);
                setCurrentPage(0);
                setTotalPages(0);
                setTotalElements(0);
            }
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
        let active = true;

        const loadOpenJobs = async () => {
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
                if (openJobs.length > 0) {
                    const firstJobId = String(openJobs[0].id);
                    setSelectedJobId(firstJobId);
                    loadRecommendations(firstJobId);
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

        loadOpenJobs();
        return () => {
            active = false;
        };
    }, [loadRecommendations]);

    const handleJobChange = (event) => {
        const jobId = event.target.value;
        setSelectedJobId(jobId);
        setCandidates([]);
        setCurrentPage(0);
        setTotalPages(0);
        setTotalElements(0);
        setSentCandidateIds(new Set());
        if (jobId) loadRecommendations(jobId);
    };

    const handleSendInvitation = async (message) => {
        if (!inviteTarget || !selectedJobId) return;
        const candidateId = inviteTarget.candidateId;
        setSendingCandidateId(candidateId);

        try {
            const response = await sendCandidateInvitation(selectedJobId, {
                candidateIds: [candidateId],
                type: 'JOB_INVITATION',
                message: message || null,
                matchScores: {
                    [candidateId]: Number(inviteTarget.matchScore) || 0,
                },
            });
            const result = response?.results?.find(
                (item) => String(item.candidateId) === String(candidateId)
            );

            if (result?.status === 'SENT' || response?.sentCount > 0) {
                setSentCandidateIds((previous) => {
                    const next = new Set(previous);
                    next.add(candidateId);
                    return next;
                });
                toast.success(`Đã gửi lời mời đến ${inviteTarget.fullName || 'ứng viên'}.`);
            } else {
                toast.info(
                    SKIP_REASON_MESSAGES[result?.reason] ||
                        result?.message ||
                        'Không thể gửi lời mời cho ứng viên này.'
                );
            }
            setInviteTarget(null);
        } catch (error) {
            toast.error(
                getRecruiterRecommendationErrorMessage(
                    error,
                    'Không thể gửi lời mời ứng tuyển.'
                )
            );
        } finally {
            setSendingCandidateId(null);
        }
    };

    const hasMore = currentPage + 1 < totalPages;

    return (
        <div className="recruiter-recommendations-page">
            <h1 className="recruiter-recommendations__sr-only">JobLink gợi ý</h1>
            <p className="recruiter-recommendations__intro">
                Những ứng viên phù hợp nhất với tin tuyển dụng của bạn.
            </p>

            <section className="recruiter-recommendations__toolbar">
                <label htmlFor="recommendation-job">Tin tuyển dụng</label>
                {jobsLoading ? (
                    <div className="recruiter-recommendations__job-loading">
                        Đang tải tin tuyển dụng...
                    </div>
                ) : jobsError ? (
                    <div className="recruiter-recommendations__message recruiter-recommendations__message--error">
                        {jobsError}
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="recruiter-recommendations__message">
                        <span>Bạn chưa có tin tuyển dụng nào đang mở.</span>
                        <Link to={ROUTES.RECRUITER_CREATE_JOB}>Đăng tin tuyển dụng</Link>
                    </div>
                ) : (
                    <select
                        id="recommendation-job"
                        value={selectedJobId}
                        onChange={handleJobChange}
                    >
                        {jobs.map((job) => (
                            <option key={job.id} value={job.id}>
                                {job.title}
                            </option>
                        ))}
                    </select>
                )}

                {selectedJobId && !recommendationsError && (
                    <p className="recruiter-recommendations__count">
                        <strong>{totalElements}</strong> ứng viên phù hợp
                    </p>
                )}
            </section>

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
                        onClick={() => loadRecommendations(selectedJobId)}
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
                <div className="recruiter-recommendations__grid">
                    {candidates.map((candidate) => (
                        <CandidateRecommendationCard
                            key={candidate.candidateId}
                            candidate={candidate}
                            sending={sendingCandidateId === candidate.candidateId}
                            sent={sentCandidateIds.has(candidate.candidateId)}
                            onInvite={setInviteTarget}
                        />
                    ))}
                </div>
            )}

            {hasMore && (
                <div className="recruiter-recommendations__load-more">
                    <button
                        type="button"
                        className="btn btn--secondary"
                        disabled={recommendationsLoading}
                        onClick={() =>
                            loadRecommendations(selectedJobId, currentPage + 1, true)
                        }
                    >
                        {recommendationsLoading ? 'Đang tải...' : 'Xem thêm ứng viên'}
                    </button>
                </div>
            )}

            {inviteTarget && (
                <SendInvitationModal
                    key={`${selectedJobId}-${inviteTarget.candidateId}`}
                    candidate={inviteTarget}
                    jobTitle={selectedJob?.title}
                    loading={sendingCandidateId === inviteTarget.candidateId}
                    onConfirm={handleSendInvitation}
                    onCancel={() => {
                        if (sendingCandidateId == null) setInviteTarget(null);
                    }}
                />
            )}
        </div>
    );
};

export default RecruiterRecommendationsPage;
