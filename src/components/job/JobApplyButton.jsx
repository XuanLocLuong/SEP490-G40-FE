import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { applyToJob, previewJobApplication } from '../../apis/ApplicationApi.jsx';
import { useAuth } from '../../contexts/authContext.js';
import { ROUTES } from '../../routes/path.js';
import { USER_ROLES } from '../../utils/Constants.jsx';
import { getApplicationErrorMessage } from '../../utils/applicationErrorMessages.js';
import { setBookmarkReturnPath } from '../../utils/bookmarkStorage.js';
import { notifyLoginRequired } from '../../utils/notifyLoginRequired.js';
import JobApplyConfirmModal from './JobApplyConfirmModal.jsx';

const JobApplyButton = ({
    jobId,
    className,
    label,
    guestLabel = 'Đăng nhập để ứng tuyển',
    scheduleSummary,
    shiftGroups,
    disabled = false,
    disabledTitle = 'Tin tuyển dụng đã hết vị trí.',
    onApplied,
}) => {
    const { auth } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [modalOpen, setModalOpen] = useState(false);
    const [preview, setPreview] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [applying, setApplying] = useState(false);

    const buttonLabel = label ?? (auth ? 'Ứng tuyển ngay' : guestLabel);

    if (auth && auth.role !== USER_ROLES.CANDIDATE) {
        return null;
    }

    const closeModal = () => {
        if (applying) return;
        setModalOpen(false);
        setPreview(null);
        setPreviewLoading(false);
    };

    const openPreview = async () => {
        setModalOpen(true);
        setPreviewLoading(true);
        setPreview(null);

        try {
            const res = await previewJobApplication(jobId);
            setPreview(res.data.data);
        } catch (err) {
            closeModal();
            toast.error(getApplicationErrorMessage(err));
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleClick = async (e) => {
        e.stopPropagation();

        if (disabled) return;

        if (!auth) {
            notifyLoginRequired('apply');
            setBookmarkReturnPath(`${location.pathname}${location.search}`);
            navigate(ROUTES.LOGIN);
            return;
        }

        await openPreview();
    };

    const handleConfirm = async () => {
        if (!preview?.eligible || applying) return;

        setApplying(true);
        try {
            await applyToJob(jobId);
            toast.success('Ứng tuyển thành công.');
            onApplied?.();
            closeModal();
        } catch (err) {
            toast.error(getApplicationErrorMessage(err));
        } finally {
            setApplying(false);
        }
    };

    const buttonTitle = disabled
        ? disabledTitle
        : auth
          ? buttonLabel
          : guestLabel;

    return (
        <>
            <button
                type="button"
                className={className}
                onClick={handleClick}
                title={buttonTitle}
                disabled={disabled}
            >
                {buttonLabel}
            </button>

            <JobApplyConfirmModal
                open={modalOpen}
                preview={preview}
                scheduleSummary={scheduleSummary}
                shiftGroups={shiftGroups}
                loading={previewLoading}
                applying={applying}
                onClose={closeModal}
                onConfirm={handleConfirm}
            />
        </>
    );
};

export default JobApplyButton;
