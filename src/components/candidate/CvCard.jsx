import { useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { FileTextIcon } from '../common/icons.jsx';
import { UploadCloudIcon } from './profileIcons.jsx';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];

const isAllowedExtension = (filename = '') => {
    const lower = filename.toLowerCase();
    return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
};

const CvCard = ({ cvLink, onUploadCv, saving }) => {
    const fileInputRef = useRef(null);
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleFile = async (file) => {
        if (!file) return;

        if (!isAllowedExtension(file.name)) {
            toast.error('Định dạng CV không hợp lệ. Chỉ chấp nhận file PDF, DOC, DOCX.');
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            toast.error('Dung lượng CV quá lớn. Vui lòng chọn file nhỏ hơn 5MB.');
            return;
        }

        setUploading(true);
        try {
            await onUploadCv(file);
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleFileInputChange = (e) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    };

    const isBusy = saving || uploading;

    return (
        <section className="cp-card">
            <div className="cp-card__head">
                <h2 className="cp-card__title">
                    <FileTextIcon className="cp-card__title-icon" width={18} height={18} />
                    CV đính kèm (Mặc định)
                </h2>
            </div>

            {cvLink ? (
                <div className="cp-cv-display" style={{ marginTop: '12px' }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '14px 16px',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            gap: '12px',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                            <div
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 6,
                                    background: '#e0f2fe',
                                    color: '#0284c7',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                <FileTextIcon width={20} height={20} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <p
                                    style={{
                                        margin: 0,
                                        fontWeight: 600,
                                        fontSize: '14px',
                                        color: '#1e293b',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}
                                >
                                    File CV đã tải lên
                                </p>
                                <a
                                    href={cvLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        fontSize: '13px',
                                        color: '#2563eb',
                                        textDecoration: 'none',
                                        fontWeight: 500,
                                    }}
                                >
                                    Xem hoặc tải xuống CV →
                                </a>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="cp-btn cp-btn--ghost"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isBusy}
                            style={{ flexShrink: 0, fontSize: '13px' }}
                        >
                            {uploading ? 'Đang tải lên...' : 'Thay đổi CV'}
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => !isBusy && fileInputRef.current?.click()}
                    style={{
                        marginTop: '12px',
                        padding: '24px 16px',
                        border: dragging ? '2px dashed #2563eb' : '2px dashed #cbd5e1',
                        borderRadius: '8px',
                        background: dragging ? '#eff6ff' : '#f8fafc',
                        textAlign: 'center',
                        cursor: isBusy ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                    }}
                >
                    <div style={{ color: dragging ? '#2563eb' : '#64748b', marginBottom: '8px' }}>
                        <UploadCloudIcon width={32} height={32} />
                    </div>
                    <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                        {uploading
                            ? 'Đang tải lên CV...'
                            : 'Kéo thả file CV vào đây hoặc bấm để chọn file'}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                        Hỗ trợ PDF, DOC, DOCX (Tối đa 5MB)
                    </p>
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                style={{ display: 'none' }}
                onChange={handleFileInputChange}
            />
        </section>
    );
};

export default CvCard;
