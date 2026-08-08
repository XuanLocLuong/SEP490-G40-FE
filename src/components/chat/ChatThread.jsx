import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getChatApiErrorMessage } from '../../apis/ChatApi.jsx';
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
import { submitApplicationReview, getReviewApiErrorMessage } from '../../apis/ReviewApi.jsx';
import { useAuth } from '../../contexts/authContext.js';
import { useChatThread } from '../../hooks/useChatThread.js';
import { fetchJobDetail } from '../../apis/JobApi.jsx';
import {
    getCandidatePublicProfilePath,
    getJobDetailPath,
    getRecruiterMyJobsPath,
} from '../../routes/path.js';
import { USER_ROLES } from '../../utils/Constants.jsx';
import {
    getActionApplicationId,
    getActionCandidateProfileId,
    getActionInvitationId,
    getInitials,
    groupStickyActions,
    normalizeChatAction,
    unwrapData,
} from '../../utils/chatDisplay.js';
import { notifyRecruitmentChanged } from '../../utils/chatEvents.js';
import ReviewSubmitModal from '../review/ReviewSubmitModal.jsx';
import ConfirmModal from '../common/ConfirmModal.jsx';
import ApplicationRejectModal from '../recruiter/applicants/ApplicationRejectModal.jsx';
import BusinessProfileLink from '../common/BusinessProfileLink.jsx';
import ChatActionCard from './ChatActionCard.jsx';
import ChatMessageBubble from './ChatMessageBubble.jsx';

