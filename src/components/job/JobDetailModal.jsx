import { useEffect, useState } from 'react';
import { fetchJobDetail } from '../../apis/JobApi.jsx';
import JobDetailPanel from '../jobdetail/JobDetailPanel.jsx';
import '../../assets/styles/JobDetailPageStyle.css';
import '../../assets/styles/JobDetailModalStyle.css';

const markJobApplied = (prev) =>
    prev ? { ...prev, applied: true, isApply: true } : prev;

const JobDetailModal = ({ open, jobId, onClose, onApplied }) => {
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open || !jobId) {
            setJob(null);
            setError('');
            setLoading(false);
            return undefined;
        }

        let cancelled = false;

        (async () => {
            setLoading(true);
            setError('');
            try {
                const res = await fetchJobDetail(jobId);
                if (!cancelled) {
                    setJob(res?.data?.data ?? null);
                }
            } catch (err) {
                if (!cancelled) {
                    setJob(null);
                    setError(
                        err?.response?.status === 404
                            ? 'Không tìm thấy việc làm này hoặc tin đã đóng.'
                            : err?.message || 'Không thể tải chi tiết việc làm. Vui lòng thử lại sau.'
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [open, jobId]);

    useEffect(() => {
        if (!open) return undefined;

        const onKeyDown = (event) => {
            if (event.key === 'Escape') onClose?.();
        };

        document.addEventListener('keydown', onKeyDown);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = prevOverflow;
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="job-detail-modal" role="dialog" aria-modal="true" aria-label="Chi tiết việc làm">
            <button
                type="button"
                className="job-detail-modal__backdrop"
                aria-label="Đóng"
                onClick={onClose}
            />

            <div className="job-detail-modal__panel">
                <div className="job-detail-modal__header">
                    <h2 className="job-detail-modal__title">Chi tiết việc làm</h2>
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
                        onApplied={() => {
                            setJob(markJobApplied);
                            onApplied?.(jobId);
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default JobDetailModal;
