import AvailabilityEditor from './AvailabilityEditor.jsx';

const OCRPreview = ({
    slots,
    startDate = '',
    endDate = '',
    rangeError = '',
    errors,
    onChange,
    onRangeChange,
    onApply,
    onCancel,
    saving,
}) => {
    if (!slots) return null;

    return (
        <section className="availability-ocr">
            <div className="availability-ocr__header">
                <div>
                    <h2>Gợi ý lịch rảnh từ thời khóa biểu</h2>
                    <p>
                        AI đọc lịch học bận trên ảnh và tính các khung giờ <strong>rảnh</strong> (trong
                        06:00–22:00). Chọn khoảng ngày, chỉnh sửa nếu cần, rồi lưu vào lịch rảnh (chế độ
                        tự nhập trên app).
                    </p>
                </div>
                <button type="button" className="availability-btn availability-btn--ghost" onClick={onCancel}>
                    Bỏ gợi ý
                </button>
            </div>

            <div className="availability-range availability-range--ocr">
                <div className="availability-range__fields">
                    <label className="availability-range__field">
                        <span>Ngày bắt đầu</span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => onRangeChange?.({ startDate: e.target.value, endDate })}
                        />
                    </label>
                    <label className="availability-range__field">
                        <span>Ngày kết thúc</span>
                        <input
                            type="date"
                            value={endDate}
                            min={startDate || undefined}
                            onChange={(e) => onRangeChange?.({ startDate, endDate: e.target.value })}
                        />
                    </label>
                </div>
                {rangeError ? (
                    <p className="availability-range__error">{rangeError}</p>
                ) : null}
            </div>

            <AvailabilityEditor
                slots={slots}
                onChange={onChange}
                errors={errors}
                title="Khung giờ rảnh gợi ý"
                emptyText="Không có khung giờ rảnh nào được trích xuất."
                addButtonLabel="Thêm khung giờ rảnh"
            />

            <div className="availability-ocr__footer">
                <button type="button" className="availability-btn availability-btn--secondary" onClick={onCancel}>
                    Hủy
                </button>
                <button
                    type="button"
                    className="availability-btn availability-btn--primary"
                    onClick={onApply}
                    disabled={saving}
                >
                    {saving ? 'Đang lưu...' : 'Lưu lịch rảnh'}
                </button>
            </div>
        </section>
    );
};

export default OCRPreview;
