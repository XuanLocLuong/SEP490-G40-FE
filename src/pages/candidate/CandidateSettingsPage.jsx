import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserAvatar from '../../components/common/UserAvatar.jsx';
import EditFieldModal from '../../components/common/EditFieldModal.jsx';
import { PencilIcon } from '../../components/common/icons.jsx';
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
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
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
            setError('');

            try {
                const data = await userApi.getCurrentUser();
                if (!cancelled) {
                    syncProfile(data);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(getApiErrorMessage(err, 'Không thể tải thông tin tài khoản.'));
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
        setMessage('');
        setError('');
        setEditModal(field);
        setEditValue('');
    };

    const closeEditModal = () => {
        setEditModal(null);
        setEditValue('');
    };

    const handleModalSave = async () => {
        setMessage('');
        setError('');

        const normalized = editValue.trim();

        if (editModal === 'fullName') {
            if (!normalized) {
                setError('Họ và tên không được để trống.');
                return;
            }
            if (normalized === user.fullName) {
                setError('Họ và tên mới phải khác giá trị hiện tại.');
                return;
            }
        }

        if (editModal === 'phone') {
            if (!normalized) {
                setError('Vui lòng nhập số điện thoại mới.');
                return;
            }
            if (!PHONE_PATTERN.test(normalized)) {
                setError('Số điện thoại không đúng định dạng Việt Nam.');
                return;
            }
            if (normalized === user.phone) {
                setError('Số điện thoại mới phải khác số hiện tại.');
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
            setMessage(
                editModal === 'fullName'
                    ? 'Đã cập nhật họ và tên.'
                    : 'Đã cập nhật số điện thoại.'
            );
        } catch (err) {
            setError(getApiErrorMessage(err, 'Không thể cập nhật thông tin.'));
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarSelect = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Vui lòng chọn file ảnh (JPEG, PNG, WebP...).');
            return;
        }

        if (file.size > MAX_AVATAR_SIZE) {
            setError('Ảnh không được vượt quá 10MB.');
            return;
        }

        setMessage('');
        setError('');
        setAvatarLoading(true);

        try {
            const result = await userApi.uploadAvatar(file);
            const url = result?.url || null;
            syncProfile({ ...user, profilePicture: url });
            setMessage('Đã cập nhật ảnh đại diện.');
        } catch (err) {
            const apiMessage = getApiErrorMessage(err, 'Không thể tải ảnh lên.');
            if (apiMessage.includes('Cloudinary is not configured')) {
                setError(
                    'BE chưa cấu hình Cloudinary (CLOUDINARY_*). Hỏi dev BE set env — không cần sửa FE/BE code.'
                );
            } else {
                setError(apiMessage);
            }
        } finally {
            setAvatarLoading(false);
        }
    };

    const handleDeleteAvatar = async () => {
        if (!hasProfilePicture(user.profilePicture)) return;

        setMessage('');
        setError('');
        setAvatarLoading(true);

        try {
            await userApi.deleteAvatar();
            syncProfile({ ...user, profilePicture: null });
            setMessage('Đã xóa ảnh đại diện.');
        } catch (err) {
            setError(getApiErrorMessage(err, 'Không thể xóa ảnh đại diện.'));
        } finally {
            setAvatarLoading(false);
        }
    };

    const handlePasswordChange = async (event) => {
        event.preventDefault();
        setMessage('');
        setError('');

        const { currentPassword, newPassword, confirmPassword } = passwordForm;

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError('Vui lòng điền đầy đủ các trường mật khẩu.');
            return;
        }

        if (newPassword.length < 6) {
            setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }

        setChangingPassword(true);

        try {
            await userApi.changePassword({ currentPassword, newPassword });
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            await logout();
            navigate(ROUTES.LOGIN);
        } catch (err) {
            const apiMessage = getApiErrorMessage(err, 'Không thể đổi mật khẩu.');

            if (apiMessage === 'INCORRECT_CURRENT_PASSWORD') {
                setError('Mật khẩu hiện tại không đúng.');
            } else if (apiMessage === 'NEW_PASSWORD_SAME_AS_CURRENT') {
                setError('Mật khẩu mới phải khác mật khẩu hiện tại.');
            } else {
                setError(apiMessage);
            }
        } finally {
            setChangingPassword(false);
        }
    };

    return (
        <div className="account-settings-page">
            <header className="account-settings__header">
                <h1>Quản lý tài khoản</h1>
                <p>Cập nhật thông tin cá nhân của bạn.</p>
            </header>

            {message && <div className="account-settings__message">{message}</div>}
            {error && <div className="account-settings__error">{error}</div>}

            {loading ? (
                <div className="account-settings__loading">Đang tải thông tin tài khoản...</div>
            ) : (
                <>
                    <div className="account-settings__card">
                            <div className="account-settings__avatar-block">
                                <UserAvatar src={user.profilePicture} name={user.fullName} size={80} />
                                <div>
                                    <div className="account-settings__avatar-actions">
                                        <label className="account-settings__file-btn">
                                            {avatarLoading ? 'Đang xử lý...' : 'Chọn ảnh'}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                hidden
                                                disabled={avatarLoading}
                                                onChange={handleAvatarSelect}
                                            />
                                        </label>
                                        {hasProfilePicture(user.profilePicture) && (
                                            <button
                                                type="button"
                                                className="account-settings__btn account-settings__btn--ghost"
                                                disabled={avatarLoading}
                                                onClick={handleDeleteAvatar}
                                            >
                                                Xóa ảnh
                                            </button>
                                        )}
                                    </div>
                                    <p className="account-settings__hint account-settings__avatar-hint">
                                        Tối đa 10MB.
                                    </p>
                                </div>
                            </div>

                            <div className="account-settings__info-row">
                                <div>
                                    <p className="account-settings__info-label">Họ và tên</p>
                                    <p className="account-settings__info-value">
                                        {user.fullName || '—'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="account-settings__edit-btn"
                                    onClick={() => openEditModal('fullName')}
                                >
                                    <PencilIcon width={16} height={16} />
                                    Sửa
                                </button>
                            </div>

                            <div className="account-settings__info-row">
                                <div>
                                    <p className="account-settings__info-label">Số điện thoại</p>
                                    <p className="account-settings__info-value">
                                        {user.phone || '—'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="account-settings__edit-btn"
                                    onClick={() => openEditModal('phone')}
                                >
                                    <PencilIcon width={16} height={16} />
                                    Sửa
                                </button>
                            </div>

                            <div className="account-settings__info-row">
                                <div>
                                    <p className="account-settings__info-label">Email</p>
                                    <p className="account-settings__info-value">{user.email || '—'}</p>
                                    <p className="account-settings__hint">
                                        Email chỉ xem, không thể thay đổi tại đây.
                                    </p>
                                </div>
                                <span
                                    className={`account-settings__badge${
                                        user.emailVerified
                                            ? ' account-settings__badge--verified'
                                            : ' account-settings__badge--pending'
                                    }`}
                                >
                                    {user.emailVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                                </span>
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
                onNewValueChange={setEditValue}
                placeholder="Nhập họ và tên mới"
                saving={saving}
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
                onNewValueChange={setEditValue}
                placeholder="Nhập số điện thoại mới"
                inputType="tel"
                saving={saving}
                onClose={closeEditModal}
                onSave={handleModalSave}
            />
        </div>
    );
};

export default CandidateSettingsPage;
