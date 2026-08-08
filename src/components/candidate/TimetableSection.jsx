import AvailabilityEditor from './AvailabilityEditor.jsx';
import ScheduleDateRangeFields from './ScheduleDateRangeFields.jsx';

const TimetableSection = ({
    timetable,
    loading = false,
    saving = false,
    toggling = false,
    slots,
    startDate,
    endDate,
    rangeError = '',
    slotErrors = {},
    onSlotsChange,
    onRangeChange,
    onSave,
    onApply,
    onUnapply,
}) => {
    const hasTimetable = timetable.slots.length > 0;
    const sourceLabel =
        timetable.source === 'AI_SCAN'
            ? 'Nguồn: Quét AI'
            : timetable.source === 'MANUAL'
              ? 'Nguồn: Nhập tay'
              : null;

    if (loading) {
        return (
            <section className="availability-card">
                <div className="availability-skeleton availability-skeleton--title" />
                <div className="availability-skeleton availability-skeleton--line" />
            </section>
        );
    }

    return (
        <section className="availability-card availability-range">
            <div className="availability-card__header">
                <div>
                    <h2>Thời khóa biểu (lịch học bận)</h2>
                    <p>
                        Nhập tay các <strong>ca học bận</strong> (giờ có lớp). Apply TKB để hệ thống tính
                        lịch rảnh (chế độ tự động). Muốn gợi ý lịch rảnh từ ảnh: dùng tab{' '}
                        <strong>Quét TKB</strong>.
                        {sourceLabel ? ` · ${sourceLabel}` : ''}
                    </p>
                </div>
                <div className="timetable-section__toggle">
                    <span
                        className={`timetable-section__badge${
                            timetable.isApplied ? ' timetable-section__badge--on' : ''
                        }`}
                    >
                        {timetable.isApplied ? 'Đang apply' : 'Chưa apply'}
                    </span>
                    {hasTimetable ? (
                        timetable.isApplied ? (
                            <button
                                type="button"
                                className="availability-btn availability-btn--ghost"
                                disabled={toggling}
                                onClick={onUnapply}
                            >
                                {toggling ? 'Đang xử lý...' : 'Tắt apply TKB'}
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="availability-btn availability-btn--primary"
                                disabled={toggling}
                                onClick={onApply}
                            >
                                {toggling ? 'Đang xử lý...' : 'Apply TKB'}
                            </button>
                        )
                    ) : null}
                </div>
            </div>

            <ScheduleDateRangeFields
                startDate={startDate}
                endDate={endDate}
                onChange={onRangeChange}
                error={rangeError}
            />

            <AvailabilityEditor
                slots={slots}
                onChange={onSlotsChange}
                errors={slotErrors}
                embedded
                title="Khung giờ bận (thời khóa biểu)"
                emptyText="Chưa có TKB. Thêm khung giờ bận thủ công hoặc quét ảnh ở tab Quét TKB để gợi ý lịch rảnh."
                addButtonLabel="Thêm khung giờ bận"
            />

            <div className="timetable-section__footer">
                <button
                    type="button"
                    className="availability-btn availability-btn--primary"
                    onClick={onSave}
                    disabled={saving}
                >
                    {saving
                        ? 'Đang lưu...'
                        : hasTimetable
                          ? 'Cập nhật thời khóa biểu'
                          : 'Lưu thời khóa biểu'}
                </button>
            </div>
        </section>
    );
};

export default TimetableSection;
