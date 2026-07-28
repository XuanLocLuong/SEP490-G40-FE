import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    confirmOffer,
    declineOffer,
    getMyApplications,
} from '../../apis/ApplicationApi.jsx';
import {
    acceptInvitation,
    getInvitationApiErrorMessage,
    getMyInvitations,
    rejectInvitation,
} from '../../apis/InvitationApi.jsx';
import {
    acceptApplication,
    fetchJobApplications,
    getRecruiterApplicationApiErrorMessage,
    rejectApplication,
} from '../../apis/RecruiterApplicationApi.jsx';
import {
    getInvitationSkipReasonMessage,
    getRecruiterRecommendationErrorMessage,
    sendCandidateInvitation,
} from '../../apis/RecruiterRecommendationApi.jsx';
import { submitApplicationReview } from '../../apis/ReviewApi.jsx';
import { useAuth } from '../../contexts/authContext.js';
import { useChatThread } from '../../hooks/useChatThread.js';
import { getJobDetailPath } from '../../routes/path.js';
import { USER_ROLES } from '../../utils/Constants.jsx';
import {
    getInitials,
    groupStickyActions,
    normalizeChatAction,
} from '../../utils/chatDisplay.js';
import { notifyRecruitmentChanged } from '../../utils/chatEvents.js';
import ChatActionCard from './ChatActionCard.jsx';
import ChatMessageBubble from './ChatMessageBubble.jsx';
import ChatReviewModal from './ChatReviewModal.jsx';

const pageContent = (res) => {
    const page = res?.data?.data ?? res?.data;
    return Array.isArray(page?.content) ? page.content : Array.isArray(page) ? page : [];
};

const matchesJob = (row, jobId) =>
    String(row?.jobId) === String(jobId) || String(row?.job?.id) === String(jobId);

const samePerson = (app, conversation) => {
    const name = app?.candidateName || app?.candidate?.fullName || app?.candidate?.name;
    const avatar =
        app?.candidateAvatar || app?.candidate?.avatar || app?.candidate?.profilePicture;
    const userId =
        app?.candidateUserId ?? app?.candidate?.userId ?? app?.candidate?.user?.id;

    if (userId != null && conversation?.otherPartyId != null) {
        return String(userId) === String(conversation.otherPartyId);
    }
    if (avatar && conversation?.otherPartyAvatar) {
        return String(avatar) === String(conversation.otherPartyAvatar);
    }
    if (name && conversation?.otherPartyName) {
        return String(name).trim() === String(conversation.otherPartyName).trim();
    }
    return false;
};

const findMyApplicationId = async (jobId, status) => {
    const res = await getMyApplications({ status, page: 0, size: 50 });
    const match = pageContent(res).find((app) => matchesJob(app, jobId));
    return match?.applicationId ?? match?.id ?? null;
};

const findSentInvitationId = async (jobId) => {
    const res = await getMyInvitations({ status: 'SENT', page: 0, size: 50 });
    const match = pageContent(res).find((inv) => matchesJob(inv, jobId));
    return match?.invitationId ?? match?.id ?? null;
};

const findRecruiterApplicationId = async (jobId, conversation, status) => {
    const res = await fetchJobApplications(jobId, { status, page: 0, size: 50 });
    const match = pageContent(res).find((app) => samePerson(app, conversation));
    return match?.applicationId ?? match?.id ?? null;
};

const findHiredApplicationIdForChat = async ({ jobId, role, conversation }) => {
    if (role === USER_ROLES.CANDIDATE) {
        return findMyApplicationId(jobId, 'HIRED');
    }
    if (role === USER_ROLES.RECRUITER) {
        return findRecruiterApplicationId(jobId, conversation, 'HIRED');
    }
    return null;
};

