import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import recruiterJobApi, { getRecruiterJobApiErrorMessage } from '../../../apis/RecruiterJobApi.jsx';
import InvitationCard from '../../../components/recruiter/invitations/InvitationCard.jsx';
import JobStatusBadge from '../../../components/recruiter/jobs/JobStatusBadge.jsx';
import {
    getInvitations,
    getRecruiterInvitationApiErrorMessage,
    INVITATION_STATUS_FILTERS,
} from '../../../services/recruiterInvitationService.js';
import { getCandidatePublicProfilePath, ROUTES } from '../../../routes/path.js';
import '../../../assets/styles/ApplicantsPageStyle.css';
import '../../../assets/styles/RecruiterInvitationsStyle.css';

const PAGE_SIZE = 12;
const DEFAULT_STATUS = 'ALL';

const RecruiterInvitationsPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const jobIdParam = searchParams.get('jobId');
    const statusFilter = searchParams.get('status') || DEFAULT_STATUS;
    const page = Math.max(0, Number(searchParams.get('page') || 0) || 0);
    /** Chỉ hiện back khi vào từ My Jobs (?from=my-jobs), không hiện khi deep-link URL tay. */
    const showBackToMyJobs = searchParams.get('from') === 'my-jobs';

    const [job, setJob] = useState(null);
    const [jobLoading, setJobLoading] = useState(Boolean(jobIdParam));
    const [jobError, setJobError] = useState(false);

    const [invitations, setInvitations] = useState([]);
    const [listLoading, setListLoading] = useState(false);
    const [listError, setListError] = useState('');
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    const selectedJobId = jobIdParam && Number.isFinite(Number(jobIdParam)) ? Number(jobIdParam) : null;

    const updateParams = useCallback(
        (updates) => {
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                Object.entries(updates).forEach(([key, value]) => {
                    if (value === null || value === undefined || value === '') {
                        next.delete(key);
                    } else {
                        next.set(key, String(value));
                    }
                });
                return next;
            });
        },
        [setSearchParams]
    );

    useEffect(() => {
        let cancelled = false;

        if (!selectedJobId) {
            setJob(null);
            setJobLoading(false);
            setJobError(false);
            return undefined;
        }

        (async () => {
            setJobLoading(true);
            setJobError(false);
            try {
                const detail = await recruiterJobApi.getJobDetail(selectedJobId);
                if (!cancelled) {
                    setJob(detail || null);
                    setJobError(!detail);
                }
            } catch (err) {
                if (!cancelled) {
                    setJob(null);
                    setJobError(true);
                    toast.error(
                        getRecruiterJobApiErrorMessage(err, 'Không tải được tin tuyển dụng.')
                    );
                }
            } finally {
                if (!cancelled) {
                    setJobLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [selectedJobId]);

    const loadInvitations = useCallback(async () => {
        if (!selectedJobId || jobLoading || jobError) {
            setInvitations([]);
            setTotalPages(0);
            setTotalElements(0);
            return;
        }

        setListLoading(true);
        setListError('');
        try {
            const pageData = await getInvitations(selectedJobId, {
                status: statusFilter,
                page,
                size: PAGE_SIZE,
            });
            setInvitations(pageData.content);
            setTotalPages(pageData.totalPages);
            setTotalElements(pageData.totalElements);
        } catch (err) {
            setListError(
                getRecruiterInvitationApiErrorMessage(err, 'Không tải được danh sách lời mời.')
            );
            setInvitations([]);
            setTotalPages(0);
            setTotalElements(0);
        } finally {
            setListLoading(false);
        }
    }, [selectedJobId, statusFilter, page, jobLoading, jobError]);

    useEffect(() => {
        loadInvitations();
    }, [loadInvitations]);

    const handleStatusChange = (value) => {
        updateParams({ status: value === DEFAULT_STATUS ? null : value, page: 0 });
    };

    const handleViewProfile = (invitation) => {
        const candidateId = invitation?.candidateId;
        if (!candidateId) {
            toast.error('Không tìm thấy hồ sơ ứng viên.');
            return;
        }
        const returnParams = new URLSearchParams();
        if (selectedJobId != null) returnParams.set('jobId', String(selectedJobId));
        if (showBackToMyJobs) returnParams.set('from', 'my-jobs');
        const backQuery = returnParams.toString() ? `?${returnParams.toString()}` : '';
        navigate(getCandidatePublicProfilePath(candidateId), {
            state: {
                backTo: {
                    path: `${ROUTES.RECRUITER_INVITATIONS}${backQuery}`,
                    label: 'Quay lại danh sách lời mời',
                },
            },
        });
    };

    const hasMorePages = page + 1 < totalPages;

    return (
        <div className="applicants-page">
            {showBackToMyJobs && (
                <Link to={ROUTES.RECRUITER_MY_JOBS} className="applicants-page__back">
                    ← Quay lại tin tuyển dụng
                </Link>
            )}

            <h1 className="applicants-page__title">Lời mời đã gửi</h1>

            {!selectedJobId && (
                <div className="applicants-page__empty">
                    <p>
                        Thêm <code>?jobId=</code> vào URL để xem lời mời của một tin tuyển dụng.
                    </p>
                    <div className="applicants-page__empty-actions">
                        <Link to={ROUTES.RECRUITER_MY_JOBS} className="btn btn--secondary">
                            Xem tin của tôi
                        </Link>
                    </div>
                </div>
            )}

            {selectedJobId != null && jobLoading && (
                <div className="applicants-page__loading">Đang tải tin tuyển dụng…</div>
            )}

            {selectedJobId != null && !jobLoading && jobError && (
                <div className="applicants-page__empty">
                    <p>Không tìm thấy tin tuyển dụng này.</p>
                    <div className="applicants-page__empty-actions">
                        <Link to={ROUTES.RECRUITER_MY_JOBS} className="btn btn--secondary">
                            Quay lại tin của tôi
                        </Link>
                    </div>
                </div>
            )}

            {selectedJobId != null && !jobLoading && job && (
                <>
                    <div className="applicants-page__toolbar">
                        <div className="applicants-page__job-row">
                            <div className="applicants-page__job-locked">
                                <span className="applicants-page__job-locked-label">
                                    Tin tuyển dụng
                                </span>
                                <h2 className="applicants-page__job-locked-title">{job.title}</h2>
                            </div>
                            {job.status && <JobStatusBadge status={job.status} />}
                            <span className="applicants-page__count">{totalElements} lời mời</span>
                        </div>

                        <div className="applicants-page__filters-row">
                            <div className="applicants-page__filters">
                                <label>Trạng thái</label>
                                <div className="applicants-page__chips">
                                    {INVITATION_STATUS_FILTERS.map((item) => (
                                        <button
                                            key={item.value}
                                            type="button"
                                            className={`applicants-page__chip${
                                                statusFilter === item.value
                                                    ? ' applicants-page__chip--active'
                                                    : ''
                                            }`}
                                            onClick={() => handleStatusChange(item.value)}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {listLoading && (
                        <div className="applicants-page__loading">Đang tải danh sách lời mời…</div>
                    )}

                    {!listLoading && listError && (
                        <div className="applicants-page__error">
                            <p>{listError}</p>
                            <button
                                type="button"
                                className="btn btn--secondary"
                                onClick={loadInvitations}
                            >
                                Thử lại
                            </button>
                        </div>
                    )}

                    {!listLoading && !listError && invitations.length === 0 && (
                        <div className="applicants-page__empty">
                            <p>
                                {statusFilter === 'ALL'
                                    ? 'Chưa có lời mời nào cho tin này.'
                                    : 'Không có lời mời phù hợp bộ lọc hiện tại.'}
                            </p>
                        </div>
                    )}

                    {!listLoading && !listError && invitations.length > 0 && (
                        <>
                            <div className="applicants-page__grid">
                                {invitations.map((invitation) => (
                                    <InvitationCard
                                        key={invitation.id}
                                        invitation={invitation}
                                        onViewProfile={handleViewProfile}
                                    />
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className="applicants-page__pagination">
                                    <button
                                        type="button"
                                        className="btn btn--secondary"
                                        disabled={page <= 0 || listLoading}
                                        onClick={() => updateParams({ page: page - 1 })}
                                    >
                                        Trang trước
                                    </button>
                                    <span>
                                        {page + 1} / {totalPages}
                                    </span>
                                    <button
                                        type="button"
                                        className="btn btn--secondary"
                                        disabled={!hasMorePages || listLoading}
                                        onClick={() => updateParams({ page: page + 1 })}
                                    >
                                        Trang sau
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default RecruiterInvitationsPage;
