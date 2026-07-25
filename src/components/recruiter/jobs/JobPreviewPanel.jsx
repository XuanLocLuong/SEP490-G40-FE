import { useMemo } from 'react';
import { toPreviewJob } from '../../../services/jobPostService.js';
import JobCard from '../../job/JobCard.jsx';

const JobPreviewPanel = ({ form, businessName, businessLocation, logoUrl }) => {
    const previewListJob = useMemo(
        () => toPreviewJob(form, businessName, businessLocation, logoUrl),
        [form, businessName, businessLocation, logoUrl]
    );

    return (
        <aside className="job-preview-panel">
            <h3 className="job-preview-panel__title">Xem trước tin đăng</h3>

            <section
                className="job-preview-panel__block job-preview-panel__block--readonly"
                aria-label="Trên danh sách việc làm"
            >
                {/* JobCard preview: UI giống list guest; không gọi Apply/Bookmark thật (recruiter bị ẩn) */}
                <JobCard job={previewListJob} variant="preview" />
            </section>
        </aside>
    );
};

export default JobPreviewPanel;
