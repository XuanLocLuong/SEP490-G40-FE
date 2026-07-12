import AvatarUploader from './AvatarUploader.jsx';
import { StarIcon } from './profileIcons.jsx';
import { clampPercent } from '../../utils/profileFormat.js';

const STATUS_LABELS = {
    SEEKING: 'Đang tìm việc',
    OPEN: 'Đang tìm việc',
    ACTIVE: 'Đang tìm việc',
    NOT_SEEKING: 'Chưa tìm việc',
    HIRED: 'Đã có việc',
};

const getStatusLabel = (status) => {
    if (!status) return '';
    return STATUS_LABELS[status] || status;
};

// SECTION 1 — Header Card: avatar, tên, trust score, bio, status, completion %.
const ProfileHeader = ({ profile, onUploadAvatar, saving }) => {
    const percent = clampPercent(profile.completionPercent);
    const statusLabel = getStatusLabel(profile.status);

    return (
        <section className="cp-card cp-header">
            <AvatarUploader
                name={profile.fullName}
                avatarUrl={profile.avatarUrl}
                onUpload={onUploadAvatar}
                disabled={saving}
            />

            <div className="cp-header__main">
                <div className="cp-header__top">
                    <h1 className="cp-header__name">{profile.fullName || 'Chưa cập nhật tên'}</h1>
                    {profile.trustScore != null && (
                        <span className="cp-trust-badge">
                            <StarIcon width={14} height={14} />
                            {profile.trustScore} Trust Score
                        </span>
                    )}
                </div>

                {profile.bio && <p className="cp-header__bio">{profile.bio}</p>}

                <div className="cp-header__meta">
                    {statusLabel && (
                        <span className="cp-header__status">
                            Trạng thái:
                            <span className="cp-status-pill">
                                <span className="cp-status-dot" />
                                {statusLabel}
                            </span>
                        </span>
                    )}

                    <div className="cp-completion">
                        <span className="cp-completion__label">{percent}% Hoàn thiện hồ sơ</span>
                        <div className="cp-completion__bar">
                            <div className="cp-completion__fill" style={{ width: `${percent}%` }} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ProfileHeader;
