import JobSearchForm from '../common/JobSearchForm.jsx';

const DEFAULT_TITLE = 'Tìm việc part-time dễ dàng cho ứng viên';
const DEFAULT_SUBTITLE = 'Nền tảng kết nối sinh viên với cơ hội việc làm linh hoạt, uy tín và phù hợp với lịch học của bạn.';

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
}) => (
    <section className="landing-hero">
        <div className="landing-hero__inner">
            <div className="landing-hero__content">
                <h1 className="landing-hero__title">{title}</h1>
                {subtitle ? <p className="landing-hero__subtitle">{subtitle}</p> : null}

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

            <div className="landing-hero__visual" aria-hidden="true">
                <div className="landing-hero__illustration">
                    <div className="landing-hero__figure">
                        <span className="landing-hero__figure-head" />
                        <span className="landing-hero__figure-body" />
                        <span className="landing-hero__figure-book" />
                    </div>
                </div>
            </div>
        </div>
    </section>
);

export default HeroSection;
