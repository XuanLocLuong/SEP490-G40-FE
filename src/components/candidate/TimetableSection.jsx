import UploadTimetable from './UploadTimetable.jsx';
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
    file,
    previewUrl,
    uploading,
    onFileChange,
    onUpload,
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
        <div className="timetable-wrapper">
            <UploadTimetable
                file={file}
                previewUrl={previewUrl}
                uploading={uploading}
                onFileChange={onFileChange}
                onUpload={onUpload}
            />

            <section className="availability-card availability-range">
                <div className="availability-card__header">
                    <div>
                        <h2>Chi tiết ca bận</h2>
                        <p>
                            Các ca bận học, việc cá nhân trong tuần.{' '}
                            <strong>Áp dụng lịch bận</strong> để hệ thống tự động trừ đi và tính thời gian có thể đi làm.
                            {sourceLabel ? ` · ${sourceLabel}` : ''}
                        </p>
                    </div>
                    <div className="timetable-section__toggle">
                        <span
                            className={`timetable-section__badge${
                                timetable.isApplied ? ' timetable-section__badge--on' : ''
                            }`}
                        >
                            {timetable.isApplied ? 'Đang áp dụng' : 'Chưa áp dụng'}
                        </span>
                        {hasTimetable ? (
                            timetable.isApplied ? (
                                <button
                                    type="button"
                                    className="availability-btn availability-btn--ghost"
                                    disabled={toggling}
                                    onClick={onUnapply}
                                >
                                    {toggling ? 'Đang xử lý...' : 'Ngưng áp dụng lịch bận'}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="availability-btn availability-btn--primary"
                                    disabled={toggling}
                                    onClick={onApply}
                                >
                                    {toggling ? 'Đang xử lý...' : 'Áp dụng lịch bận'}
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
                    title="Khung giờ bận trong tuần"
                    emptyText="Chưa có lịch bận. Tải ảnh thời khóa biểu phía trên hoặc bấm thêm khung giờ bên dưới."
                    addButtonLabel="Thêm khung giờ bận thủ công"
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
                              ? 'Cập nhật lịch bận'
                              : 'Lưu lịch bận'}
                    </button>
                </div>
            </section>
        </div>
    );
};

export default TimetableSection;
