import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
    acceptInvitation,
    getInvitationApiErrorMessage,
    getInvitationDetail,
    rejectInvitation,
} from '../../../apis/InvitationApi.jsx';
import ConfirmModal from '../../common/ConfirmModal.jsx';
import RichTextContent from '../../common/RichTextContent.jsx';
import { formatJobType, formatSalary, getBusinessInitial } from '../../../utils/formatters.js';
import {
    formatInvitationSentAt,
    formatMatchScore,
    getInvitationRemainingLabel,
    getInvitationStatusLabel,
} from '../../../utils/invitationDisplay.js';
import '../../../assets/styles/CandidateInvitationsPageStyle.css';

const BusinessLogo = ({ name, logoUrl }) => {
    const [failed, setFailed] = useState(false);
    const showImage = Boolean(logoUrl) && !failed;

    if (showImage) {
        return (
            <img
                src={logoUrl}
                alt=""
                className="ci-detail__logo"
                onError={() => setFailed(true)}
            />
        );
    }

    return (
        <span className="ci-detail__logo ci-detail__logo--placeholder" aria-hidden="true">
            {getBusinessInitial(name)}
        </span>
    );
};

const InvitationDetailModal = ({
    open,
    invitationId,
    onClose,
    onAccepted,
    onRejected,
}) => {
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [confirmReject, setConfirmReject] = useState(false);

    useEffect(() => {
        if (!open || invitationId == null) {
            setDetail(null);
            setError('');
            setLoading(false);
            setConfirmReject(false);
            return undefined;
        }

        let cancelled = false;
        (async () => {
            setLoading(true);
            setError('');
            try {
                const res = await getInvitationDetail(invitationId);
                if (!cancelled) setDetail(res?.data?.data ?? null);
            } catch (err) {
                if (!cancelled) {
                    setDetail(null);
                    setError(getInvitationApiErrorMessage(err, 'Không thể tải chi tiết lời mời.'));
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [open, invitationId]);

    useEffect(() => {
        if (!open) return undefined;
        const onKeyDown = (e) => {
            if (e.key === 'Escape' && !actionLoading) onClose?.();
        };
        document.addEventListener('keydown', onKeyDown);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = prev;
        };
    }, [open, onClose, actionLoading]);

    if (!open) return null;

    const isSent = detail?.status === 'SENT';
    const remaining = isSent ? getInvitationRemainingLabel(detail.sentAt) : null;
    const matchLabel = formatMatchScore(detail?.matchScore);

    const handleAccept = async () => {
        if (!detail?.invitationId || actionLoading) return;
        setActionLoading(true);
        try {
            await acceptInvitation(detail.invitationId);
            toast.success('Đã chấp nhận lời mời.');
            onAccepted?.(detail.invitationId);
            onClose?.();
        } catch (err) {
            toast.error(getInvitationApiErrorMessage(err, 'Không thể chấp nhận lời mời.'));
        } finally {
            setActionLoading(false);
        }
    };

    const handleRejectConfirm = async () => {
        if (!detail?.invitationId || actionLoading) return;
        setActionLoading(true);
        try {
            await rejectInvitation(detail.invitationId);
            toast.success('Đã từ chối lời mời.');
            setConfirmReject(false);
            onRejected?.(detail.invitationId);
            onClose?.();
        } catch (err) {
            toast.error(getInvitationApiErrorMessage(err, 'Không thể từ chối lời mời.'));
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <>
            <div className="ci-detail-modal" role="dialog" aria-modal="true" aria-label="Chi tiết lời mời">
                <button
                    type="button"
                    className="ci-detail-modal__backdrop"
                    aria-label="Đóng"
                    onClick={onClose}
                    disabled={actionLoading}
                />
                <div className="ci-detail-modal__panel">
                    <div className="ci-detail-modal__header">
                        <h2>Chi tiết lời mời</h2>
                        <button
                            type="button"
                            className="ci-detail-modal__close"
                            onClick={onClose}
                            disabled={actionLoading}
                            aria-label="Đóng"
                        >
                            ×
                        </button>
                    </div>

                    <div className="ci-detail-modal__body">
                        {loading && <p className="ci-detail__loading">Đang tải...</p>}
                        {error && !loading && <p className="ci-detail__error">{error}</p>}
                        {!loading && !error && detail && (
                            <>
                                <div className="ci-detail__top">
                                    <BusinessLogo
                                        name={detail.businessName}
                                        logoUrl={detail.businessLogoUrl}
                                    />
                                    <div>
                                        <h3 className="ci-detail__title">{detail.jobTitle || '—'}</h3>
                                        <p className="ci-detail__company">
                                            {detail.businessName || '—'}
                                        </p>
                                        <div className="ci-detail__badges">
                                            {detail.jobType && (
                                                <span className="ci-badge ci-badge--type">
                                                    {formatJobType(detail.jobType)}
                                                </span>
                                            )}
                                            {matchLabel && (
                                                <span className="ci-badge ci-badge--match">
                                                    {matchLabel}
                                                </span>
                                            )}
                                            <span className="ci-badge ci-badge--status">
                                                {getInvitationStatusLabel(detail.status)}
                                            </span>
                                            {remaining && (
                                                <span className="ci-badge ci-badge--remain">
                                                    {remaining}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <dl className="ci-detail__meta">
                                    <div>
                                        <dt>Mức lương</dt>
                                        <dd>
                                            {formatSalary(detail.salaryMin, detail.salaryMax) ||
                                                'Thoả thuận'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>Hạn nộp hồ sơ</dt>
                                        <dd>
                                            {detail.applicationDeadline
                                                ? new Date(
                                                      detail.applicationDeadline
                                                  ).toLocaleString('vi-VN')
                                                : '—'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>Nhà tuyển dụng</dt>
                                        <dd>{detail.recruiterName || '—'}</dd>
                                    </div>
                                    <div>
                                        <dt>Email</dt>
                                        <dd>{detail.recruiterEmail || '—'}</dd>
                                    </div>
                                    <div>
                                        <dt>Gửi lúc</dt>
                                        <dd>{formatInvitationSentAt(detail.sentAt) || '—'}</dd>
                                    </div>
                                </dl>

                                {detail.message && (
                                    <blockquote className="ci-detail__message">
                                        “{detail.message}”
                                    </blockquote>
                                )}

                                {detail.jobDescription && (
                                    <div className="ci-detail__section">
                                        <h4>Mô tả công việc</h4>
                                        <RichTextContent
                                            content={detail.jobDescription}
                                            className="ci-detail__description"
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {!loading && detail && isSent && (
                        <div className="ci-detail-modal__footer">
                            <button
                                type="button"
                                className="ci-btn ci-btn--ghost"
                                disabled={actionLoading}
                                onClick={() => setConfirmReject(true)}
                            >
                                Từ chối
                            </button>
                            <button
                                type="button"
                                className="ci-btn ci-btn--primary"
                                disabled={actionLoading}
                                onClick={handleAccept}
                            >
                                {actionLoading ? 'Đang xử lý...' : 'Chấp nhận'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmModal
                open={confirmReject}
                title="Từ chối lời mời"
                confirmLabel="Từ chối"
                cancelLabel="Giữ lại"
                variant="danger"
                loading={actionLoading}
                onConfirm={handleRejectConfirm}
                onCancel={() => setConfirmReject(false)}
            >
                <p className="confirm-modal__message">
                    Bạn có chắc muốn từ chối lời mời{' '}
                    <strong>{detail?.jobTitle || 'này'}</strong>?
                </p>
            </ConfirmModal>
        </>
    );
};

export default InvitationDetailModal;
