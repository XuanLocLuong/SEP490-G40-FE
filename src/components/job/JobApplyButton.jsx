import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { applyToJob, previewApply } from '../../apis/ApplicationApi.jsx';
import { useAuth } from '../../contexts/authContext.js';
import { ROUTES } from '../../routes/path.js';
import { USER_ROLES } from '../../utils/Constants.jsx';
import { getApplyErrorMessage } from '../../utils/applicationErrorMessages.js';
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
    const [applied, setApplied] = useState(false);

    const buttonLabel = label ?? (auth ? 'Ứng tuyển ngay' : guestLabel);

    if (auth && auth.role !== USER_ROLES.CANDIDATE) {
        return null;
    }

    useEffect(() => {
        setApplied(false);
        setModalOpen(false);
        setPreview(null);
        setPreviewLoading(false);
        setApplying(false);
    }, [jobId]);

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
            const res = await previewApply(jobId);
            const nextPreview = res.data.data;
            setPreview(nextPreview);

            // Nếu BE báo đã ứng tuyển rồi thì tự chuyển UI sang trạng thái "Đã ứng tuyển"
            // để không cần hiển thị modal blocking.
            if (nextPreview?.alreadyApplied) {
                setApplied(true);
                closeModal();
                return;
            }
        } catch (err) {
            closeModal();
            toast.error(getApplyErrorMessage(err));
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleClick = async (e) => {
        e.stopPropagation();

        if (disabled || applied) return;

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
            setApplied(true);
            toast.success('Ứng tuyển thành công.');
            onApplied?.();
            closeModal();
        } catch (err) {
            toast.error(getApplyErrorMessage(err));
        } finally {
            setApplying(false);
        }
    };

    const buttonTitle = applied
        ? 'Bạn đã ứng tuyển công việc này rồi.'
        : disabled
          ? disabledTitle
          : auth
            ? buttonLabel
            : guestLabel;

    const buttonText = applied ? 'Đã ứng tuyển' : buttonLabel;
    const isButtonDisabled = disabled || applied;

    return (
        <>
            <button
                type="button"
                className={className}
                onClick={handleClick}
                title={buttonTitle}
                disabled={isButtonDisabled}
            >
                {buttonText}
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
