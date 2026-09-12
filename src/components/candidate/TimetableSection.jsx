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
    hasUnsavedScan = false,
    onDiscardScan,
    file,
    previewUrl,
    uploading,
    onFileChange,
    onUpload,
}) => {
    const hasTimetable = timetable.slots.length > 0;
    const sourceLabel = hasUnsavedScan
        ? 'Nguồn: Bản nháp quét AI (Chưa lưu)'
        : timetable.source === 'AI_SCAN'
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
                {hasUnsavedScan && (
                    <div className="timetable-section__draft-alert" role="alert">
                        <div className="timetable-section__draft-alert-content">
                            <strong>AI đã trích xuất các ca bận từ ảnh mới (Chưa lưu).</strong>
                            <p>
                                Lịch bận hiện tại trong hệ thống vẫn đang có hiệu lực cho đến khi bạn chọn ngày bắt đầu - kết thúc và bấm &quot;Lưu &amp; áp dụng lịch bận mới&quot;.
                            </p>
                        </div>
                        {onDiscardScan && (
                            <button
                                type="button"
                                className="availability-btn availability-btn--ghost timetable-section__draft-discard-btn"
                                onClick={onDiscardScan}
                                disabled={saving}
                            >
                                Hủy bản nháp
                            </button>
                        )}
                    </div>
                )}

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
                        {hasUnsavedScan ? (
                            <span className="timetable-section__badge timetable-section__badge--draft">
                                Bản nháp vừa quét — Chưa lưu
                            </span>
                        ) : (
                            <>
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
                            </>
                        )}
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
                    {hasUnsavedScan && onDiscardScan ? (
                        <button
                            type="button"
                            className="availability-btn availability-btn--ghost"
                            onClick={onDiscardScan}
                            disabled={saving}
                        >
                            Hủy bản nháp
                        </button>
                    ) : null}
                    <button
                        type="button"
                        className="availability-btn availability-btn--primary"
                        onClick={onSave}
                        disabled={saving}
                    >
                        {saving
                            ? 'Đang lưu...'
                            : hasUnsavedScan
                              ? 'Lưu & áp dụng lịch bận mới'
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
