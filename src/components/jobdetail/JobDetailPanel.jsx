import { useState } from 'react';
import RichTextContent from '../common/RichTextContent.jsx';
import {
    formatJobType,
    formatSalary,
    formatLocation,
    formatLocationAddressDetail,
    formatApplicationDeadline,
    formatRelativeTime,
    formatVacancyLabel,
    getEngagementStats,
    formatScheduleSummary,
    formatShiftGroupLine,
    groupShiftsForDisplay,
    getBusinessInitial,
    hasAppliedToJob,
    isPrimarySkill,
} from '../../utils/formatters.js';
import { CheckCircleIcon, MapPinIcon, ClockIcon, UsersIcon } from '../common/icons.jsx';
import BusinessProfileLink from '../common/BusinessProfileLink.jsx';
import JobApplyButton from '../job/JobApplyButton.jsx';
import JobBookmarkButton from '../job/JobBookmarkButton.jsx';
import JobReportButton from '../job/JobReportButton.jsx';
import JobChatButton from '../job/JobChatButton.jsx';

const APPLY_DISABLED_TITLE = 'Tin tuyển dụng đã hết vị trí.';

const BusinessLogo = ({ name, logoUrl }) => {
    const [imgFailed, setImgFailed] = useState(false);
    const showImage = Boolean(logoUrl) && !imgFailed;

    if (showImage) {
        return (
            <img
                src={logoUrl}
                alt=""
                className="job-detail-panel__logo job-detail-panel__logo--image"
                onError={() => setImgFailed(true)}
            />
        );
    }

    return (
        <span className="job-detail-panel__logo" aria-hidden="true">
            {getBusinessInitial(name)}
        </span>
    );
};

