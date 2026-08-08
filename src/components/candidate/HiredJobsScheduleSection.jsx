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
                    <h2>Job đã nhận (Hired)</h2>
                    <p>
                        {isCalculatedMode
                            ? 'Bật apply để đưa ca làm vào tính lịch rảnh. Nếu xung đột với TKB/job khác, tắt apply cái cũ trước.'
                            : 'Đang ở chế độ tự nhập — apply lịch job chỉ dùng được khi bật chế độ tự động.'}
                    </p>
                </div>
            </div>

            {jobs.length === 0 ? (
                <p className="hired-jobs-schedule__empty">Chưa có job nào ở trạng thái Hired.</p>
            ) : (
                <ul className="hired-jobs-schedule__list">
                    {jobs.map((job) => {
                        const canApply = isCalculatedMode || job.isApplied;
                        return (
                            <li key={job.applicationId} className="hired-jobs-schedule__item">
                                <div className="hired-jobs-schedule__main">
                                    <strong>{job.jobTitle || `Job #${job.jobId}`}</strong>
                                    <span
                                        className={`hired-jobs-schedule__status${
                                            job.isApplied ? ' hired-jobs-schedule__status--on' : ''
                                        }`}
                                    >
                                        {job.isApplied ? 'Đang apply' : 'Chưa apply'}
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
                                            ? 'Chuyển sang chế độ tự động trước khi apply job'
                                            : undefined
                                    }
                                    onClick={() => onToggle?.(job)}
                                >
                                    {togglingId === job.applicationId
                                        ? 'Đang xử lý...'
                                        : job.isApplied
                                          ? 'Tắt apply'
                                          : 'Apply lịch job'}
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
