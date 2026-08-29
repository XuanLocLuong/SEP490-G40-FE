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
                        ? 'Chế độ: Tự nhập lịch rảnh'
                        : 'Chế độ: Tự động tính từ lịch bận + việc đã nhận'}
                </span>
                <p>
                    {isManual
                        ? 'Bạn đang chỉnh lịch rảnh trực tiếp. Hệ thống đã ngưng áp dụng lịch bận và việc đã nhận khi sang chế độ này. Muốn tính lại từ lịch bận / việc đã nhận: bật chế độ tự động rồi áp dụng lại.'
                        : 'Lịch rảnh được hệ thống tính từ lịch bận đang áp dụng và các việc đã nhận đang áp dụng.'}
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
                                ? 'Sau khi bật tự động, nhớ áp dụng lịch bận (và việc đã nhận) để tính lại lịch rảnh'
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
