import { CheckCircleIcon } from '../common/icons.jsx';

// TODO: wire API when backend ready
const MOCK_EMPLOYERS = [
    {
        id: 1,
        name: 'Highlands Coffee',
        industry: 'F&B',
        trustScore: 98,
        initial: 'H',
    },
    {
        id: 2,
        name: 'Circle K Vietnam',
        industry: 'Bán lẻ',
        trustScore: 95,
        initial: 'C',
    },
    {
        id: 3,
        name: 'FPT Software',
        industry: 'Công nghệ',
        trustScore: 92,
        initial: 'F',
    },
    {
        id: 4,
        name: 'The Coffee House',
        industry: 'F&B',
        trustScore: 90,
        initial: 'T',
    },
    {
        id: 5,
        name: 'Phở Hà Thành',
        industry: 'F&B',
        trustScore: 88,
        initial: 'P',
    },
    {
        id: 6,
        name: 'Bún chả Hà Nội',
        industry: 'F&B',
        trustScore: 86,
        initial: 'B',
    },
];

const PREVIEW_SIZE = 3;
const COMPACT_PREVIEW_SIZE = 4;

const TopEmployersSection = ({ compact = false }) => {
    const previewSize = compact ? COMPACT_PREVIEW_SIZE : PREVIEW_SIZE;
    const employers = MOCK_EMPLOYERS.slice(0, previewSize);
    const gridClass = [
        'landing-employers__grid',
        compact ? 'landing-employers__grid--compact' : '',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <section className="landing-section landing-employers">
            <div className="landing-section__header">
                <div>
                    <h2 className="landing-section__title">Top 10 Nhà Tuyển Dụng Uy Tín</h2>
                    <p className="landing-section__desc">
                        Đánh giá dựa trên Trust Score — chỉ số uy tín từ phản hồi ứng viên và lịch sử tuyển dụng.
                    </p>
                </div>
                <span className="landing-section__link landing-section__link--muted">
                    Xem tất cả →
                </span>
            </div>

            <div className={gridClass}>
                {employers.map((employer) => (
                    <article
                        key={employer.id}
                        className={`employer-card${compact ? ' employer-card--compact' : ''}`}
                    >
                        <div className="employer-card__top">
                            <span className="employer-card__logo">{employer.initial}</span>
                            <div>
                                <h3 className="employer-card__name">
                                    {employer.name}
                                    <CheckCircleIcon
                                        width={16}
                                        height={16}
                                        className="employer-card__verified"
                                    />
                                </h3>
                                <span className="employer-card__industry">{employer.industry}</span>
                            </div>
                        </div>

                        <div className="employer-card__score">
                            <div className="employer-card__score-header">
                                <span>Trust Score</span>
                                <strong>{employer.trustScore}/100</strong>
                            </div>
                            <div className="employer-card__score-bar">
                                <span style={{ width: `${employer.trustScore}%` }} />
                            </div>
                        </div>

                        <button type="button" className="btn btn--ghost employer-card__cta" disabled>
                            Xem trang công ty
                        </button>
                    </article>
                ))}
            </div>
        </section>
    );
};

export default TopEmployersSection;
