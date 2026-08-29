const ScheduleModeBanner = ({
    scheduleMode,
    onSwitchToManual,
    onSwitchToCalculated,
    timetableApplied = false,
    isTimetableExpired = false,
    appliedJobCount = 0,
    totalHiredJobCount = 0,
    modeSwitching = false,
}) => {
    const isManual = scheduleMode === 'MANUAL';
    const isCalculated = !isManual;

    return (
        <section className="availability-card schedule-mode-banner">
            <div className="schedule-mode-banner__content">
                <span
                    className={`schedule-mode-banner__badge${
                        isManual ? ' schedule-mode-banner__badge--manual' : ''
                    }`}
                >
                    {isManual
                        ? 'Chế độ: Tự nhập thời gian đi làm'
                        : 'Chế độ: Tự động tính từ Thời khóa biểu + Việc đã nhận'}
                </span>
                <p>
                    {isManual
                        ? 'Bạn đang tự điều chỉnh thời gian đi làm trực tiếp. Hệ thống sẽ ngưng áp dụng lịch bận khi ở chế độ này. Muốn hệ thống tính tự động: bấm Bật chế độ tự động.'
                        : 'Thời gian đi làm được hệ thống tự động tính từ lịch bận (thời khóa biểu) và các việc đã nhận đang áp dụng.'}
                </p>
                {totalHiredJobCount > 0 ? (
                    <p className="schedule-mode-banner__meta">
                        Việc đã nhận đang áp dụng lịch: {appliedJobCount}/{totalHiredJobCount}
                    </p>
                ) : null}
                {isTimetableExpired ? (
                    <p className="schedule-mode-banner__warn" role="status">
                        Lịch bận đã hết hạn. Vui lòng cập nhật khoảng ngày hoặc quét lại lịch bận.
                    </p>
                ) : null}
            </div>
            <div className="schedule-mode-banner__actions">
                {isCalculated ? (
                    <button
                        type="button"
                        className="availability-btn availability-btn--secondary"
                        onClick={onSwitchToManual}
                        disabled={modeSwitching}
                    >
                        {modeSwitching ? 'Đang chuyển...' : 'Chuyển sang tự nhập'}
                    </button>
                ) : (
                    <button
                        type="button"
                        className="availability-btn availability-btn--secondary"
                        onClick={onSwitchToCalculated}
                        disabled={modeSwitching}
                        title={
                            !timetableApplied
                                ? 'Sau khi bật tự động, nhớ áp dụng lịch bận (và việc đã nhận) để tính lại thời gian đi làm'
                                : undefined
                        }
                    >
                        {modeSwitching ? 'Đang chuyển...' : 'Bật chế độ tự động'}
                    </button>
                )}
            </div>
        </section>
    );
};

export default ScheduleModeBanner;
