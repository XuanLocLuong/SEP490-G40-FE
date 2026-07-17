import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import UserAvatar from '../../components/common/UserAvatar.jsx';
import EditFieldModal from '../../components/common/EditFieldModal.jsx';
import { CheckCircleIcon, PencilIcon } from '../../components/common/icons.jsx';
import userApi, { getApiErrorMessage } from '../../apis/UserApi.jsx';
import { useAuth } from '../../contexts/authContext.js';
import { ROUTES } from '../../routes/path.js';
import '../../assets/styles/AccountSettingsStyle.css';

const PHONE_PATTERN = /^(\+84|0)[35789][0-9]{8}$/;
const MAX_AVATAR_SIZE = 10 * 1024 * 1024;

const hasProfilePicture = (url) => Boolean(url?.trim());

const mapUserFromApi = (data) => ({
    fullName: data?.fullName || '',
    phone: data?.phone || '',
    email: data?.email || '',
    emailVerified: data?.emailVerified ?? false,
    profilePicture: data?.profilePicture || null,
    googleLinked: data?.googleLinked ?? false,
});

const buildInitialUser = (auth) => ({
    fullName: auth?.fullName || '',
    phone: auth?.phone || '',
    email: auth?.email || '',
    emailVerified: auth?.emailVerified ?? false,
    profilePicture: auth?.profilePicture || null,
    googleLinked: auth?.googleLinked ?? false,
});

