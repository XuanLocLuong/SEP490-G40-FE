import BusinessProfileLink from '../common/BusinessProfileLink.jsx';
import { CheckCircleIcon } from '../common/icons.jsx';
import { getBusinessInitial } from '../../utils/formatters.js';
import {
    buildEmployerMetaLines,
    formatEmployerTrustScore,
    getEmployerTrustPercent,
} from '../../utils/employerDisplay.js';

const EmployerCard = ({
    employer,
    compact = false,
    showRank = false,
    homeSectionId,
}) => {
    if (!employer?.businessId) return null;

    const trustScore = formatEmployerTrustScore(employer.trustScore);
    const trustPercent = getEmployerTrustPercent(employer.trustScore);
    const metaLines = buildEmployerMetaLines(employer);
    const cardClass = [
        'employer-card',
        compact ? 'employer-card--compact' : '',
    ]
        .filter(Boolean)
        .join(' ');
    const headerClass = [
        'employer-card__header',
        showRank ? 'employer-card__header--ranked' : '',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <article className={cardClass}>
            {showRank && employer.rankingPosition != null ? (
                <span className="employer-card__rank">#{employer.rankingPosition}</span>
            ) : null}

            <div className={headerClass}>
                <div className="employer-card__brand">
                    {employer.logoUrl ? (
                        <img
                            src={employer.logoUrl}
                            alt=""
                            className="employer-card__logo employer-card__logo--image"
                        />
                    ) : (
                        <span className="employer-card__logo">
                            {getBusinessInitial(employer.businessName)}
                        </span>
                    )}
                    <h3 className="employer-card__name">
                        {employer.businessName || 'Doanh nghiệp'}
                    </h3>
                    <span
                        className="employer-card__verified-slot"
                        aria-hidden={!employer.verified}
                    >
                        {employer.verified ? (
                            <CheckCircleIcon
                                width={16}
                                height={16}
                                className="employer-card__verified"
                                aria-label="Đã xác minh"
                            />
                        ) : null}
                    </span>
                </div>
                <ul className="employer-card__meta-list">
                    {metaLines.map((line, index) => (
                        <li
                            key={index}
                            className={`employer-card__meta-line${
                                line.placeholder ? ' employer-card__meta-line--placeholder' : ''
                            }`}
                        >
                            {line.text}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="employer-card__score">
                <div className="employer-card__score-header">
                    <span>Trust Score</span>
                    <strong>{trustScore}/100</strong>
                </div>
                <div className="employer-card__score-bar">
                    <span style={{ width: `${trustPercent}%` }} />
                </div>
            </div>

            <BusinessProfileLink
                businessId={employer.businessId}
                className="btn btn--ghost employer-card__cta"
                label="Trang chủ"
                homeSectionId={homeSectionId}
            >
                Xem trang công ty
            </BusinessProfileLink>
        </article>
    );
};

export default EmployerCard;
