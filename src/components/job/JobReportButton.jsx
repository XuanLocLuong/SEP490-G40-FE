import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/authContext.js';
import { ROUTES } from '../../routes/path.js';
import { USER_ROLES } from '../../utils/Constants.jsx';
import {
    REPORT_STATUS_LABELS,
    loadJobReportStatus,
} from '../../services/jobReportService.js';
import { AlertIcon } from '../common/icons.jsx';
import JobReportModal from './JobReportModal.jsx';
import '../../assets/styles/JobReportStyle.css';

/**
 * Icon báo cáo tin — đặt cạnh bookmark trên Job Detail.
 * Chỉ hiện với guest (mời đăng nhập) hoặc candidate.
 */
const JobReportButton = ({ jobId, jobTitle, className = 'job-detail-panel__report' }) => {
    const { auth } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const [status, setStatus] = useState(null);
    const [loadingStatus, setLoadingStatus] = useState(false);

    const isCandidate = Boolean(auth && auth.role === USER_ROLES.CANDIDATE);
    const hasReported = Boolean(status?.hasReported);

    useEffect(() => {
        if (!isCandidate || !jobId) {
            setStatus(null);
            return undefined;
        }

        let cancelled = false;
        setLoadingStatus(true);
        loadJobReportStatus(jobId)
            .then((data) => {
                if (!cancelled) setStatus(data || null);
            })
            .catch(() => {
                if (!cancelled) setStatus(null);
            })
            .finally(() => {
                if (!cancelled) setLoadingStatus(false);
            });

        return () => {
            cancelled = true;
        };
    }, [isCandidate, jobId]);

    if (auth && auth.role !== USER_ROLES.CANDIDATE) {
        return null;
    }

    const handleClick = (e) => {
        e.stopPropagation();

        if (!auth) {
            const returnPath = `${location.pathname}${location.search}`;
            navigate(ROUTES.LOGIN, { state: { from: returnPath } });
            return;
        }

        if (hasReported) {
            const label = REPORT_STATUS_LABELS[status?.status] || 'Đã báo cáo';
            toast.info(`Bạn đã báo cáo tin này (${label}).`);
            return;
        }

        setOpen(true);
    };

    const label = hasReported ? 'Đã báo cáo tin này' : 'Báo cáo tin tuyển dụng';

    return (
        <>
            <button
                type="button"
                className={`${className}${hasReported ? ` ${className}--reported` : ''}`}
                onClick={handleClick}
                disabled={loadingStatus}
                aria-label={label}
                title={auth ? label : 'Đăng nhập để báo cáo tin tuyển dụng'}
            >
                <AlertIcon width={18} height={18} />
            </button>

            <JobReportModal
                open={open}
                jobId={jobId}
                jobTitle={jobTitle}
                onClose={() => setOpen(false)}
                onSubmitted={() =>
                    setStatus({
                        hasReported: true,
                        reportId: status?.reportId ?? null,
                        status: 'PENDING',
                    })
                }
            />
        </>
    );
};

export default JobReportButton;