const CandidateSettingsPage = () => {
    const { auth, updateProfile, logout } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [user, setUser] = useState(() => buildInitialUser(auth));
    const [loading, setLoading] = useState(true);
    const [modalError, setModalError] = useState('');
    const [editModal, setEditModal] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [saving, setSaving] = useState(false);
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [changingPassword, setChangingPassword] = useState(false);

    const syncProfile = (data) => {
        const mapped = mapUserFromApi(data);
        setUser(mapped);
        updateProfile({
            fullName: mapped.fullName,
            phone: mapped.phone,
            email: mapped.email,
            emailVerified: mapped.emailVerified,
            profilePicture: mapped.profilePicture,
            googleLinked: mapped.googleLinked,
        });
    };

    useEffect(() => {
        let cancelled = false;

        const loadProfile = async () => {
            setLoading(true);

            try {
                const data = await userApi.getCurrentUser();
                if (!cancelled) {
                    syncProfile(data);
                }
            } catch (err) {
                if (!cancelled) {
                    toast.error(getApiErrorMessage(err, 'Không thể tải thông tin tài khoản.'));
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadProfile();

        return () => {
            cancelled = true;
        };
    }, []);

    const openEditModal = (field) => {
        setModalError('');
        setEditModal(field);
        setEditValue('');
    };

    const closeEditModal = () => {
        setEditModal(null);
        setEditValue('');
        setModalError('');
    };

    const handleEditValueChange = (value) => {
        setModalError('');
        setEditValue(value);
    };

    const handleModalSave = async () => {
        setModalError('');

        const normalized = editValue.trim();

        if (editModal === 'fullName') {
            if (!normalized) {
                setModalError('Họ và tên không được để trống.');
                return;
            }
            if (normalized === user.fullName) {
                setModalError('Họ và tên mới phải khác giá trị hiện tại.');
                return;
            }
        }

        if (editModal === 'phone') {
            if (!normalized) {
                setModalError('Vui lòng nhập số điện thoại mới.');
                return;
            }
            if (!PHONE_PATTERN.test(normalized)) {
                setModalError('Số điện thoại không đúng định dạng Việt Nam.');
                return;
            }
            if (normalized === user.phone) {
                setModalError('Số điện thoại mới phải khác số hiện tại.');
                return;
            }
        }

        setSaving(true);

        try {
            const payload = {
                fullName: editModal === 'fullName' ? normalized : user.fullName,
                phone: editModal === 'phone' ? normalized : user.phone || null,
            };

            const data = await userApi.updateCurrentUser(payload);
            syncProfile(data);
            closeEditModal();
            toast.success(
                editModal === 'fullName'
                    ? 'Đã cập nhật họ và tên.'
                    : 'Đã cập nhật số điện thoại.'
            );
        } catch (err) {
            setModalError(getApiErrorMessage(err, 'Không thể cập nhật thông tin.'));
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarSelect = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Vui lòng chọn file ảnh (JPEG, PNG, WebP...).');
            return;
        }

        if (file.size > MAX_AVATAR_SIZE) {
            toast.error('Ảnh không được vượt quá 10MB.');
            return;
        }

        setAvatarLoading(true);

        try {
            const result = await userApi.uploadAvatar(file);
            const url = result?.url || null;
            syncProfile({ ...user, profilePicture: url });
            toast.success('Đã cập nhật ảnh đại diện.');
        } catch (err) {
            const apiMessage = getApiErrorMessage(err, 'Không thể tải ảnh lên.');
            if (apiMessage.includes('Cloudinary is not configured')) {
                toast.error(
                    'BE chưa cấu hình Cloudinary (CLOUDINARY_*). Hỏi dev BE set env — không cần sửa FE/BE code.'
                );
            } else {
                toast.error(apiMessage);
            }
        } finally {
            setAvatarLoading(false);
        }
    };

    const handleDeleteAvatar = async () => {
        if (!hasProfilePicture(user.profilePicture)) return;

        setAvatarLoading(true);

        try {
            await userApi.deleteAvatar();
            syncProfile({ ...user, profilePicture: null });
            toast.success('Đã xóa ảnh đại diện.');
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Không thể xóa ảnh đại diện.'));
        } finally {
            setAvatarLoading(false);
        }
    };

    const handlePasswordChange = async (event) => {
        event.preventDefault();

        const { currentPassword, newPassword, confirmPassword } = passwordForm;

        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error('Vui lòng điền đầy đủ các trường mật khẩu.');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('Mật khẩu mới phải có ít nhất 6 ký tự.');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp.');
            return;
        }

        setChangingPassword(true);

        try {
            await userApi.changePassword({ currentPassword, newPassword });
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            await logout();
            navigate(ROUTES.LANDING);
        } catch (err) {
            const apiMessage = getApiErrorMessage(err, 'Không thể đổi mật khẩu.');

            if (apiMessage === 'INCORRECT_CURRENT_PASSWORD') {
                toast.error('Mật khẩu hiện tại không đúng.');
            } else if (apiMessage === 'NEW_PASSWORD_SAME_AS_CURRENT') {
                toast.error('Mật khẩu mới phải khác mật khẩu hiện tại.');
            } else {
                toast.error(apiMessage);
            }
        } finally {
            setChangingPassword(false);
        }
    };

    return (
        <div className="account-settings-page">
            {loading ? (
                <div className="account-settings__loading">Đang tải thông tin tài khoản...</div>
            ) : (
                <>
                    <div className="account-settings__card account-settings__personal-card">
                        <h2>Thông tin cá nhân</h2>

                        <div className="account-settings__personal-layout">
                            <div className="account-settings__avatar-column">
                                <div
                                    className={`account-settings__avatar-picker${
                                        hasProfilePicture(user.profilePicture)
                                            ? ' account-settings__avatar-picker--deletable'
                                            : ''
                                    }`}
                                >
                                    <UserAvatar
                                        src={user.profilePicture}
                                        name={user.fullName}
                                        size={120}
                                        className="account-settings__avatar-image"
                                    />
                                    {hasProfilePicture(user.profilePicture) && (
                                        <button
                                            type="button"
                                            className="account-settings__avatar-delete"
                                            aria-label="Xóa ảnh đại diện"
                                            onClick={handleDeleteAvatar}
                                            disabled={avatarLoading}
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>

                                <label
                                    className={`account-settings__avatar-change-link${
                                        avatarLoading ? ' account-settings__avatar-change-link--disabled' : ''
                                    }`}
                                >
                                    {avatarLoading ? 'Đang xử lý...' : 'Thay đổi ảnh đại diện'}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        hidden
                                        disabled={avatarLoading}
                                        onChange={handleAvatarSelect}
                                    />
                                </label>
                            </div>

                            <div className="account-settings__fields-grid">
                                <div className="account-settings__form-field">
                                    <label htmlFor="settings-full-name">Họ và tên</label>
                                    <input
                                        id="settings-full-name"
                                        type="text"
                                        readOnly
                                        value={user.fullName || ''}
                                        placeholder="—"
                                        onClick={() => openEditModal('fullName')}
                                    />
                                </div>

                                <div className="account-settings__form-field">
                                    <label htmlFor="settings-phone">Số điện thoại</label>
                                    <div className="account-settings__input-with-action">
                                        <input
                                            id="settings-phone"
                                            type="tel"
                                            readOnly
                                            value={user.phone || ''}
                                            placeholder="Chưa có số điện thoại"
                                            onClick={() => !user.phone?.trim() && openEditModal('phone')}
                                        />
                                        <button
                                            type="button"
                                            className="account-settings__input-action"
                                            aria-label="Sửa số điện thoại"
                                            onClick={() => openEditModal('phone')}
                                        >
                                            <PencilIcon width={18} height={18} />
                                        </button>
                                    </div>
                                    {!user.phone?.trim() && (
                                        <p className="account-settings__field-hint account-settings__field-hint--warning">
                                            Bạn cần cập nhật số điện thoại.
                                        </p>
                                    )}
                                </div>

                                <div className="account-settings__form-field account-settings__field-full">
                                    <label htmlFor="settings-email">Email</label>
                                    <div className="account-settings__email-row">
                                        <input
                                            id="settings-email"
                                            type="email"
                                            readOnly
                                            value={user.email || ''}
                                            placeholder="—"
                                        />
                                        <span
                                            className={`account-settings__verify-badge${
                                                user.emailVerified
                                                    ? ' account-settings__verify-badge--verified'
                                                    : ' account-settings__verify-badge--pending'
                                            }`}
                                        >
                                            {user.emailVerified && (
                                                <CheckCircleIcon width={16} height={16} />
                                            )}
                                            {user.emailVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                                        </span>
                                        <button
                                            type="button"
                                            className="account-settings__text-link"
                                            disabled
                                            title="Email chỉ xem, không thể thay đổi tại đây"
                                        >
                                            Thay đổi →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                        {!user.googleLinked && (
                            <div className="account-settings__card">
                                <h2>Đổi mật khẩu</h2>
                                <form className="account-settings__password-form" onSubmit={handlePasswordChange}>
                                    <div className="account-settings__field">
                                        <label htmlFor="current-password">Mật khẩu hiện tại</label>
                                        <input
                                            id="current-password"
                                            type="password"
                                            autoComplete="current-password"
                                            value={passwordForm.currentPassword}
                                            onChange={(e) =>
                                                setPasswordForm((prev) => ({
                                                    ...prev,
                                                    currentPassword: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="account-settings__field">
                                        <label htmlFor="new-password">Mật khẩu mới</label>
                                        <input
                                            id="new-password"
                                            type="password"
                                            autoComplete="new-password"
                                            value={passwordForm.newPassword}
                                            onChange={(e) =>
                                                setPasswordForm((prev) => ({
                                                    ...prev,
                                                    newPassword: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="account-settings__field">
                                        <label htmlFor="confirm-password">Xác nhận mật khẩu mới</label>
                                        <input
                                            id="confirm-password"
                                            type="password"
                                            autoComplete="new-password"
                                            value={passwordForm.confirmPassword}
                                            onChange={(e) =>
                                                setPasswordForm((prev) => ({
                                                    ...prev,
                                                    confirmPassword: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="account-settings__btn account-settings__btn--primary"
                                        disabled={changingPassword}
                                    >
                                        {changingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
                                    </button>
                                </form>
                            </div>
                        )}

                        <div className="account-settings__card">
                            <h2>Xác thực email</h2>
                            <p className="account-settings__hint">
                                Gửi email xác thực sẽ kết nối API sau khi BE hoàn thiện luồng verify.
                            </p>
                            <button
                                type="button"
                                className="account-settings__btn account-settings__btn--ghost"
                                disabled
                            >
                                Gửi email xác thực
                            </button>
                        </div>
                    </>
            )}

            <EditFieldModal
                open={editModal === 'fullName'}
                title="Thay đổi họ và tên"
                currentLabel="Họ và tên hiện tại"
                currentValue={user.fullName}
                newLabel="Họ và tên mới"
                newValue={editValue}
                onNewValueChange={handleEditValueChange}
                placeholder="Nhập họ và tên mới"
                saving={saving}
                error={modalError}
                onClose={closeEditModal}
                onSave={handleModalSave}
            />

            <EditFieldModal
                open={editModal === 'phone'}
                title="Thay đổi số điện thoại"
                currentLabel="Số điện thoại hiện tại"
                currentValue={user.phone}
                newLabel="Số điện thoại mới"
                newValue={editValue}
                onNewValueChange={handleEditValueChange}
                placeholder="Nhập số điện thoại mới"
                inputType="tel"
                saving={saving}
                error={modalError}
                onClose={closeEditModal}
                onSave={handleModalSave}
            />
        </div>
    );
};

export default CandidateSettingsPage;