/** Cache jobId → businessId so reopening the same thread skips a detail fetch. */
const businessIdByJobId = new Map();
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
    const stickToBottomRef = useRef(true);
    const restoreScrollRef = useRef(null);
    const prevConvIdRef = useRef(conversation?.id);
    const prevFirstMsgIdRef = useRef(null);
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
        editTextMessage,
        recallMessageById,
        reloadActions,
        reloadThread,
        peerTyping,
        notifyTyping,
        stopTyping,
    } = useChatThread(conversation?.id);

    const [mutatingMessageId, setMutatingMessageId] = useState(null);
    const [recallTargetId, setRecallTargetId] = useState(null);
    const [rejectTarget, setRejectTarget] = useState(null);
    const [businessId, setBusinessId] = useState(null);

    const stickyGroups = useMemo(() => groupStickyActions(actions), [actions]);

    useEffect(() => {
        setDraft('');
        setReviewOpen(false);
        setReviewAppId(null);
        setRecallTargetId(null);
        setRejectTarget(null);
        stickToBottomRef.current = true;
        restoreScrollRef.current = null;
        prevFirstMsgIdRef.current = null;
    }, [conversation?.id]);

    // Candidate: resolve businessId from job detail (conversation summary only has businessName).
    useEffect(() => {
        if (auth?.role !== USER_ROLES.CANDIDATE || conversation?.jobId == null) {
            setBusinessId(null);
            return undefined;
        }

        const jobId = conversation.jobId;
        const cached = businessIdByJobId.get(String(jobId));
        if (cached != null) {
            setBusinessId(cached);
            return undefined;
        }

        let cancelled = false;
        setBusinessId(null);

        (async () => {
            try {
                const res = await fetchJobDetail(jobId);
                const job = unwrapData(res) ?? res?.data?.data;
                const id = job?.business?.id ?? job?.businessId ?? null;
                if (id != null) {
                    businessIdByJobId.set(String(jobId), id);
                }
                if (!cancelled) setBusinessId(id);
            } catch {
                if (!cancelled) setBusinessId(null);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [auth?.role, conversation?.jobId]);

    const handleMessagesScroll = () => {
        const el = scrollerRef.current;
        if (!el) return;
        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        stickToBottomRef.current = distanceFromBottom < 80;
    };

    const handleLoadOlder = async () => {
        const el = scrollerRef.current;
        if (el) {
            restoreScrollRef.current = {
                height: el.scrollHeight,
                top: el.scrollTop,
            };
            stickToBottomRef.current = false;
        }
        await loadOlder();
    };

    useLayoutEffect(() => {
        const el = scrollerRef.current;
        if (!el) return;

        const convChanged = prevConvIdRef.current !== conversation?.id;
        prevConvIdRef.current = conversation?.id;

        const firstId = messages[0]?.id ?? null;
        const prepended =
            restoreScrollRef.current != null &&
            firstId != null &&
            prevFirstMsgIdRef.current != null &&
            firstId !== prevFirstMsgIdRef.current;

        if (convChanged) {
            stickToBottomRef.current = true;
            el.scrollTop = el.scrollHeight;
        } else if (prepended) {
            const { height, top } = restoreScrollRef.current;
            el.scrollTop = top + (el.scrollHeight - height);
            restoreScrollRef.current = null;
        } else if (stickToBottomRef.current) {
            el.scrollTop = el.scrollHeight;
        }

        prevFirstMsgIdRef.current = firstId;
    }, [messages, conversation?.id, peerTyping]);

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

    const resolveApplicationId = async (status, ...actionNames) => {
        const fromActions = getActionApplicationId(actions, ...actionNames);
        if (fromActions != null) return fromActions;

        if (conversation?.jobId == null) return null;

        if (auth?.role === USER_ROLES.CANDIDATE) {
            return findMyApplicationId(conversation.jobId, status);
        }
        if (auth?.role === USER_ROLES.RECRUITER) {
            return findRecruiterApplicationId(
                conversation.jobId,
                conversation,
                status
            );
        }
        return null;
    };

    const resolveInvitationId = async (...actionNames) => {
        const fromActions = getActionInvitationId(actions, ...actionNames);
        if (fromActions != null) return fromActions;
        if (conversation?.jobId == null) return null;
        return findSentInvitationId(conversation.jobId);
    };

    const resolveInviteCandidateProfileId = () =>
        getActionCandidateProfileId(actions, 'INVITE') ??
        conversation?.candidateProfileId ??
        null;

    const handleSend = async (event) => {
        event.preventDefault();
        stickToBottomRef.current = true;
        const ok = await sendText(draft);
        if (ok) {
            setDraft('');
            onThreadChanged?.();
        }
    };

    const handleEditMessage = async (messageId, content) => {
        if (mutatingMessageId != null) return false;
        setMutatingMessageId(messageId);
        try {
            await editTextMessage(messageId, content);
            onThreadChanged?.();
            return true;
        } catch (err) {
            toast.error(getChatApiErrorMessage(err, 'Không thể sửa tin nhắn.'));
            return false;
        } finally {
            setMutatingMessageId(null);
        }
    };

    const handleRecallMessage = async (messageId) => {
        if (mutatingMessageId != null) return false;
        setMutatingMessageId(messageId);
        try {
            await recallMessageById(messageId);
            setRecallTargetId(null);
            onThreadChanged?.();
            return true;
        } catch (err) {
            toast.error(getChatApiErrorMessage(err, 'Không thể thu hồi tin nhắn.'));
            return false;
        } finally {
            setMutatingMessageId(null);
        }
    };

    const requestRecallMessage = (messageId) => {
        if (mutatingMessageId != null || messageId == null) return;
        setRecallTargetId(messageId);
    };

    const handleAcceptWork = async () => {
        if (auth?.role !== USER_ROLES.CANDIDATE) {
            toast.info('Chỉ ứng viên mới xác nhận nhận việc.');
            return;
        }
        if (!requireJob()) return;

        setActionBusy(true);
        try {
            const applicationId = await resolveApplicationId(
                'ACCEPTED',
                'ACCEPT_WORK',
                'REJECT_WORK'
            );
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
            const applicationId = await resolveApplicationId(
                'ACCEPTED',
                'ACCEPT_WORK',
                'REJECT_WORK'
            );
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
            const invitationId = await resolveInvitationId(
                'ACCEPT_INVITE',
                'REJECT_INVITE'
            );
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
            const invitationId = await resolveInvitationId(
                'ACCEPT_INVITE',
                'REJECT_INVITE'
            );
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
            const applicationId = await resolveApplicationId(
                'PENDING',
                'ACCEPT_APPLICATION',
                'REJECT_APPLICATION'
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
            const applicationId = await resolveApplicationId(
                'PENDING',
                'ACCEPT_APPLICATION',
                'REJECT_APPLICATION'
            );
            if (applicationId == null) {
                toast.error('Không tìm thấy đơn PENDING của ứng viên này.');
                return;
            }
            setRejectTarget({
                id: applicationId,
                candidateName: conversation.otherPartyName || 'Ứng viên',
            });
        } catch (err) {
            toast.error(
                getRecruiterApplicationApiErrorMessage(err, 'Không thể tải đơn để từ chối.')
            );
        } finally {
            setActionBusy(false);
        }
    };

    const handleRejectApplicationConfirm = async ({ reason, note }) => {
        if (!rejectTarget?.id || actionBusy) return;
        setActionBusy(true);
        try {
            await rejectApplication(rejectTarget.id, {
                reason,
                note: note?.trim() ? note.trim() : null,
            });
            toast.success('Đã từ chối đơn ứng tuyển.');
            setRejectTarget(null);
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

        const candidateId = resolveInviteCandidateProfileId();
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
                await refreshAfterAction({ kind: 'invitation', action: 'INVITE' });
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
            const applicationId =
                getActionApplicationId(actions, 'REQUEST_REVIEW') ??
                (await findHiredApplicationIdForChat({
                    jobId: conversation.jobId,
                    role: auth?.role,
                    conversation,
                }));
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
            await refreshAfterAction({ kind: 'review', action: 'REQUEST_REVIEW' });
        } catch (err) {
            toast.error(getReviewApiErrorMessage(err, 'Không gửi được đánh giá. Vui lòng thử lại.'));
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
    const canViewCandidateProfile =
        auth?.role === USER_ROLES.RECRUITER && conversation.candidateProfileId != null;
    const canViewBusinessProfile =
        auth?.role === USER_ROLES.CANDIDATE && businessId != null;
    const jobLinkPath =
        conversation.jobId == null
            ? null
            : auth?.role === USER_ROLES.RECRUITER
              ? getRecruiterMyJobsPath({
                    tab: 'all',
                    jobId: conversation.jobId,
                })
              : getJobDetailPath(conversation.jobId);

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
                    {canViewCandidateProfile ? (
                        <Link
                            to={getCandidatePublicProfilePath(conversation.candidateProfileId)}
                            className="chat-panel__profile-link"
                        >
                            Xem ứng viên →
                        </Link>
                    ) : null}
                    {canViewBusinessProfile ? (
                        <BusinessProfileLink
                            businessId={businessId}
                            className="chat-panel__profile-link"
                            label="Quay lại chat"
                        >
                            Xem doanh nghiệp →
                        </BusinessProfileLink>
                    ) : null}
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
                    {jobLinkPath ? (
                        <Link to={jobLinkPath} className="chat-panel__job-link">
                            Xem tin →
                        </Link>
                    ) : null}
                </div>
            )}

            <div
                className="chat-panel__messages"
                ref={scrollerRef}
                onScroll={handleMessagesScroll}
            >
                {hasMore && (
                    <button
                        type="button"
                        className="chat-panel__load-older"
                        onClick={handleLoadOlder}
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
                    <ChatMessageBubble
                        key={msg.id}
                        message={msg}
                        mutating={mutatingMessageId === msg.id}
                        onEdit={handleEditMessage}
                        onRecall={requestRecallMessage}
                    />
                ))}

                {peerTyping ? (
                    <p className="chat-panel__typing" aria-live="polite">
                        Đang nhập
                        <span className="chat-panel__typing-dots" aria-hidden="true">
                            <span />
                            <span />
                            <span />
                        </span>
                    </p>
                ) : null}
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
                    onChange={(e) => {
                        setDraft(e.target.value);
                        if (e.target.value.trim()) notifyTyping();
                        else stopTyping();
                    }}
                    onBlur={stopTyping}
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

            <ConfirmModal
                open={recallTargetId != null}
                title="Thu hồi tin nhắn"
                confirmLabel="Thu hồi"
                cancelLabel="Hủy"
                variant="danger"
                loading={mutatingMessageId === recallTargetId}
                onCancel={() => {
                    if (mutatingMessageId != null) return;
                    setRecallTargetId(null);
                }}
                onConfirm={() => handleRecallMessage(recallTargetId)}
            >
                <p className="confirm-modal__message">
                    Tin nhắn sẽ bị ẩn nội dung và không thể hoàn tác từ đây. Bạn có chắc muốn thu hồi?
                </p>
            </ConfirmModal>

            <ApplicationRejectModal
                open={Boolean(rejectTarget)}
                application={rejectTarget}
                jobTitle={conversation?.jobTitle}
                loading={actionBusy}
                onCancel={() => {
                    if (actionBusy) return;
                    setRejectTarget(null);
                }}
                onConfirm={handleRejectApplicationConfirm}
            />

            <ReviewSubmitModal
                open={reviewOpen}
                busy={actionBusy}
                variant="dock"
                title="Viết đánh giá"
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