const ChatThread = ({ conversation, onThreadChanged, compact = false }) => {
    const { auth } = useAuth();
    const scrollerRef = useRef(null);
    const [draft, setDraft] = useState('');
    const [actionBusy, setActionBusy] = useState(false);
    const [reviewOpen, setReviewOpen] = useState(false);
    const [reviewAppId, setReviewAppId] = useState(null);
    const {
        messages,
        actions,
        loading,
        loadingMore,
        sending,
        hasMore,
        error,
        loadOlder,
        sendText,
        reloadActions,
        reloadThread,
    } = useChatThread(conversation?.id);

    const stickyGroups = useMemo(() => groupStickyActions(actions), [actions]);

    useEffect(() => {
        setDraft('');
        setReviewOpen(false);
        setReviewAppId(null);
    }, [conversation?.id]);

    useEffect(() => {
        const el = scrollerRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
    }, [messages.length, conversation?.id]);

    const refreshAfterAction = async (recruitmentDetail = null) => {
        await reloadThread?.();
        await reloadActions();
        onThreadChanged?.();
        if (recruitmentDetail) {
            notifyRecruitmentChanged({
                jobId: conversation?.jobId,
                source: 'chat',
                ...recruitmentDetail,
            });
        }
    };

    const requireJob = () => {
        if (!conversation?.jobId) {
            toast.error('Không tìm thấy tin tuyển dụng gắn với cuộc trò chuyện.');
            return false;
        }
        return true;
    };

    const handleSend = async (event) => {
        event.preventDefault();
        const ok = await sendText(draft);
        if (ok) {
            setDraft('');
            onThreadChanged?.();
        }
    };

    const handleAcceptWork = async () => {
        if (auth?.role !== USER_ROLES.CANDIDATE) {
            toast.info('Chỉ ứng viên mới xác nhận nhận việc.');
            return;
        }
        if (!requireJob()) return;

        setActionBusy(true);
        try {
            const applicationId = await findMyApplicationId(conversation.jobId, 'ACCEPTED');
            if (applicationId == null) {
                toast.error('Không tìm thấy đơn ACCEPTED để xác nhận.');
                return;
            }
            await confirmOffer(applicationId);
            toast.success('Đã xác nhận nhận việc.');
            await refreshAfterAction({ kind: 'application', action: 'ACCEPT_WORK' });
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Không thể xác nhận nhận việc.');
        } finally {
            setActionBusy(false);
        }
    };

    const handleRejectWork = async () => {
        if (auth?.role !== USER_ROLES.CANDIDATE) {
            toast.info('Chỉ ứng viên mới từ chối nhận việc.');
            return;
        }
        if (!requireJob()) return;

        setActionBusy(true);
        try {
            const applicationId = await findMyApplicationId(conversation.jobId, 'ACCEPTED');
            if (applicationId == null) {
                toast.error('Không tìm thấy đơn ACCEPTED để từ chối.');
                return;
            }
            await declineOffer(applicationId);
            toast.success('Đã từ chối nhận việc.');
            await refreshAfterAction({ kind: 'application', action: 'REJECT_WORK' });
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Không thể từ chối nhận việc.');
        } finally {
            setActionBusy(false);
        }
    };

    const handleAcceptInvite = async () => {
        if (auth?.role !== USER_ROLES.CANDIDATE) {
            toast.info('Chỉ ứng viên mới chấp nhận lời mời.');
            return;
        }
        if (!requireJob()) return;

        setActionBusy(true);
        try {
            const invitationId = await findSentInvitationId(conversation.jobId);
            if (invitationId == null) {
                toast.error('Không tìm thấy lời mời đang chờ phản hồi.');
                return;
            }
            await acceptInvitation(invitationId);
            toast.success('Đã chấp nhận lời mời.');
            await refreshAfterAction({ kind: 'invitation', action: 'ACCEPT_INVITE' });
        } catch (err) {
            toast.error(getInvitationApiErrorMessage(err, 'Không thể chấp nhận lời mời.'));
        } finally {
            setActionBusy(false);
        }
    };

    const handleRejectInvite = async () => {
        if (auth?.role !== USER_ROLES.CANDIDATE) {
            toast.info('Chỉ ứng viên mới từ chối lời mời.');
            return;
        }
        if (!requireJob()) return;

        setActionBusy(true);
        try {
            const invitationId = await findSentInvitationId(conversation.jobId);
            if (invitationId == null) {
                toast.error('Không tìm thấy lời mời đang chờ phản hồi.');
                return;
            }
            await rejectInvitation(invitationId);
            toast.success('Đã từ chối lời mời.');
            await refreshAfterAction({ kind: 'invitation', action: 'REJECT_INVITE' });
        } catch (err) {
            toast.error(getInvitationApiErrorMessage(err, 'Không thể từ chối lời mời.'));
        } finally {
            setActionBusy(false);
        }
    };

    const handleAcceptApplication = async () => {
        if (auth?.role !== USER_ROLES.RECRUITER) {
            toast.info('Chỉ nhà tuyển dụng mới duyệt đơn.');
            return;
        }
        if (!requireJob()) return;

        setActionBusy(true);
        try {
            const applicationId = await findRecruiterApplicationId(
                conversation.jobId,
                conversation,
                'PENDING'
            );
            if (applicationId == null) {
                toast.error('Không tìm thấy đơn PENDING của ứng viên này.');
                return;
            }
            await acceptApplication(applicationId);
            toast.success('Đã chấp nhận đơn ứng tuyển.');
            await refreshAfterAction({
                kind: 'application',
                action: 'ACCEPT_APPLICATION',
            });
        } catch (err) {
            toast.error(
                getRecruiterApplicationApiErrorMessage(err, 'Không thể chấp nhận đơn.')
            );
        } finally {
            setActionBusy(false);
        }
    };

    const handleRejectApplication = async () => {
        if (auth?.role !== USER_ROLES.RECRUITER) {
            toast.info('Chỉ nhà tuyển dụng mới từ chối đơn.');
            return;
        }
        if (!requireJob()) return;

        setActionBusy(true);
        try {
            const applicationId = await findRecruiterApplicationId(
                conversation.jobId,
                conversation,
                'PENDING'
            );
            if (applicationId == null) {
                toast.error('Không tìm thấy đơn PENDING của ứng viên này.');
                return;
            }
            await rejectApplication(applicationId, {
                reason: 'OTHER',
                note: 'Từ chối qua chat',
            });
            toast.success('Đã từ chối đơn ứng tuyển.');
            await refreshAfterAction({
                kind: 'application',
                action: 'REJECT_APPLICATION',
            });
        } catch (err) {
            toast.error(
                getRecruiterApplicationApiErrorMessage(err, 'Không thể từ chối đơn.')
            );
        } finally {
            setActionBusy(false);
        }
    };

    const handleInvite = async () => {
        if (auth?.role !== USER_ROLES.RECRUITER) {
            toast.info('Chỉ nhà tuyển dụng mới gửi lời mời.');
            return;
        }
        if (!requireJob()) return;

        const candidateId = conversation?.candidateProfileId;
        if (candidateId == null) {
            toast.error(
                'Không tìm được hồ sơ ứng viên để mời. Hãy tải lại hội thoại hoặc thử mời từ trang Gợi ý ứng viên.'
            );
            return;
        }

        setActionBusy(true);
        try {
            const response = await sendCandidateInvitation(conversation.jobId, {
                candidateIds: [candidateId],
                type: 'JOB_INVITATION',
                message: null,
                matchScores: { [candidateId]: 0 },
            });
            const result = response?.results?.find(
                (item) => String(item.candidateId) === String(candidateId)
            );
            if (result?.status === 'SENT' || response?.sentCount > 0) {
                toast.success('Đã gửi lời mời ứng tuyển.');
                await refreshAfterAction();
            } else {
                toast.info(
                    getInvitationSkipReasonMessage(
                        result?.reason || result?.message,
                        'Không gửi được lời mời.'
                    )
                );
            }
        } catch (err) {
            toast.error(
                getRecruiterRecommendationErrorMessage(err, 'Không gửi được lời mời.')
            );
        } finally {
            setActionBusy(false);
        }
    };

    const handleOpenReview = async () => {
        if (!requireJob()) return;

        setActionBusy(true);
        try {
            const applicationId = await findHiredApplicationIdForChat({
                jobId: conversation.jobId,
                role: auth?.role,
                conversation,
            });
            if (applicationId == null) {
                toast.error('Không tìm thấy đơn HIRED để đánh giá.');
                return;
            }
            setReviewAppId(applicationId);
            setReviewOpen(true);
        } catch {
            toast.error('Không mở được form đánh giá. Vui lòng thử lại.');
        } finally {
            setActionBusy(false);
        }
    };

    const handleSubmitReview = async ({ rating, comment }) => {
        if (reviewAppId == null || actionBusy) return;
        setActionBusy(true);
        try {
            await submitApplicationReview(reviewAppId, {
                rating,
                comment: comment || null,
            });
            toast.success('Đã gửi đánh giá.');
            setReviewOpen(false);
            setReviewAppId(null);
            await refreshAfterAction();
        } catch (err) {
            const msg = err?.response?.data?.message;
            toast.error(msg || 'Không gửi được đánh giá. Vui lòng thử lại.');
        } finally {
            setActionBusy(false);
        }
    };

    const handleAction = async (rawActionName) => {
        if (actionBusy) return;
        const actionName = normalizeChatAction(rawActionName);

        switch (actionName) {
            case 'ACCEPT_WORK':
                await handleAcceptWork();
                break;
            case 'REJECT_WORK':
                await handleRejectWork();
                break;
            case 'ACCEPT_INVITE':
                await handleAcceptInvite();
                break;
            case 'REJECT_INVITE':
                await handleRejectInvite();
                break;
            case 'ACCEPT_APPLICATION':
                await handleAcceptApplication();
                break;
            case 'REJECT_APPLICATION':
                await handleRejectApplication();
                break;
            case 'INVITE':
                await handleInvite();
                break;
            case 'REQUEST_REVIEW':
                await handleOpenReview();
                break;
            default:
                break;
        }
    };

    if (!conversation) {
        return (
            <section className="chat-panel__thread chat-panel__thread--empty">
                <p>Chọn một cuộc trò chuyện để bắt đầu.</p>
            </section>
        );
    }

    const roleLabel =
        auth?.role === USER_ROLES.CANDIDATE ? 'Nhà tuyển dụng' : 'Ứng viên';

    return (
        <section className={`chat-panel__thread${compact ? ' chat-panel__thread--compact' : ''}`}>
            <header className="chat-panel__thread-head">
                <span className="chat-panel__avatar chat-panel__avatar--lg" aria-hidden="true">
                    {conversation.otherPartyAvatar ? (
                        <img src={conversation.otherPartyAvatar} alt="" />
                    ) : (
                        getInitials(conversation.otherPartyName)
                    )}
                </span>
                <div className="chat-panel__thread-who">
                    <div className="chat-panel__thread-name-row">
                        <h3 className="chat-panel__thread-name">
                            {conversation.otherPartyName || 'Người dùng'}
                        </h3>
                        <span className="chat-panel__role-badge">{roleLabel}</span>
                    </div>
                </div>
            </header>

            {(conversation.jobTitle || conversation.jobId) && (
                <div className="chat-panel__job-bar">
                    <div className="chat-panel__job-bar-text">
                        <strong>
                            {conversation.jobTitle || 'Tin tuyển dụng'}
                            {conversation.businessName
                                ? ` - ${conversation.businessName}`
                                : ''}
                        </strong>
                    </div>
                    {conversation.jobId ? (
                        <Link
                            to={getJobDetailPath(conversation.jobId)}
                            className="chat-panel__job-link"
                        >
                            Xem tin →
                        </Link>
                    ) : null}
                </div>
            )}

            <div className="chat-panel__messages" ref={scrollerRef}>
                {hasMore && (
                    <button
                        type="button"
                        className="chat-panel__load-older"
                        onClick={loadOlder}
                        disabled={loadingMore}
                    >
                        {loadingMore ? 'Đang tải...' : 'Xem tin nhắn cũ hơn'}
                    </button>
                )}

                {loading && messages.length === 0 && (
                    <p className="chat-panel__state">Đang tải tin nhắn...</p>
                )}
                {!loading && error && messages.length === 0 && (
                    <p className="chat-panel__state chat-panel__state--error">{error}</p>
                )}

                {messages.map((msg) => (
                    <ChatMessageBubble key={msg.id} message={msg} />
                ))}
            </div>

            {stickyGroups.length > 0 && (
                <div className="chat-panel__sticky-actions">
                    {stickyGroups.map((group) => (
                        <ChatActionCard
                            key={group.key}
                            kind={group.kind}
                            actions={group.actions}
                            busy={actionBusy}
                            onAction={handleAction}
                        />
                    ))}
                </div>
            )}

            <form className="chat-panel__composer" onSubmit={handleSend}>
                <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    disabled={sending}
                    autoComplete="off"
                />
                <button
                    type="submit"
                    className="chat-panel__send"
                    disabled={sending || !draft.trim()}
                    aria-label="Gửi"
                >
                    ➤
                </button>
            </form>

            <ChatReviewModal
                open={reviewOpen}
                busy={actionBusy}
                onClose={() => {
                    if (actionBusy) return;
                    setReviewOpen(false);
                    setReviewAppId(null);
                }}
                onSubmit={handleSubmitReview}
            />
        </section>
    );
};

export default ChatThread;
