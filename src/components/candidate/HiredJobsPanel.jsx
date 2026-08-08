import { formatDaysList } from './availabilityConstants.js';

const formatShifts = (shifts = []) => {
    if (!shifts.length) return 'Chưa có ca làm';
    return shifts
        .map((shift) => `${formatDaysList(shift.days)} ${shift.start}–${shift.end}`)
        .join(' · ');
};

const jobStatusLabel = (status) => {
    const key = String(status || '').toUpperCase();
    if (key === 'CLOSED') return 'Đã đóng';
    if (key === 'OPEN') return 'Đang mở';
    if (key === 'BLOCKED') return 'Đã khóa';
    return status || '';
};

/**
 * Danh sách job HIRED đang (có thể) giữ slot lịch rảnh.
 * Candidate-led: unapply = “Đã nghỉ việc”.
 */
const HiredJobsPanel = ({
    jobs = [],
    scheduleMode = 'CALCULATED',
    loading = false,
    busyApplicationId = null,
    onApply,
    onUnapply,
}) => {
    const isManual = String(scheduleMode).toUpperCase() === 'MANUAL';

    if (loading) {
        return (
            <section className="availability-card hired-jobs-panel">
                <div className="availability-skeleton availability-skeleton--title" />
                <div className="availability-skeleton availability-skeleton--line" />
            </section>
        );
    }

    if (!jobs.length) return null;

    return (
        <section className="availability-card hired-jobs-panel">
            <div className="availability-card__header">
                <div>
                    <h2>Công việc đang giữ lịch rảnh</h2>
                    <p>
                        Nếu bạn đã nghỉ, hãy gỡ lịch để hệ thống gợi ý việc mới chính xác hơn.
                        {isManual
                            ? ' Đang chế độ Thủ công — chuyển sang Tự động trước khi áp lại lịch job.'
                            : ''}
                    </p>
                </div>
            </div>

            <ul className="hired-jobs-panel__list">
                {jobs.map((job) => {
                    const busy = busyApplicationId === job.applicationId;
                    const closed = String(job.jobStatus).toUpperCase() === 'CLOSED';
                    return (
                        <li key={job.applicationId || job.jobId} className="hired-jobs-panel__item">
                            <div className="hired-jobs-panel__meta">
                                <div className="hired-jobs-panel__title-row">
                                    <h3>{job.jobTitle}</h3>
                                    {job.isApplied ? (
                                        <span className="hired-jobs-panel__badge hired-jobs-panel__badge--applied">
                                            Đang áp lịch
                                        </span>
                                    ) : (
                                        <span className="hired-jobs-panel__badge">Chưa áp lịch</span>
                                    )}
                                    {closed ? (
                                        <span className="hired-jobs-panel__badge hired-jobs-panel__badge--closed">
                                            Job đã đóng
                                        </span>
                                    ) : null}
                                    {job.jobStatus && !closed ? (
                                        <span className="hired-jobs-panel__badge hired-jobs-panel__badge--muted">
                                            {jobStatusLabel(job.jobStatus)}
                                        </span>
                                    ) : null}
                                </div>
                                <p className="hired-jobs-panel__shifts">{formatShifts(job.shifts)}</p>
                            </div>
                            <div className="hired-jobs-panel__actions">
                                {job.isApplied ? (
                                    <button
                                        type="button"
                                        className="availability-btn availability-btn--ghost hired-jobs-panel__leave"
                                        disabled={busy}
                                        onClick={() => onUnapply?.(job.applicationId)}
                                    >
                                        {busy ? 'Đang gỡ...' : 'Đã nghỉ việc'}
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className="availability-btn availability-btn--secondary"
                                        disabled={busy || isManual}
                                        title={
                                            isManual
                                                ? 'Chuyển sang chế độ Tự động trước khi áp lịch job'
                                                : undefined
                                        }
                                        onClick={() => onApply?.(job.applicationId)}
                                    >
                                        {busy ? 'Đang áp...' : 'Áp vào lịch rảnh'}
                                    </button>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
};

export default HiredJobsPanel;
