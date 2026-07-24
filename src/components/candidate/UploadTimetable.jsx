import { useRef, useState } from 'react';
import { UploadCloudIcon } from './profileIcons.jsx';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png'];

const UploadTimetable = ({ file, previewUrl, uploading, onFileChange, onUpload }) => {
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);
    const [error, setError] = useState('');

    const pickFile = (nextFile) => {
        if (!nextFile) return;
        if (!ACCEPTED_TYPES.includes(nextFile.type)) {
            setError('Chỉ chấp nhận ảnh JPG hoặc PNG.');
            return;
        }
        setError('');
        onFileChange(nextFile);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setDragging(false);
        pickFile(event.dataTransfer.files?.[0]);
    };

    return (
        <section className="availability-card upload-timetable">
            <div
                className={'upload-timetable__dropzone' + (dragging ? ' upload-timetable__dropzone--dragging' : '')}
                onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
            >
                <div className="upload-timetable__icon">
                    <UploadCloudIcon width={34} height={34} />
                </div>
                <h2>Tải lên ảnh Thời khóa biểu của bạn (JPG, PNG)</h2>
                <p>Chỉ cần tải ảnh thời khóa biểu, AI sẽ đọc lịch bận và đề xuất các khung giờ rảnh - bạn vẫn có thể chỉnh sửa trước khi lưu.</p>

                {previewUrl && (
                    <div className="upload-timetable__preview">
                        <img src={previewUrl} alt="Ảnh thời khóa biểu đã chọn" />
                        <span className="upload-timetable__preview-name">{file?.name}</span>
                        <span className="upload-timetable__preview-hint">
                            Kiểm tra lại ảnh trước khi quét — tránh chọn nhầm.
                        </span>
                    </div>
                )}

                {error && <p className="upload-timetable__error">{error}</p>}

                <div className="upload-timetable__actions">
                    <button
                        type="button"
                        className="availability-btn availability-btn--secondary"
                        onClick={() => inputRef.current?.click()}
                        disabled={uploading}
                    >
                        Chọn ảnh
                    </button>
                    <button
                        type="button"
                        className="availability-btn availability-btn--primary"
                        onClick={onUpload}
                        disabled={!file || uploading}
                    >
                        {uploading ? 'Đang quét thời khóa biểu...' : 'Quét thời khóa biểu'}
                    </button>
                </div>

                <input
                    ref={inputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    hidden
                    onChange={(event) => pickFile(event.target.files?.[0])}
                />
            </div>
        </section>
    );
};

export default UploadTimetable;
