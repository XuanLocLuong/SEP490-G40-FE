import { useEffect, useState } from 'react';
import ConfirmModal from '../common/ConfirmModal.jsx';
import {
    CONFIG_DATA_TYPE,
    getConfigDataTypeLabel,
    parseAndValidateConfigValue,
    toConfigDraftString,
} from '../../utils/adminSystemConfigDisplay.js';

/**
 * Modal cập nhật 1 system config: newValue + reason bắt buộc.
 */
const UpdateSystemConfigModal = ({
    open,
    config,
    loading = false,
    onConfirm,
    onCancel,
}) => {
    const [draft, setDraft] = useState('');
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open || !config) return;
        setDraft(toConfigDraftString(config.currentValue, config.dataType));
        setReason('');
        setError('');
    }, [open, config]);

    if (!open || !config) return null;

    const dataType = String(config.dataType || '').toUpperCase();

    const handleConfirm = () => {
        const trimmedReason = reason.trim();
        if (!trimmedReason) {
            setError('Vui lòng nhập lý do.');
            return;
        }
        const parsed = parseAndValidateConfigValue(draft, config);
        if (!parsed.ok) {
            setError(parsed.error);
            return;
        }
        setError('');
        onConfirm?.({ newValue: parsed.value, reason: trimmedReason });
    };

    const handleResetDefault = () => {
        setDraft(toConfigDraftString(config.defaultValue, config.dataType));
        setError('');
    };

    return (
        <ConfirmModal
            open={open}
            title={`Cập nhật: ${config.configKey}`}
            confirmLabel="Lưu cấu hình"
            variant="primary"
            loading={loading}
            onConfirm={handleConfirm}
            onCancel={onCancel}
        >
            <p className="admin-config__hint" style={{ marginBottom: 12 }}>
                {config.description || 'Không có mô tả.'}
            </p>

            <div className="admin-config__meta-row">
                <span>Kiểu: <strong>{getConfigDataTypeLabel(config.dataType)}</strong></span>
                {config.allowedRange ? (
                    <span>Phạm vi: <strong>{config.allowedRange}</strong></span>
                ) : null}
            </div>

            <label className="admin-accounts__field">
                <span>Giá trị mới</span>
                {dataType === CONFIG_DATA_TYPE.BOOLEAN ? (
                    <select
                        value={draft}
                        onChange={(e) => {
                            setDraft(e.target.value);
                            setError('');
                        }}
                        disabled={loading}
                    >
                        <option value="true">Bật (true)</option>
                        <option value="false">Tắt (false)</option>
                    </select>
                ) : dataType === CONFIG_DATA_TYPE.JSON ? (
                    <textarea
                        rows={8}
                        value={draft}
                        onChange={(e) => {
                            setDraft(e.target.value);
                            setError('');
                        }}
                        disabled={loading}
                        spellCheck={false}
                        className="admin-config__json-input"
                    />
                ) : (
                    <input
                        type={dataType === CONFIG_DATA_TYPE.NUMBER ? 'number' : 'text'}
                        step="any"
                        value={draft}
                        onChange={(e) => {
                            setDraft(e.target.value);
                            setError('');
                        }}
                        disabled={loading}
                    />
                )}
            </label>

            <div className="admin-config__modal-actions">
                <button
                    type="button"
                    className="admin-accounts-btn admin-accounts-btn--ghost"
                    onClick={handleResetDefault}
                    disabled={loading}
                >
                    Đặt về mặc định
                </button>
                <span className="admin-config__hint">
                    Mặc định: {toConfigDraftString(config.defaultValue, config.dataType) || '—'}
                </span>
            </div>

            <label className="admin-accounts__field">
                <span>Lý do thay đổi</span>
                <textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => {
                        setReason(e.target.value);
                        setError('');
                    }}
                    placeholder="Bắt buộc nhập lý do…"
                    disabled={loading}
                />
            </label>

            {error ? <p className="admin-accounts__field-error">{error}</p> : null}
        </ConfirmModal>
    );
};

export default UpdateSystemConfigModal;
