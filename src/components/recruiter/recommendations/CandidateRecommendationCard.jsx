import { Link } from 'react-router-dom';
import {
    CheckCircleIcon,
    MapPinIcon,
    StarIcon,
    UserCircleIcon,
} from '../../common/icons.jsx';
import { getCandidatePublicProfilePath } from '../../../routes/path.js';
import { formatSalary } from '../../../utils/formatters.js';

const CONTENT_SCORE_HINT =
    'Dựa trên job ứng viên đã lưu, ứng tuyển hoặc được mời';

const toScore = (value) => {
    const score = Number(value);
    if (!Number.isFinite(score)) return 0;
    return Math.max(0, Math.min(100, Math.round(score)));
};

const formatDistance = (value) => {
    const distance = Number(value);
    if (!Number.isFinite(distance)) return 'Chưa xác định khoảng cách';
    return `Cách nơi làm việc ${distance.toFixed(distance < 10 ? 1 : 0)} km`;
};

const CandidateAvatar = ({ candidate }) => {
    if (candidate.profilePicture) {
        return (
            <img
                className="candidate-recommendation-card__avatar"
                src={candidate.profilePicture}
                alt=""
            />
        );
    }

    return (
        <span
            className="candidate-recommendation-card__avatar candidate-recommendation-card__avatar--placeholder"
            aria-hidden="true"
        >
            <UserCircleIcon width={34} height={34} />
        </span>
    );
};

const ScoreRow = ({ label, value, hint }) => {
    const score = toScore(value);
    return (
        <div className="candidate-recommendation-card__score-row">
            <span
                className="candidate-recommendation-card__score-label"
                title={hint || undefined}
            >
                {label}
            </span>
            <div
                className="candidate-recommendation-card__score-track"
                role="progressbar"
                aria-label={`${label} ${score}%`}
                aria-valuenow={score}
                aria-valuemin={0}
                aria-valuemax={100}
            >
                <span style={{ width: `${score}%` }} />
            </div>
            <strong>{score}%</strong>
        </div>
    );
};

const CandidateRecommendationCard = ({
    candidate,
    selected = false,
    onToggleSelect,
    sending = false,
    sent = false,
    profileBackTo,
    onInvite,
    onChat,
}) => {
    const matchScore = toScore(candidate.matchScore);
    const salary = formatSalary(candidate.expectedSalaryMin, candidate.expectedSalaryMax);
    const skills = Array.isArray(candidate.skills) ? candidate.skills.slice(0, 6) : [];
    const rating = Number(candidate.rating);
    const trustScore = Number(candidate.trustScore);
    const showRating = Number.isFinite(rating) && rating > 0;
    const canSelect = typeof onToggleSelect === 'function' && !sent;

    return (
        <article
            className={`candidate-recommendation-card${
                selected ? ' candidate-recommendation-card--selected' : ''
            }`}
        >
            {canSelect ? (
                <label className="candidate-recommendation-card__check">
                    <input
                        type="checkbox"
                        checked={selected}
                        disabled={sending}
                        onChange={() => onToggleSelect(candidate.candidateId)}
                        aria-label={`Chọn ${candidate.fullName || 'ứng viên'}`}
                    />
                </label>
            ) : null}
            <header className="candidate-recommendation-card__header">
                <CandidateAvatar candidate={candidate} />
                <div className="candidate-recommendation-card__identity">
                    <h2>{candidate.fullName || 'Ứng viên JobLink'}</h2>
                    <div className="candidate-recommendation-card__meta">
                        {showRating ? (
                            <span>
                                <StarIcon width={15} height={15} />
                                {rating.toFixed(1)}
                            </span>
                        ) : null}
                        {Number.isFinite(trustScore) ? (
                            <span>Điểm uy tín {Math.round(trustScore)}</span>
                        ) : null}
                    </div>
                    <p>
                        <MapPinIcon width={15} height={15} />
                        {formatDistance(candidate.distanceKm)}
                    </p>
                </div>
                <span className="candidate-recommendation-card__match">
                    <strong>{matchScore}%</strong>
                    <small>phù hợp</small>
                </span>
            </header>

            <section className="candidate-recommendation-card__section">
                <h3>Vì sao phù hợp</h3>
                <ScoreRow label="Lịch làm" value={candidate.scheduleScore} />
                <ScoreRow label="Khoảng cách" value={candidate.distanceScore} />
                <ScoreRow label="Kỹ năng" value={candidate.skillScore} />
                <ScoreRow
                    label="Lịch sử quan tâm"
                    value={candidate.contentScore}
                    hint={CONTENT_SCORE_HINT}
                />
                <ScoreRow label="Khớp lương" value={candidate.salaryScore} />
            </section>

            <section className="candidate-recommendation-card__section">
                <h3>Kỹ năng</h3>
                <div className="candidate-recommendation-card__chips">
                    {skills.length > 0 ? (
                        skills.map((skill) => (
                            <span key={skill.id ?? skill.name}>{skill.name}</span>
                        ))
                    ) : (
                        <span className="candidate-recommendation-card__empty-text">
                            Chưa cập nhật kỹ năng
                        </span>
                    )}
                </div>
            </section>

            <div className="candidate-recommendation-card__salary">
                <span>Lương mong muốn</span>
                <strong>{salary || 'Trao đổi'}</strong>
            </div>

            <footer className="candidate-recommendation-card__actions">
                <Link
                    to={getCandidatePublicProfilePath(candidate.candidateId)}
                    state={{
                        ...(profileBackTo ? { backTo: profileBackTo } : {}),
                        candidateUserId: candidate.userId ?? null,
                    }}
                    className="candidate-recommendation-card__profile-btn"
                >
                    Xem hồ sơ
                </Link>
                {typeof onChat === 'function' ? (
                    <button
                        type="button"
                        className="candidate-recommendation-card__profile-btn"
                        disabled={!candidate.userId}
                        title={
                            candidate.userId
                                ? 'Nhắn tin'
                                : 'Thiếu userId để mở chat'
                        }
                        onClick={() => onChat(candidate)}
                    >
                        Chat
                    </button>
                ) : null}
                <button
                    type="button"
                    className={`candidate-recommendation-card__invite-btn${
                        sent ? ' candidate-recommendation-card__invite-btn--sent' : ''
                    }`}
                    disabled={sending || sent}
                    onClick={() => onInvite(candidate)}
                >
                    {sent ? (
                        <>
                            <CheckCircleIcon width={17} height={17} />
                            Đã gửi lời mời
                        </>
                    ) : sending ? (
                        'Đang gửi...'
                    ) : (
                        'Gửi lời mời'
                    )}
                </button>
            </footer>
        </article>
    );
};

export default CandidateRecommendationCard;
