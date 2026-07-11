import { ShieldIcon, ClockIcon, LayersIcon } from '../common/icons.jsx';

const FEATURES = [
    {
        id: 'trust',
        title: 'An toàn & uy tín',
        description:
            'Trust Score và xác minh giúp bạn chọn nhà tuyển dụng đáng tin cậy, tránh rủi ro khi ứng tuyển.',
        icon: ShieldIcon,
        tone: 'blue',
    },
    {
        id: 'flexible',
        title: 'Linh hoạt thời gian',
        description:
            'Tìm việc part-time, ca sáng/chiều/tối phù hợp lịch học — ứng tuyển nhanh, làm việc gần nhà.',
        icon: ClockIcon,
        tone: 'orange',
    },
    {
        id: 'diverse',
        title: 'Đa dạng ngành nghề',
        description:
            'Từ F&B, bán lẻ đến gia sư, marketing — nhiều lựa chọn cho sinh viên muốn trải nghiệm thực tế.',
        icon: LayersIcon,
        tone: 'purple',
    },
];

const WhyJobLinkSection = () => {
    return (
        <section className="landing-section landing-why">
            <div className="landing-why__intro">
                <h2 className="landing-section__title">Tại sao sinh viên chọn JobLink?</h2>
                <p className="landing-section__desc landing-why__desc">
                    Nền tảng được thiết kế riêng cho sinh viên — tìm việc nhanh, minh bạch và an toàn.
                </p>
            </div>

            <div className="landing-why__grid">
                {FEATURES.map(({ id, title, description, icon: Icon, tone }) => (
                    <article key={id} className={`why-card why-card--${tone}`}>
                        <span className={`why-card__icon why-card__icon--${tone}`}>
                            <Icon width={24} height={24} />
                        </span>
                        <h3 className="why-card__title">{title}</h3>
                        <p className="why-card__text">{description}</p>
                    </article>
                ))}
            </div>
        </section>
    );
};

export default WhyJobLinkSection;
