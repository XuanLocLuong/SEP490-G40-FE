import { formatDaysList } from './availabilityConstants.js';

const HiredJobsScheduleSection = ({
    jobs = [],
    loading = false,
    togglingId = null,
    onToggle,
    isCalculatedMode = true,
}) => {
    if (loading) {
        return (
            <section className="availability-card">
                <div className="availability-skeleton availability-skeleton--title" />
                <div className="availability-skeleton availability-skeleton--line" />
            </section>
        );
    }

    return (
        <section className="availability-card hired-jobs-schedule">
            <div className="availability-card__header">
                <div>
                    <h2>Việc đã nhận</h2>
                    <p>
                        {isCalculatedMode
                            ? 'Áp dụng để đưa ca làm vào tính thời gian có thể đi làm. Nếu xung đột với lịch bận / việc khác, ngưng áp dụng cái cũ trước.'
                            : 'Đang ở chế độ tự nhập — áp dụng lịch làm việc chỉ dùng được khi bật chế độ tự động.'}
                    </p>
                </div>
            </div>

            {jobs.length === 0 ? (
                <p className="hired-jobs-schedule__empty">Chưa có việc nào ở trạng thái đã nhận.</p>
            ) : (
                <ul className="hired-jobs-schedule__list">
                    {jobs.map((job) => {
                        const canApply = isCalculatedMode || job.isApplied;
                        return (
                            <li key={job.applicationId} className="hired-jobs-schedule__item">
                                <div className="hired-jobs-schedule__main">
                                    <strong>{job.jobTitle || `Việc #${job.jobId}`}</strong>
                                    <span
                                        className={`hired-jobs-schedule__status${
                                            job.isApplied ? ' hired-jobs-schedule__status--on' : ''
                                        }`}
                                    >
                                        {job.isApplied ? 'Đang áp dụng' : 'Chưa áp dụng'}
                                    </span>
                                    {job.shifts?.length > 0 ? (
                                        <ul className="hired-jobs-schedule__shifts">
                                            {job.shifts.map((shift, index) => (
                                                <li key={shift.clientId || index}>
                                                    {formatDaysList(shift.days)} · {shift.start}–
                                                    {shift.end}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="hired-jobs-schedule__no-shifts">
                                            Chưa có ca làm việc.
                                        </p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    className={`availability-btn ${
                                        job.isApplied
                                            ? 'availability-btn--ghost'
                                            : 'availability-btn--primary'
                                    }`}
                                    disabled={
                                        togglingId === job.applicationId ||
                                        (!canApply && !job.isApplied)
                                    }
                                    title={
                                        !isCalculatedMode && !job.isApplied
                                            ? 'Chuyển sang chế độ tự động trước khi áp dụng lịch làm việc'
                                            : undefined
                                    }
                                    onClick={() => onToggle?.(job)}
                                >
                                    {togglingId === job.applicationId
                                        ? 'Đang xử lý...'
                                        : job.isApplied
                                          ? 'Ngưng áp dụng'
                                          : 'Áp dụng lịch làm việc'}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
};

export default HiredJobsScheduleSection;
