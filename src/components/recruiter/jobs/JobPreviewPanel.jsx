import { DAY_OF_WEEK_OPTIONS, JOB_TYPES, SKILLS_CATALOG } from '../../../constants/jobPost.js';
import { formatSalaryRange, formatLocationDisplay } from '../../../services/jobPostService.js';

const dayLabel = (value) =>
    DAY_OF_WEEK_OPTIONS.find((d) => d.value === String(value))?.label || value;

const JobPreviewPanel = ({ form, businessName, businessLocation }) => {
    const jobTypeLabel =
        JOB_TYPES.find((t) => t.value === form.jobType)?.label || form.jobType || '—';

    const selectedSkills = SKILLS_CATALOG.filter((s) => (form.skillIds || []).includes(s.id));

    return (
        <aside className="job-preview-panel">
            <h3 className="job-preview-panel__title">Xem trước tin đăng</h3>

            <div className="job-preview-panel__card">
                <p className="job-preview-panel__company">{businessName || 'Doanh nghiệp của bạn'}</p>
                <h4 className="job-preview-panel__job-title">
                    {form.title?.trim() || 'Tiêu đề tin tuyển dụng'}
                </h4>
                <p className="job-preview-panel__salary">
                    {formatSalaryRange(form.salaryMin, form.salaryMax)}
                </p>
                <p className="job-preview-panel__meta">
                    {jobTypeLabel}
                    {form.isUrgent ? ' · Tuyển gấp' : ''}
                </p>
                {businessLocation && (
                    <p className="job-preview-panel__location">
                        {formatLocationDisplay(businessLocation)}
                    </p>
                )}

                {form.description?.trim() && (
                    <div className="job-preview-panel__section">
                        <strong>Mô tả</strong>
                        <p>{form.description}</p>
                    </div>
                )}

                {selectedSkills.length > 0 && (
                    <div className="job-preview-panel__section">
                        <strong>Kỹ năng</strong>
                        <div className="job-preview-panel__tags">
                            {selectedSkills.map((s) => (
                                <span key={s.id} className="job-preview-panel__tag">
                                    {s.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {(form.shiftBlocks || []).some((b) => b.days?.length > 0) && (
                    <div className="job-preview-panel__section">
                        <strong>Ca làm việc</strong>
                        <ul className="job-preview-panel__shifts">
                            {form.shiftBlocks
                                .filter((b) => b.days?.length > 0)
                                .map((block, i) => (
                                    <li key={block.id || i}>
                                        {block.days.map(dayLabel).join(', ')}: {block.startTime} –{' '}
                                        {block.endTime}
                                    </li>
                                ))}
                        </ul>
                    </div>
                )}
            </div>
        </aside>
    );
};

export default JobPreviewPanel;
