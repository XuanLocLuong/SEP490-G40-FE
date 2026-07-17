import UserAvatar from '../../common/UserAvatar.jsx';
import { CheckCircleIcon } from '../../common/icons.jsx';
import { getJobTypeLabel } from '../../../utils/profileFormat.js';

const CandidateProfileHeader = ({ profile }) => {
    const trustValue = profile.trustScore != null ? Math.round(profile.trustScore) : '—';
    const jobTypeLabel = getJobTypeLabel(profile.preferredJobType) || '—';

    return (
        <section className="cpp-hero">
            <div className="cpp-hero__identity">
                <UserAvatar
                    src={profile.avatarUrl}
                    name={profile.fullName}
                    size={88}
                    className="cpp-hero__avatar"
                />
                <div className="cpp-hero__info">
                    <h1 className="cpp-hero__name">{profile.fullName}</h1>
                    <div className="cpp-hero__badges">
                        <span className="cpp-badge cpp-badge--role">Ứng viên</span>
                        {profile.verified && (
                            <span className="cpp-badge cpp-badge--verified">
                                <CheckCircleIcon width={14} height={14} />
                                Đã xác minh
                            </span>
                        )}
                        {profile.openToWork && (
                            <span className="cpp-badge cpp-badge--open">Đang tìm việc</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="cpp-hero__trust">
                <p className="cpp-hero__trust-value">{trustValue}</p>
                <p className="cpp-hero__trust-label">Điểm uy tín</p>
                <p className="cpp-hero__trust-sub">
                    {profile.openToWork
                        ? 'Ứng viên đang sẵn sàng nhận việc'
                        : 'Ứng viên hiện không tìm việc'}
                </p>
            </div>

            <div className="cpp-hero__metrics">
                <div className="cpp-hero__metric">
                    <strong>{profile.skills.length}</strong>
                    <span>Kỹ năng</span>
                </div>
                <div className="cpp-hero__metric">
                    <strong>{profile.experiences.length}</strong>
                    <span>Kinh nghiệm</span>
                </div>
                <div className="cpp-hero__metric cpp-hero__metric--accent">
                    <strong>{jobTypeLabel}</strong>
                    <span>Loại việc</span>
                </div>
            </div>
        </section>
    );
};

export default CandidateProfileHeader;
