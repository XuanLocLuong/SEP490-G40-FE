import JobSearchForm from '../common/JobSearchForm.jsx';

const HeroSection = ({ onSearch, loading, formResetKey = 0 }) => (
    <section className="landing-hero">
        <div className="landing-hero__inner">
            <div className="landing-hero__content">
                <h1 className="landing-hero__title">
                    Tìm việc part-time dễ dàng cho ứng viên
                </h1>
                <p className="landing-hero__subtitle">
                    Nền tảng kết nối sinh viên với cơ hội việc làm linh hoạt, uy tín
                    và phù hợp với lịch học của bạn.
                </p>

                <JobSearchForm
                    onSearch={onSearch}
                    loading={loading}
                    nearMeLabel="Tìm việc gần tôi"
                    className="landing-hero__search"
                    resetKey={formResetKey}
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
