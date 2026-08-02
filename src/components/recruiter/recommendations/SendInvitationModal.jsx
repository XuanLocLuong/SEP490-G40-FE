import { useState } from 'react';
import ConfirmModal from '../../common/ConfirmModal.jsx';

const MAX_MESSAGE_LENGTH = 2000;

const buildDefaultMessage = (candidateName, jobTitle, count) => {
    if (count > 1) {
        return `Chào bạn, chúng tôi nhận thấy hồ sơ của bạn phù hợp với vị trí ${
            jobTitle || 'đang tuyển dụng'
        }. Hy vọng bạn sẽ xem xét lời mời từ chúng tôi.`;
    }
    return `Chào ${candidateName || 'bạn'}, chúng tôi nhận thấy hồ sơ của bạn phù hợp với vị trí ${
        jobTitle || 'đang tuyển dụng'
    }. Hy vọng bạn sẽ xem xét lời mời từ chúng tôi.`;
};

/**
 * @param {object[]} [candidates] — 1 hoặc nhiều UV (ưu tiên)
 * @param {object} [candidate] — tương thích gọi cũ 1 UV
 */
const SendInvitationModal = ({
    candidates,
    candidate,
    jobTitle,
    loading = false,
    onConfirm,
    onCancel,
}) => {
    const list =
        Array.isArray(candidates) && candidates.length > 0
            ? candidates
            : candidate
              ? [candidate]
              : [];
    const isBulk = list.length > 1;
    const first = list[0];

    const [message, setMessage] = useState(() =>
        buildDefaultMessage(first?.fullName, jobTitle, list.length)
    );

    if (list.length === 0) return null;

    return (
        <ConfirmModal
            open
            title={isBulk ? `Gửi lời mời (${list.length} ứng viên)` : 'Gửi lời mời ứng tuyển'}
            confirmLabel={isBulk ? `Gửi ${list.length} lời mời` : 'Gửi lời mời'}
            cancelLabel="Hủy"
            loading={loading}
            onConfirm={() => onConfirm(message.trim())}
            onCancel={onCancel}
        >
            <div className="send-invitation-modal">
                <div className="send-invitation-modal__summary">
                    <div>
                        <span>{isBulk ? 'Ứng viên đã chọn' : 'Ứng viên'}</span>
                        <strong>
                            {isBulk
                                ? `${list.length} ứng viên`
                                : first.fullName || 'Ứng viên JobLink'}
                        </strong>
                        {isBulk ? (
                            <ul className="send-invitation-modal__names">
                                {list.slice(0, 8).map((c) => (
                                    <li key={c.candidateId}>
                                        {c.fullName || `UV #${c.candidateId}`}
                                        {c.matchScore != null
                                            ? ` · ${Math.round(Number(c.matchScore) || 0)}%`
                                            : ''}
                                    </li>
                                ))}
                                {list.length > 8 ? (
                                    <li>… và {list.length - 8} ứng viên khác</li>
                                ) : null}
                            </ul>
                        ) : null}
                    </div>
                    <div>
                        <span>Vị trí</span>
                        <strong>{jobTitle || 'Tin tuyển dụng đã chọn'}</strong>
                    </div>
                    {!isBulk ? (
                        <span className="send-invitation-modal__score">
                            {Math.round(Number(first.matchScore) || 0)}% phù hợp
                        </span>
                    ) : null}
                </div>

                <label htmlFor="invitation-message">Nội dung lời mời</label>
                <textarea
                    id="invitation-message"
                    rows={6}
                    maxLength={MAX_MESSAGE_LENGTH}
                    value={message}
                    disabled={loading}
                    onChange={(event) => setMessage(event.target.value)}
                />
                <span className="send-invitation-modal__counter">
                    {message.length}/{MAX_MESSAGE_LENGTH}
                </span>
                {isBulk ? (
                    <p className="send-invitation-modal__hint">
                        Cùng một nội dung sẽ gửi cho tất cả ứng viên đã chọn.
                    </p>
                ) : null}
            </div>
        </ConfirmModal>
    );
};

export default SendInvitationModal;
