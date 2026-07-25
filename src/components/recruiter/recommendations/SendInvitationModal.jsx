import { useState } from 'react';
import ConfirmModal from '../../common/ConfirmModal.jsx';

const MAX_MESSAGE_LENGTH = 2000;

const buildDefaultMessage = (candidateName, jobTitle) =>
    `Chào ${candidateName || 'bạn'}, chúng tôi nhận thấy hồ sơ của bạn phù hợp với vị trí ${
        jobTitle || 'đang tuyển dụng'
    }. Hy vọng bạn sẽ xem xét lời mời từ chúng tôi.`;

const SendInvitationModal = ({
    candidate,
    jobTitle,
    loading = false,
    onConfirm,
    onCancel,
}) => {
    const [message, setMessage] = useState(() =>
        buildDefaultMessage(candidate?.fullName, jobTitle)
    );

    return (
        <ConfirmModal
            open
            title="Gửi lời mời ứng tuyển"
            confirmLabel="Gửi lời mời"
            cancelLabel="Hủy"
            loading={loading}
            onConfirm={() => onConfirm(message.trim())}
            onCancel={onCancel}
        >
            <div className="send-invitation-modal">
                    <div className="send-invitation-modal__summary">
                        <div>
                            <span>Ứng viên</span>
                            <strong>{candidate.fullName || 'Ứng viên JobLink'}</strong>
                        </div>
                        <div>
                            <span>Vị trí</span>
                            <strong>{jobTitle || 'Tin tuyển dụng đã chọn'}</strong>
                        </div>
                        <span className="send-invitation-modal__score">
                            {Math.round(Number(candidate.matchScore) || 0)}% phù hợp
                        </span>
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
            </div>
        </ConfirmModal>
    );
};

export default SendInvitationModal;
