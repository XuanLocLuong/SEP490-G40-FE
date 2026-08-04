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
                    {isManual ? 'Chế độ: Tự nhập lịch rảnh' : 'Chế độ: Tự động tính từ TKB + Job'}
                </span>
                <p>
                    {isManual
                        ? 'Bạn đang chỉnh lịch rảnh trực tiếp. BE đã tắt apply TKB và job khi sang chế độ này. Muốn tính lại từ TKB/job: bật chế độ tự động rồi apply lại.'
                        : 'Lịch rảnh được hệ thống tính từ TKB đang apply và các job đã nhận đang apply (06:00–22:00, gap ≥ 2h).'}
                </p>
                {totalHiredJobCount > 0 ? (
                    <p className="schedule-mode-banner__meta">
                        Job đang apply lịch: {appliedJobCount}/{totalHiredJobCount}
                    </p>
                ) : null}
                {isTimetableExpired ? (
                    <p className="schedule-mode-banner__warn" role="status">
                        Thời khóa biểu đã hết hạn. Vui lòng cập nhật khoảng ngày / quét lại TKB.
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
                                ? 'Sau khi bật tự động, nhớ apply TKB (và job) để tính lại lịch rảnh'
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
