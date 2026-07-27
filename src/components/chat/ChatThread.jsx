import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { confirmOffer, getMyApplications } from '../../apis/ApplicationApi.jsx';
import { getMyInvitations, rejectInvitation } from '../../apis/InvitationApi.jsx';
import { fetchJobApplications } from '../../apis/RecruiterApplicationApi.jsx';
import { submitApplicationReview } from '../../apis/ReviewApi.jsx';
import { useAuth } from '../../contexts/authContext.js';
import { useChatThread } from '../../hooks/useChatThread.js';
import { getJobDetailPath } from '../../routes/path.js';
import { USER_ROLES } from '../../utils/Constants.jsx';
import { getInitials } from '../../utils/chatDisplay.js';
import ChatActionCard from './ChatActionCard.jsx';
import ChatMessageBubble from './ChatMessageBubble.jsx';
import ChatReviewModal from './ChatReviewModal.jsx';

const pageContent = (res) => {
    const page = res?.data?.data ?? res?.data;
    return Array.isArray(page?.content) ? page.content : Array.isArray(page) ? page : [];
};

const matchesJob = (row, jobId) =>
    String(row?.jobId) === String(jobId) || String(row?.job?.id) === String(jobId);

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

const findHiredApplicationIdForChat = async ({ jobId, role, otherPartyId }) => {
    if (role === USER_ROLES.CANDIDATE) {
        return findMyApplicationId(jobId, 'HIRED');
    }

    if (role === USER_ROLES.RECRUITER) {
        const res = await fetchJobApplications(jobId, { status: 'HIRED', page: 0, size: 50 });
        const match = pageContent(res).find((app) => {
            const candidateUserId =
                app?.candidateUserId ?? app?.candidate?.userId ?? app?.candidate?.user?.id;
            const candidateId = app?.candidateId ?? app?.candidate?.id;
            return (
                String(candidateUserId) === String(otherPartyId) ||
                String(candidateId) === String(otherPartyId)
            );
        });
        return match?.applicationId ?? match?.id ?? null;
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
    } = useChatThread(conversation?.id);

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

    const handleSend = async (event) => {
        event.preventDefault();
        const ok = await sendText(draft);
        if (ok) {
            setDraft('');
            onThreadChanged?.();
        }
    };

    const handleConfirmHired = async () => {
        if (auth?.role !== USER_ROLES.CANDIDATE) {
            toast.info('Chỉ ứng viên mới xác nhận nhận việc.');
            return;
        }
        if (!conversation?.jobId) {
            toast.error('Không tìm thấy tin tuyển dụng gắn với cuộc trò chuyện.');
            return;
        }

        setActionBusy(true);
        try {
            const applicationId = await findMyApplicationId(conversation.jobId, 'ACCEPTED');
            if (applicationId == null) {
                toast.error('Không tìm thấy đơn ACCEPTED để xác nhận.');
                return;
            }
            await confirmOffer(applicationId);
            toast.success('Đã xác nhận nhận việc.');
            await reloadActions();
            onThreadChanged?.();
        } catch {
            toast.error('Không thể xác nhận nhận việc. Vui lòng thử lại.');
        } finally {
            setActionBusy(false);
        }
    };

    const handleRejectInvitation = async () => {
        if (auth?.role !== USER_ROLES.CANDIDATE) {
            toast.info('Chỉ ứng viên mới từ chối lời mời.');
            return;
        }
        if (!conversation?.jobId) {
            toast.error('Không tìm thấy tin tuyển dụng gắn với cuộc trò chuyện.');
            return;
        }

        setActionBusy(true);
        try {
            const invitationId = await findSentInvitationId(conversation.jobId);
            if (invitationId == null) {
                toast.error('Không tìm thấy lời mời đang chờ phản hồi.');
                return;
            }
            await rejectInvitation(invitationId);
            toast.success('Đã từ chối lời mời.');
            await reloadActions();
            onThreadChanged?.();
        } catch {
            toast.error('Không thể từ chối lời mời. Vui lòng thử lại.');
        } finally {
            setActionBusy(false);
        }
    };

    const handleOpenReview = async () => {
        if (!conversation?.jobId) {
            toast.error('Không tìm thấy tin tuyển dụng gắn với cuộc trò chuyện.');
            return;
        }

        setActionBusy(true);
        try {
            const applicationId = await findHiredApplicationIdForChat({
                jobId: conversation.jobId,
                role: auth?.role,
                otherPartyId: conversation.otherPartyId,
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
            await submitApplicationReview(reviewAppId, { rating, comment: comment || null });
            toast.success('Đã gửi đánh giá.');
            setReviewOpen(false);
            setReviewAppId(null);
            await reloadActions();
            onThreadChanged?.();
        } catch (err) {
            const msg = err?.response?.data?.message;
            toast.error(msg || 'Không gửi được đánh giá. Vui lòng thử lại.');
        } finally {
            setActionBusy(false);
        }
    };

    const handleAction = async (actionName) => {
        if (actionBusy) return;
        if (actionName === 'CONFIRM_HIRED') {
            await handleConfirmHired();
            return;
        }
        if (actionName === 'REJECT_INVITATION') {
            await handleRejectInvitation();
            return;
        }
        if (actionName === 'REQUEST_REVIEW') {
            await handleOpenReview();
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
                    <ChatMessageBubble
                        key={msg.id}
                        message={msg}
                        actionBusy={actionBusy}
                        onAction={handleAction}
                    />
                ))}

                {actions.length > 0 && (
                    <div className="chat-panel__sticky-actions">
                        {actions.map((name) => (
                            <ChatActionCard
                                key={name}
                                actionName={name}
                                busy={actionBusy}
                                onAction={handleAction}
                            />
                        ))}
                    </div>
                )}
            </div>

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
