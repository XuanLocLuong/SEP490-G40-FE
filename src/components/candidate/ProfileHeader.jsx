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
const ProfileHeader = ({ profile, onUploadAvatar, onToggleOpenToWork, saving }) => {
    const percent = clampPercent(profile.completionPercent);
    const isOpenToWork = profile.openToWork ?? (profile.status !== 'NOT_SEEKING');

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
                    <h1 className="cp-header__name">
                        {profile.fullName || 'Chưa cập nhật tên'}
                        {!profile.fullName?.trim() ? (
                            <span className="cp-required" title="Bắt buộc để ứng tuyển">
                                *
                            </span>
                        ) : null}
                    </h1>
                    {profile.trustScore != null && (
                        <span className="cp-trust-badge">
                            <StarIcon width={14} height={14} />
                            {profile.trustScore} Trust Score
                        </span>
                    )}
                </div>

                {profile.bio && <p className="cp-header__bio">{profile.bio}</p>}

                <div className="cp-header__meta">
                    <div className="cp-header__status-wrapper">
                        <span className="cp-header__status-label">Trạng thái:</span>
                        <button
                            type="button"
                            className={`cp-status-toggle ${isOpenToWork ? 'cp-status-toggle--active' : 'cp-status-toggle--inactive'}`}
                            onClick={() => onToggleOpenToWork?.(!isOpenToWork)}
                            disabled={saving}
                            title={isOpenToWork ? 'Bấm để tạm tắt trạng thái tìm việc' : 'Bấm để bật trạng thái tìm việc'}
                            aria-label={`Trạng thái: ${isOpenToWork ? 'Đang tìm việc' : 'Tạm tắt tìm việc'}. Bấm để thay đổi.`}
                        >
                            <span className="cp-status-dot" />
                            <span className="cp-status-text">
                                {isOpenToWork ? 'Đang tìm việc' : 'Tạm tắt tìm việc'}
                            </span>
                            <span className="cp-status-switch" aria-hidden="true">
                                <span className="cp-status-switch-knob" />
                            </span>
                        </button>
                    </div>

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
