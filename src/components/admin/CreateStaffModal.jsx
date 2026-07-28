import { useEffect, useState } from 'react';
import ConfirmModal from '../common/ConfirmModal.jsx';
import { INTERNAL_STAFF_ROLE_OPTIONS } from '../../utils/adminAccountDisplay.js';

const emptyForm = {
    email: '',
    fullName: '',
    phone: '',
    role: INTERNAL_STAFF_ROLE_OPTIONS[0]?.value || '',
    reason: '',
};

const CreateStaffModal = ({ open, loading = false, onConfirm, onCancel }) => {
    const [form, setForm] = useState(emptyForm);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;
        setForm(emptyForm);
        setError('');
    }, [open]);

    if (!open) return null;

    const patch = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setError('');
    };

    const handleConfirm = () => {
        const email = form.email.trim();
        const fullName = form.fullName.trim();
        const phone = form.phone.trim();
        const reason = form.reason.trim();

        if (!email || !fullName || !form.role || !reason) {
            setError('Vui lòng điền email, họ tên, role và lý do.');
            return;
        }
        onConfirm?.({
            email,
            fullName,
            phone: phone || undefined,
            role: form.role,
            reason,
        });
    };

    return (
        <ConfirmModal
            open={open}
            title="Tạo tài khoản nội bộ"
            confirmLabel="Tạo tài khoản"
            variant="primary"
            loading={loading}
            onConfirm={handleConfirm}
            onCancel={onCancel}
        >
            <div className="admin-accounts__form-grid">
                <label className="admin-accounts__field">
                    <span>Email</span>
                    <input
                        type="email"
                        value={form.email}
                        onChange={(e) => patch('email', e.target.value)}
                        placeholder="staff@joblink.vn"
                    />
                </label>
                <label className="admin-accounts__field">
                    <span>Họ và tên</span>
                    <input
                        type="text"
                        value={form.fullName}
                        onChange={(e) => patch('fullName', e.target.value)}
                        placeholder="Nguyễn Văn A"
                    />
                </label>
                <label className="admin-accounts__field">
                    <span>Số điện thoại</span>
                    <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => patch('phone', e.target.value)}
                        placeholder="0901..."
                    />
                </label>
                <label className="admin-accounts__field">
                    <span>Role</span>
                    <select value={form.role} onChange={(e) => patch('role', e.target.value)}>
                        {INTERNAL_STAFF_ROLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="admin-accounts__field admin-accounts__field--full">
                    <span>Lý do (bắt buộc)</span>
                    <textarea
                        rows={3}
                        value={form.reason}
                        onChange={(e) => patch('reason', e.target.value)}
                        placeholder="Lý do tạo tài khoản..."
                    />
                </label>
            </div>
            {error ? <p className="admin-accounts__field-error">{error}</p> : null}
            <p className="admin-accounts__hint">
                Chỉ tạo được Post Manager, Manual Check hoặc Admin. Password tạm do BE sinh (email kích
                hoạt có thể chưa gửi).
            </p>
        </ConfirmModal>
    );
};

export default CreateStaffModal;
