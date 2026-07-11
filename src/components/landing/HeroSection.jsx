import { useState } from 'react';
import { SearchIcon, MapPinIcon } from '../common/icons.jsx';

const CITIES = [
    { value: '', label: 'Tất cả địa điểm' },
    { value: 'TP.HCM', label: 'TP. HCM' },
    { value: 'Hà Nội', label: 'Hà Nội' },
];

const HeroSection = ({ onSearch, loading }) => {
    const [keyword, setKeyword] = useState('');
    const [city, setCity] = useState('');
    const [nearMe, setNearMe] = useState(false);

    const buildSearchPayload = (kw) => ({
        keyword: kw.trim(),
        city: nearMe ? '' : city,
        nearMe,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch(buildSearchPayload(keyword));
    };

    return (
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

                    <form className="landing-search" onSubmit={handleSubmit}>
                        <div className="landing-search__fields">
                            <label className="landing-search__field landing-search__field--keyword">
                                <SearchIcon width={18} height={18} />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo tên công việc, công ty..."
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                />
                            </label>

                            <label className="landing-search__field landing-search__field--city">
                                <MapPinIcon width={18} height={18} />
                                <select
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    disabled={nearMe}
                                >
                                    {CITIES.map((c) => (
                                        <option key={c.value || 'all'} value={c.value}>
                                            {c.label}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="landing-search__near-me">
                                <input
                                    type="checkbox"
                                    checked={nearMe}
                                    onChange={(e) => setNearMe(e.target.checked)}
                                />
                                <MapPinIcon width={16} height={16} />
                                <span>Tìm việc gần tôi</span>
                            </label>

                            <button
                                type="submit"
                                className="btn btn--primary landing-search__submit"
                                disabled={loading}
                            >
                                {loading ? 'Đang tìm...' : 'Tìm kiếm'}
                            </button>
                        </div>
                    </form>
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
};

export default HeroSection;
