import BusinessProfileLink from '../common/BusinessProfileLink.jsx';
import { CheckCircleIcon } from '../common/icons.jsx';
import { getBusinessInitial } from '../../utils/formatters.js';
import {
    buildEmployerMetaLines,
    formatEmployerTrustScore,
    getEmployerTrustPercent,
} from '../../utils/employerDisplay.js';

const EmployerListRow = ({ employer }) => {
    if (!employer?.businessId) return null;

    const trustScore = formatEmployerTrustScore(employer.trustScore);
    const trustPercent = getEmployerTrustPercent(employer.trustScore);
    const metaLines = buildEmployerMetaLines(employer);
    const rankLabel =
        employer.rankingPosition != null ? `#${employer.rankingPosition}` : '—';

    return (
        <article className="employer-list-row">
            <span className="employer-list-row__rank" aria-label={`Hạng ${rankLabel}`}>
                {rankLabel}
            </span>

            <div className="employer-list-row__body">
                {employer.logoUrl ? (
                    <img
                        src={employer.logoUrl}
                        alt=""
                        className="employer-list-row__logo employer-list-row__logo--image"
                    />
                ) : (
                    <span className="employer-list-row__logo">
                        {getBusinessInitial(employer.businessName)}
                    </span>
                )}

                <div className="employer-list-row__info">
                    <div className="employer-list-row__title-row">
                        <h2 className="employer-list-row__name">
                            {employer.businessName || 'Doanh nghiệp'}
                        </h2>
                        {employer.verified ? (
                            <span className="employer-list-row__verified-tag">
                                <CheckCircleIcon
                                    width={14}
                                    height={14}
                                    className="employer-list-row__verified"
                                    aria-hidden="true"
                                />
                                Đã xác minh
                            </span>
                        ) : null}
                    </div>
                    <ul className="employer-list-row__meta-list">
                        {metaLines.map((line, index) => (
                            <li
                                key={index}
                                className={`employer-list-row__meta-line${
                                    line.placeholder ? ' employer-list-row__meta-line--placeholder' : ''
                                }`}
                            >
                                {line.text}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="employer-list-row__aside">
                    <div className="employer-list-row__score">
                        <div className="employer-list-row__score-header">
                            <span>Trust Score</span>
                            <strong>{trustScore}/100</strong>
                        </div>
                        <div className="employer-list-row__score-bar">
                            <span style={{ width: `${trustPercent}%` }} />
                        </div>
                    </div>
                    <BusinessProfileLink
                        businessId={employer.businessId}
                        className="btn btn--ghost employer-list-row__cta"
                        label="Top nhà tuyển dụng"
                    >
                        Xem trang công ty
                    </BusinessProfileLink>
                </div>
            </div>
        </article>
    );
};

export default EmployerListRow;
