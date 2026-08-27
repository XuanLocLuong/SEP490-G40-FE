import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getReasonMessage } from '../../utils/applicationErrorMessages.js';
import { setPendingApplyReturn } from '../../utils/applyReturnStorage.js';
import { ROUTES } from '../../routes/path.js';
import { formatShiftGroupLine } from '../../utils/formatters.js';
import '../../assets/styles/JobApplyModalStyle.css';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];

const isAllowedExtension = (filename = '') => {
    const lower = filename.toLowerCase();
    return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
};

const JobApplyConfirmModal = ({
    open,
    jobId,
    preview,
    scheduleSummary,
    shiftGroups = [],
    loading,
    applying,
    onClose,
    onConfirm,
}) => {
    const fileInputRef = useRef(null);
    const profileCvLink = preview?.profileCvLink || preview?.cvLink || '';
    const [userSelectedMode, setUserSelectedMode] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileError, setFileError] = useState('');
    const cvMode = userSelectedMode ?? (profileCvLink ? 'PROFILE' : 'NONE');
    const blockingReasons = preview?.blockingReasons || [];
    const isCvValid = cvMode !== 'UPLOAD' || Boolean(selectedFile);
    const canApply = preview?.eligible && !loading && !applying && !fileError && isCvValid;

    if (!open) return null;

    const handlePreviewSelectedFile = (e) => {
        e.preventDefault();
        if (!selectedFile) return;
        const url = URL.createObjectURL(selectedFile);
        window.open(url, '_blank', 'noopener,noreferrer');
        window.setTimeout(() => URL.revokeObjectURL(url), 10000);
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setFileError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClose = () => {
        setUserSelectedMode(null);
        handleRemoveFile();
        onClose?.();
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) {
            setSelectedFile(null);
            setFileError('');
            return;
        }

        if (!isAllowedExtension(file.name)) {
            setFileError('Định dạng CV không hợp lệ (hỗ trợ PDF, DOC, DOCX).');
            setSelectedFile(null);
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            setFileError('Dung lượng CV quá lớn (tối đa 5MB).');
            setSelectedFile(null);
            return;
        }

        setFileError('');
        setSelectedFile(file);
    };

    const handleConfirmClick = () => {
        if (cvMode === 'UPLOAD' && !selectedFile) {
            setFileError('Vui lòng chọn file CV để tải lên.');
            return;
        }
        if (!canApply) return;
        onConfirm?.({
            cvMode,
            file: cvMode === 'UPLOAD' ? selectedFile : null,
        });
    };

    const handleUpdateProfileClick = () => {
        setPendingApplyReturn({
            jobId,
            jobTitle: preview?.jobTitle || '',
        });
        handleClose();
    };

    return (
        <div className="job-apply-modal" role="dialog" aria-modal="true" aria-labelledby="job-apply-modal-title">
            <button
                type="button"
                className="job-apply-modal__backdrop"
                aria-label="Đóng"
                onClick={handleClose}
            />

            <div className="job-apply-modal__panel">
                <div className="job-apply-modal__header">
                    <h2 id="job-apply-modal-title">Xác nhận ứng tuyển</h2>
                    <button type="button" className="job-apply-modal__close" onClick={handleClose}>
                        ×
                    </button>
                </div>

                <div className="job-apply-modal__body">
                    {loading ? (
                        <p className="job-apply-modal__loading">Đang kiểm tra điều kiện ứng tuyển...</p>
                    ) : (
                        <>
                            <div className="job-apply-modal__job">
                                <h3>{preview?.jobTitle || '—'}</h3>
                                {preview?.businessName && (
                                    <p className="job-apply-modal__company">{preview.businessName}</p>
                                )}
                            </div>

                            {scheduleSummary && (
                                <div className="job-apply-modal__field">
                                    <span className="job-apply-modal__label">Thời gian làm việc (dự kiến)</span>
                                    <p>{scheduleSummary}</p>
                                </div>
                            )}

                            {shiftGroups.length > 1 && (
                                <ul className="job-apply-modal__shifts">
                                    {shiftGroups.map((shift) => (
                                        <li key={`${shift.range}-${shift.days?.join(',')}`}>
                                            {formatShiftGroupLine(shift)}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {preview?.remainingPositions != null && preview.vacancyAvailable && (
                                <p className="job-apply-modal__meta">
                                    Còn {preview.remainingPositions} vị trí.
                                </p>
                            )}

                            <p className="job-apply-modal__note">
                                Trao đổi ca làm với nhà tuyển dụng trước khi ứng tuyển nếu bạn cần làm rõ lịch
                                cụ thể.
                            </p>

                            {/* Khu vực đính kèm CV (khi đủ điều kiện apply) */}
                            {preview?.eligible && (
                                <div
                                    style={{
                                        marginTop: '16px',
                                        padding: '12px 14px',
                                        background: '#f8fafc',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            color: '#334155',
                                            display: 'block',
                                            marginBottom: '8px',
                                        }}
                                    >
                                        Hồ sơ CV đính kèm (Không bắt buộc)
                                    </span>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {profileCvLink ? (
                                            <label
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    fontSize: '13px',
                                                    cursor: 'pointer',
                                                    color: '#1e293b',
                                                }}
                                            >
                                                <input
                                                    type="radio"
                                                    name="cvOption"
                                                    value="PROFILE"
                                                    checked={cvMode !== 'UPLOAD'}
                                                    onChange={() => {
                                                        setUserSelectedMode('PROFILE');
                                                        handleRemoveFile();
                                                    }}
                                                />
                                                <span>
                                                    Dùng CV trong hồ sơ (
                                                    <a
                                                        href={profileCvLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{ color: '#2563eb', textDecoration: 'none' }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        Xem CV
                                                    </a>
                                                    )
                                                </span>
                                            </label>
                                        ) : (
                                            <label
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    fontSize: '13px',
                                                    cursor: 'pointer',
                                                    color: '#1e293b',
                                                }}
                                            >
                                                <input
                                                    type="radio"
                                                    name="cvOption"
                                                    value="NONE"
                                                    checked={cvMode !== 'UPLOAD'}
                                                    onChange={() => {
                                                        setUserSelectedMode('NONE');
                                                        handleRemoveFile();
                                                    }}
                                                />
                                                <span>Không đính kèm CV</span>
                                            </label>
                                        )}

                                        <label
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                fontSize: '13px',
                                                cursor: 'pointer',
                                                color: '#1e293b',
                                            }}
                                        >
                                            <input
                                                type="radio"
                                                name="cvOption"
                                                value="UPLOAD"
                                                checked={cvMode === 'UPLOAD'}
                                                onChange={() => setUserSelectedMode('UPLOAD')}
                                            />
                                            <span>Tải lên CV mới cho vị trí này</span>
                                        </label>

                                        {cvMode === 'UPLOAD' && (
                                            <div style={{ marginLeft: '24px', marginTop: '4px' }}>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                                    onChange={handleFileChange}
                                                    style={{ fontSize: '12px' }}
                                                />
                                                <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748b' }}>
                                                    Chấp nhận PDF, DOC, DOCX (tối đa 5MB)
                                                </p>
                                                {fileError && (
                                                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#dc2626' }}>
                                                        {fileError}
                                                    </p>
                                                )}
                                                {selectedFile && !fileError && (
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            marginTop: '8px',
                                                            padding: '8px 12px',
                                                            background: '#f0fdf4',
                                                            border: '1px solid #bbf7d0',
                                                            borderRadius: '6px',
                                                            gap: '8px',
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                minWidth: 0,
                                                            }}
                                                        >
                                                            <span style={{ color: '#16a34a', fontWeight: 'bold' }}>
                                                                ✓
                                                            </span>
                                                            <span
                                                                style={{
                                                                    fontSize: '13px',
                                                                    fontWeight: 500,
                                                                    color: '#166534',
                                                                    whiteSpace: 'nowrap',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    maxWidth: '170px',
                                                                }}
                                                                title={selectedFile.name}
                                                            >
                                                                {selectedFile.name}
                                                            </span>
                                                            <span
                                                                style={{
                                                                    fontSize: '11px',
                                                                    color: '#65a30d',
                                                                    flexShrink: 0,
                                                                }}
                                                            >
                                                                ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                                            </span>
                                                        </div>

                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                flexShrink: 0,
                                                            }}
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={handlePreviewSelectedFile}
                                                                style={{
                                                                    background: 'transparent',
                                                                    border: 'none',
                                                                    fontSize: '12px',
                                                                    color: '#2563eb',
                                                                    textDecoration: 'underline',
                                                                    fontWeight: 500,
                                                                    cursor: 'pointer',
                                                                    padding: 0,
                                                                }}
                                                            >
                                                                Xem thử file
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={handleRemoveFile}
                                                                style={{
                                                                    background: '#fee2e2',
                                                                    border: '1px solid #fecaca',
                                                                    color: '#dc2626',
                                                                    fontSize: '11px',
                                                                    cursor: 'pointer',
                                                                    padding: '2px 6px',
                                                                    borderRadius: '4px',
                                                                    fontWeight: 500,
                                                                }}
                                                                title="Bỏ chọn file này"
                                                            >
                                                                Bỏ chọn ✕
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {blockingReasons.length > 0 && (
                                <ul className="job-apply-modal__errors">
                                    {blockingReasons.map((reason) => (
                                        <li key={reason}>
                                            <span>
                                                {getReasonMessage(reason, {
                                                    missingProfileFields:
                                                        preview?.missingProfileFields,
                                                })}
                                            </span>
                                            {reason === 'PROFILE_INCOMPLETE' && (
                                                <>
                                                    {' '}
                                                    <Link
                                                        to={ROUTES.CANDIDATE_PROFILE}
                                                        className="job-apply-modal__profile-link"
                                                        onClick={handleUpdateProfileClick}
                                                    >
                                                        Cập nhật hồ sơ
                                                    </Link>
                                                </>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </>
                    )}
                </div>

                <div className="job-apply-modal__footer">
                    <button
                        type="button"
                        className="job-apply-modal__btn job-apply-modal__btn--ghost"
                        onClick={handleClose}
                        disabled={applying}
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        className="job-apply-modal__btn job-apply-modal__btn--primary"
                        onClick={handleConfirmClick}
                        disabled={!canApply}
                        title={
                            cvMode === 'UPLOAD' && !selectedFile
                                ? 'Vui lòng chọn file CV để ứng tuyển.'
                                : undefined
                        }
                    >
                        {applying ? 'Đang gửi...' : 'Xác nhận ứng tuyển'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JobApplyConfirmModal;
