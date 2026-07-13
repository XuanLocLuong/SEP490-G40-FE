import AvailabilityEditor from './AvailabilityEditor.jsx';

const OCRPreview = ({ slots, errors, onChange, onApply, onCancel, saving }) => {
    if (!slots) return null;

    return (
        <section className="availability-ocr">
            <div className="availability-ocr__header">
                <div>
                    <h2>Kết quả quét thời khóa biểu</h2>
                    <p>Kiểm tra và chỉnh sửa các khung giờ AI đã trích xuất trước khi lưu.</p>
                </div>
                <button type="button" className="availability-btn availability-btn--ghost" onClick={onCancel}>
                    Bỏ kết quả OCR
                </button>
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
                    {saving ? 'Đang lưu...' : 'Lưu kết quả OCR'}
                </button>
            </div>
        </section>
    );
};

export default OCRPreview;
