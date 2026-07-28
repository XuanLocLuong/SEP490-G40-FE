import { useEffect, useState } from 'react';
import ConfirmModal from '../common/ConfirmModal.jsx';

/**
 * Modal nhập reason bắt buộc cho các action Admin account.
 * mode: 'status' | 'revoke' | 'role'
 */
const AccountActionModal = ({
    open,
    mode,
    title,
    confirmLabel = 'Xác nhận',
    variant = 'primary',
    loading = false,
    statusOptions = [],
    roleOptions = [],
    initialStatus = '',
    initialRole = '',
    onConfirm,
    onCancel,
}) => {
    const [reason, setReason] = useState('');
    const [status, setStatus] = useState(initialStatus);
    const [role, setRole] = useState(initialRole);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;
        setReason('');
        setError('');
        setStatus(initialStatus || statusOptions[0]?.status || '');
        setRole(initialRole || '');
        // Chỉ reset khi mở modal
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    if (!open) return null;

    const handleConfirm = () => {
        const trimmed = reason.trim();
        if (!trimmed) {
            setError('Vui lòng nhập lý do.');
            return;
        }
        if (mode === 'status' && !status) {
            setError('Vui lòng chọn trạng thái.');
            return;
        }
        if (mode === 'role' && !role) {
            setError('Vui lòng chọn role.');
            return;
        }
        setError('');
        onConfirm?.({
            reason: trimmed,
            status: mode === 'status' ? status : undefined,
            role: mode === 'role' ? role : undefined,
        });
    };

    return (
        <ConfirmModal
            open={open}
            title={title}
            confirmLabel={confirmLabel}
            variant={variant}
            loading={loading}
            onConfirm={handleConfirm}
            onCancel={onCancel}
        >
            {mode === 'status' && statusOptions.length > 0 && (
                <label className="admin-accounts__field">
                    <span>Trạng thái mới</span>
                    <select
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value);
                            setError('');
                        }}
                        disabled={statusOptions.length === 1}
                    >
                        {statusOptions.map((opt) => (
                            <option key={opt.status} value={opt.status}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </label>
            )}

            {mode === 'role' && (
                <label className="admin-accounts__field">
                    <span>Role mới</span>
                    <select
                        value={role}
                        onChange={(e) => {
                            setRole(e.target.value);
                            setError('');
                        }}
                    >
                        <option value="">-- Chọn role --</option>
                        {roleOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </label>
            )}

            <label className="admin-accounts__field">
                <span>Lý do (bắt buộc)</span>
                <textarea
                    rows={3}
                    value={reason}
                    placeholder="Nhập lý do thao tác..."
                    onChange={(e) => {
                        setReason(e.target.value);
                        setError('');
                    }}
                />
            </label>
            {error ? <p className="admin-accounts__field-error">{error}</p> : null}
        </ConfirmModal>
    );
};

export default AccountActionModal;