const JobDetailPanel = ({
    job,
    loading,
    error,
    onApplied,
    variant = 'default',
    sectionsOnly = false,
    showPostedLabel = true,
}) => {
    const isPreview = variant === 'preview';
    if (loading) {
        return (
            <div className="job-detail-panel job-detail-panel--loading">
                <div className="job-detail-panel__skeleton" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="job-detail-panel job-detail-panel--error">
                <p>{error}</p>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="job-detail-panel job-detail-panel--empty">
                <p>Chọn một việc làm để xem chi tiết.</p>
            </div>
        );
    }

    const businessName = job.business?.name || 'Công ty';
    const businessId = job.business?.id;
    const businessLogoUrl = job.business?.logoUrl || null;
    const trustScore = job.business?.trustScore;
    const showVerified = trustScore != null && Number(trustScore) >= 70;
    const shiftGroups = groupShiftsForDisplay(job.shifts);
    const scheduleSummary = formatScheduleSummary(shiftGroups);
    const showShiftSection = sectionsOnly ? shiftGroups.length > 0 : shiftGroups.length > 1;
    const locationSummary = formatLocation(job.location);
    const locationDetail = formatLocationAddressDetail(job.location);
    const postedLabel = showPostedLabel
        ? isPreview
            ? 'Xem trước'
            : formatRelativeTime(job.createdAt)
        : '';
    const deadlineLabel = formatApplicationDeadline(job.applicationDeadline);
    const vacancyLabel = formatVacancyLabel(job);
    const engagementStats = getEngagementStats(
        job.viewCount,
        job.applicationCount,
        job.saveCount
    );
    const isVacancyFull =
        job.vacancyAvailable === false ||
        (job.remainingPositions != null && Number(job.remainingPositions) <= 0);
    const hasSectionContent =
        Boolean(job.description?.trim()) ||
        (job.requiredSkills?.length ?? 0) > 0 ||
        shiftGroups.length > 0;

    const panelClassName = [
        'job-detail-panel',
        isPreview ? 'job-detail-panel--preview' : '',
        sectionsOnly ? 'job-detail-panel--sections-only' : '',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <article className={panelClassName}>
            {!sectionsOnly && (
                <>
            <header className="job-detail-panel__company">
                <div className="job-detail-panel__company-main">
                    <BusinessLogo
                        key={`${businessId ?? businessName}-${businessLogoUrl || ''}`}
                        name={businessName}
                        logoUrl={businessLogoUrl}
                    />
                    <div className="job-detail-panel__company-info">
                        <div className="job-detail-panel__company-row">
                            {!isPreview && businessId ? (
                                <BusinessProfileLink
                                    businessId={businessId}
                                    className="job-detail-panel__company-name job-detail-panel__company-name--link"
                                    title="Xem trang công ty"
                                    label="Tin tuyển dụng"
                                >
                                    {businessName}
                                </BusinessProfileLink>
                            ) : (
                                <h2 className="job-detail-panel__company-name">{businessName}</h2>
                            )}
                            {showVerified && (
                                <span className="job-detail-panel__verified">
                                    <CheckCircleIcon width={14} height={14} />
                                    Đã xác thực
                                </span>
                            )}
                        </div>
                        {!isPreview && businessId ? (
                            <BusinessProfileLink
                                businessId={businessId}
                                className="job-detail-panel__company-profile-link"
                                label="Tin tuyển dụng"
                            >
                                Xem thông tin nhà tuyển dụng
                            </BusinessProfileLink>
                        ) : null}
                    </div>
                </div>

                {!isPreview && (
                    <div className="job-detail-panel__header-actions">
                        <JobBookmarkButton
                            jobId={job.id}
                            className="job-detail-panel__bookmark"
                            initialSaved={job.saved}
                        />
                        <JobReportButton jobId={job.id} jobTitle={job.title} />
                    </div>
                )}
            </header>

            <h1 className="job-detail-panel__title">{job.title}</h1>

            {(vacancyLabel || job.urgent) && (
                <div className="job-detail-panel__badges">
                    {vacancyLabel && (
                        <span
                            className={`job-detail-panel__vacancy-badge${
                                isVacancyFull ? ' job-detail-panel__vacancy-badge--full' : ''
                            }`}
                        >
                            <UsersIcon width={16} height={16} />
                            {vacancyLabel}
                        </span>
                    )}
                    {job.urgent && (
                        <span className="job-detail-panel__badge">Tuyển gấp</span>
                    )}
                </div>
            )}

            {engagementStats.length > 0 && (
                <p className="job-detail-panel__engagement-row">
                    {engagementStats.map((stat, index) => (
                        <span key={stat.key} className="job-detail-panel__engagement-stat">
                            {index > 0 && (
                                <span className="job-detail-panel__engagement-dot" aria-hidden="true">
                                    ·
                                </span>
                            )}
                            <strong>{stat.value}</strong> {stat.label}
                        </span>
                    ))}
                </p>
            )}

            {(postedLabel || deadlineLabel) && (
                <p className="job-detail-panel__post-meta">
                    {postedLabel}
                    {postedLabel && deadlineLabel && ' · '}
                    {deadlineLabel}
                </p>
            )}

            <div className="job-detail-panel__stats">
                <div className="job-detail-panel__stat">
                    <span className="job-detail-panel__stat-label">Mức lương</span>
                    <strong className="job-detail-panel__stat-value job-detail-panel__stat-value--salary">
                        {formatSalary(job.salaryMin, job.salaryMax)}
                    </strong>
                </div>
                <div className="job-detail-panel__stat">
                    <span className="job-detail-panel__stat-label">Địa điểm</span>
                    <strong className="job-detail-panel__stat-value">
                        <MapPinIcon width={16} height={16} />
                        <span>
                            {locationSummary}
                            {locationDetail && (
                                <span className="job-detail-panel__stat-sub">{locationDetail}</span>
                            )}
                        </span>
                    </strong>
                </div>
                <div className="job-detail-panel__stat">
                    <span className="job-detail-panel__stat-label">Thời gian</span>
                    <strong className="job-detail-panel__stat-value">
                        <ClockIcon width={16} height={16} />
                        {scheduleSummary}
                    </strong>
                </div>
            </div>

            {!isPreview && (
                <div className="job-detail-panel__actions">
                    <div className="job-detail-panel__chat-block">
                        <p className="job-detail-panel__chat-note">
                            Trao đổi ca làm với nhà tuyển dụng trước khi ứng tuyển.
                        </p>
                        <JobChatButton
                            jobId={job.id}
                            otherUserId={job.business?.ownerId ?? job.business?.owner?.id}
                            className="btn btn--ghost job-detail-panel__chat"
                        />
                    </div>
                    {hasAppliedToJob(job) ? (
                        <button
                            type="button"
                            className="btn btn--primary job-detail-panel__apply"
                            disabled
                        >
                            Đã ứng tuyển
                        </button>
                    ) : (
                        <JobApplyButton
                            jobId={job.id}
                            className="btn btn--primary job-detail-panel__apply"
                            guestLabel="Đăng nhập để ứng tuyển"
                            scheduleSummary={scheduleSummary}
                            shiftGroups={shiftGroups}
                            disabled={isVacancyFull}
                            disabledTitle={APPLY_DISABLED_TITLE}
                            onApplied={onApplied}
                        />
                    )}
                </div>
            )}

                </>
            )}

            {sectionsOnly && !hasSectionContent && (
                <p className="job-detail-panel__sections-empty">
                    Chưa có mô tả, kỹ năng hoặc ca làm.
                </p>
            )}

            {job.description && (
                <section className="job-detail-panel__section">
                    <h3 className="job-detail-panel__section-title">Mô tả công việc</h3>
                    <RichTextContent
                        content={job.description}
                        className="job-detail-panel__description"
                    />
                </section>
            )}

            {job.requiredSkills?.length > 0 && (
                <section className="job-detail-panel__section">
                    <h3 className="job-detail-panel__section-title">Yêu cầu kỹ năng</h3>
                    <div className="job-detail-panel__tags">
                        {job.requiredSkills.map((skill) => (
                            <span
                                key={skill.id}
                                className={`job-detail-panel__tag${
                                    isPrimarySkill(skill.weight)
                                        ? ' job-detail-panel__tag--primary'
                                        : ''
                                }`}
                            >
                                {skill.name}
                            </span>
                        ))}
                    </div>
                </section>
            )}

            {showShiftSection && (
                <section className="job-detail-panel__section">
                    <h3 className="job-detail-panel__section-title">Thời gian làm việc (dự kiến)</h3>
                    <ul className="job-detail-panel__shifts">
                        {shiftGroups.map((shift) => (
                            <li key={`${shift.range}-${shift.days?.join(',')}`}>
                                <CheckCircleIcon width={18} height={18} />
                                <span>{formatShiftGroupLine(shift)}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {formatJobType(job.jobType) && (
                <div className="job-detail-panel__footer-meta">
                    <span className="job-detail-panel__tag job-detail-panel__tag--type">
                        {formatJobType(job.jobType)}
                    </span>
                </div>
            )}
        </article>
    );
};

export default JobDetailPanel;
