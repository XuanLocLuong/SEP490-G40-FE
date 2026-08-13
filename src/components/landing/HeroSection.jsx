import { useMemo } from 'react';
import JobSearchForm from '../common/JobSearchForm.jsx';
import bannerImg from '../../assets/images/banner.png';

const DEFAULT_TITLE = 'Tìm việc part-time dễ dàng cho ứng viên';
const DEFAULT_SUBTITLE =
    'Nền tảng kết nối sinh viên với cơ hội việc làm linh hoạt, uy tín và phù hợp với lịch học của bạn.';

const SPARKLE_COLORS = ['#ffffff', '#146cf6', '#ffc107', '#8ec5ff'];
const SPARKLE_COUNT = 34;

const createSparkle = (id, { leftMin, leftSpan, topMin, topSpan }) => ({
    id,
    left: `${leftMin + Math.random() * leftSpan}%`,
    top: `${topMin + Math.random() * topSpan}%`,
    size: `${4.5 + Math.random() * 5.5}px`,
    color: SPARKLE_COLORS[id % SPARKLE_COLORS.length],
    duration: `${3.6 + Math.random() * 3.4}s`,
    delay: `${Math.random() * 4.2}s`,
    dx: `${(Math.random() - 0.5) * 48}px`,
    dy: `${56 + Math.random() * 90}px`,
    kind: id % 5 === 0 ? 'star' : 'dot',
});

const createSparkles = () => {
    const list = [];
    let id = 0;

    // Trải rộng trên banner
    for (; id < 18; id += 1) {
        list.push(
            createSparkle(id, {
                leftMin: 4,
                leftSpan: 92,
                topMin: 3,
                topSpan: 62,
            })
        );
    }

    // Thêm cụm đậm hơn ở giữa màn hình / giữa banner
    for (; id < SPARKLE_COUNT; id += 1) {
        list.push(
            createSparkle(id, {
                leftMin: 32,
                leftSpan: 36,
                topMin: 22,
                topSpan: 36,
            })
        );
    }

    return list;
};

const HeroSection = ({
    onSearch,
    loading,
    formResetKey = 0,
    title = DEFAULT_TITLE,
    subtitle = DEFAULT_SUBTITLE,
    initialKeyword = '',
    initialCity = '',
    initialWard = '',
    initialJobType = '',
    initialSalaryMin = null,
    initialSalaryMax = null,
    initialSkillIds = [],
    initialSchedules = [],
    initialNearMe = false,
    initialLatitude = null,
    initialLongitude = null,
}) => {
    const sparkles = useMemo(() => createSparkles(), []);

    return (
        <section className="landing-hero">
            <div className="landing-hero__visual">
                <img
                    src={bannerImg}
                    alt={DEFAULT_TITLE}
                    className="landing-hero__banner"
                    width={1983}
                    height={793}
                    decoding="async"
                />

                <div className="landing-hero__sparkles" aria-hidden="true">
                    {sparkles.map((s) => (
                        <span
                            key={s.id}
                            className={`landing-hero__sparkle${
                                s.kind === 'star' ? ' landing-hero__sparkle--star' : ''
                            }`}
                            style={{
                                left: s.left,
                                top: s.top,
                                width: s.size,
                                height: s.size,
                                backgroundColor: s.color,
                                color: s.color,
                                '--sparkle-dur': s.duration,
                                '--sparkle-delay': s.delay,
                                '--sparkle-dx': s.dx,
                                '--sparkle-dy': s.dy,
                            }}
                        />
                    ))}
                </div>

                {/* relative + margin âm: đè chân ảnh; mở “Thêm bộ lọc” xổ xuống dưới */}
                <div className="landing-hero__dock">
                    <h1 className="visually-hidden">{title || DEFAULT_TITLE}</h1>
                    {subtitle && subtitle !== DEFAULT_SUBTITLE ? (
                        <p className="landing-hero__greeting-sub">{subtitle}</p>
                    ) : null}

                    <JobSearchForm
                        onSearch={onSearch}
                        loading={loading}
                        nearMeLabel="Tìm việc gần tôi"
                        className="landing-hero__search"
                        resetKey={formResetKey}
                        initialKeyword={initialKeyword}
                        initialCity={initialCity}
                        initialWard={initialWard}
                        initialJobType={initialJobType}
                        initialSalaryMin={initialSalaryMin}
                        initialSalaryMax={initialSalaryMax}
                        initialSkillIds={initialSkillIds}
                        initialSchedules={initialSchedules}
                        initialNearMe={initialNearMe}
                        initialLatitude={initialLatitude}
                        initialLongitude={initialLongitude}
                    />
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
