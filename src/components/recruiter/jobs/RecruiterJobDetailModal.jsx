import { useEffect, useState } from 'react';
import recruiterJobApi, {
    getRecruiterJobApiErrorMessage,
} from '../../../apis/RecruiterJobApi.jsx';
import JobDetailPanel from '../../jobdetail/JobDetailPanel.jsx';
import '../../../assets/styles/JobDetailPageStyle.css';
import '../../../assets/styles/JobDetailModalStyle.css';

const RecruiterJobDetailModal = ({ open, jobId, onClose }) => {
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open || jobId == null) return undefined;

        let cancelled = false;

        const loadJobDetail = async () => {
            setLoading(true);
            setError('');
            try {
                const data = await recruiterJobApi.getJobDetail(jobId);
                if (!cancelled) setJob(data ?? null);
            } catch (err) {
                if (!cancelled) {
                    setJob(null);
                    setError(
                        getRecruiterJobApiErrorMessage(
                            err,
                            'Không thể tải chi tiết tin tuyển dụng.'
                        )
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadJobDetail();

        return () => {
            cancelled = true;
        };
    }, [open, jobId]);

    useEffect(() => {
        if (!open) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') onClose?.();
        };

        document.addEventListener('keydown', handleKeyDown);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="job-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Chi tiết tin tuyển dụng"
        >
            <button
                type="button"
                className="job-detail-modal__backdrop"
                aria-label="Đóng"
                onClick={onClose}
            />

            <div className="job-detail-modal__panel">
                <div className="job-detail-modal__header">
                    <h2 className="job-detail-modal__title">Chi tiết tin tuyển dụng</h2>
                    <button
                        type="button"
                        className="job-detail-modal__close"
                        onClick={onClose}
                        aria-label="Đóng"
                    >
                        ×
                    </button>
                </div>

                <div className="job-detail-modal__body">
                    <JobDetailPanel
                        job={job}
                        loading={loading}
                        error={error}
                        variant="preview"
                        showPostedLabel={false}
                    />
                </div>
            </div>
        </div>
    );
};

export default RecruiterJobDetailModal;
