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
                    <h2>Gợi ý từ thời khóa biểu</h2>
                    <p>
                        AI chỉ gợi ý khung giờ. Chọn khoảng ngày áp dụng, chỉnh sửa nếu cần, rồi lưu chính thức.
                    </p>
                </div>
                <button type="button" className="availability-btn availability-btn--ghost" onClick={onCancel}>
                    Bỏ kết quả OCR
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

            <AvailabilityEditor slots={slots} onChange={onChange} errors={errors} />

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
                    {saving ? 'Đang lưu...' : 'Áp dụng & lưu lịch'}
                </button>
            </div>
        </section>
    );
};

export default OCRPreview;
