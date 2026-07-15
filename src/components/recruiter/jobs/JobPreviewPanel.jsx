import { useMemo } from 'react';
import { toPreviewJob, toPreviewJobDetail } from '../../../services/jobPostService.js';
import JobCard from '../../job/JobCard.jsx';
import JobDetailPanel from '../../jobdetail/JobDetailPanel.jsx';
import '../../../assets/styles/JobDetailPageStyle.css';

const JobPreviewPanel = ({ form, businessName, businessLocation }) => {
    const previewListJob = useMemo(
        () => toPreviewJob(form, businessName, businessLocation),
        [form, businessName, businessLocation]
    );
    const previewDetailJob = useMemo(
        () => toPreviewJobDetail(form, businessName, businessLocation),
        [form, businessName, businessLocation]
    );

    return (
        <aside className="job-preview-panel">
            <h3 className="job-preview-panel__title">Xem trước tin đăng</h3>

            <section className="job-preview-panel__block" aria-label="Trên danh sách việc làm">
                <JobCard job={previewListJob} variant="preview" />
            </section>

            <section className="job-preview-panel__block" aria-label="Trang chi tiết">
                <div className="job-preview-panel__detail">
                    <JobDetailPanel
                        job={previewDetailJob}
                        variant="preview"
                        sectionsOnly
                    />
                </div>
            </section>
        </aside>
    );
};

export default JobPreviewPanel;
