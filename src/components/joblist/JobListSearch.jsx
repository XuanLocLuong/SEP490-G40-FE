import { useState } from 'react';
import { SearchIcon, MapPinIcon } from '../common/icons.jsx';

const CITIES = [
    { value: '', label: 'Tất cả địa điểm' },
    { value: 'TP.HCM', label: 'TP. HCM' },
    { value: 'Hà Nội', label: 'Hà Nội' },
];

const JobListSearch = ({ initialKeyword = '', initialCity = '', onSearch, loading }) => {
    const [keyword, setKeyword] = useState(initialKeyword);
    const [city, setCity] = useState(initialCity);
    const [nearMe, setNearMe] = useState(false);

    const buildPayload = (kw) => ({
        keyword: kw.trim(),
        city: nearMe ? '' : city,
        nearMe,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch(buildPayload(keyword));
    };

    return (
        <form className="job-list-search" onSubmit={handleSubmit}>
            <div className="job-list-search__fields">
                <label className="job-list-search__field">
                    <SearchIcon width={18} height={18} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên công việc, công ty..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                    />
                </label>

                <label className="job-list-search__field">
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

                <label className="job-list-search__near-me">
                    <input
                        type="checkbox"
                        checked={nearMe}
                        onChange={(e) => setNearMe(e.target.checked)}
                    />
                    <MapPinIcon width={16} height={16} />
                    <span>Gần tôi</span>
                </label>

                <button type="submit" className="btn btn--primary" disabled={loading}>
                    {loading ? 'Đang tìm...' : 'Tìm kiếm'}
                </button>
            </div>
        </form>
    );
};

export default JobListSearch;
