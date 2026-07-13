import { useEffect, useState } from 'react';
import { SearchIcon, MapPinIcon } from './icons.jsx';
import LocationSearchSelects from './LocationSearchSelects.jsx';
import {
    findLocationById,
    findProvinceByName,
    findWardByName,
} from '../../modules/location/index.js';
import '../../assets/styles/JobSearchForm.css';

const resolveInitialLocationIds = (initialCity, initialWard) => {
    const province = findProvinceByName(initialCity);
    if (!province) {
        return { provinceId: '', wardId: '' };
    }
    const ward = findWardByName(province.id, initialWard);
    return {
        provinceId: province.id,
        wardId: ward?.id || '',
    };
};

const JobSearchForm = ({
    onSearch,
    loading = false,
    initialKeyword = '',
    initialCity = '',
    initialWard = '',
    nearMeLabel = 'Tìm việc gần tôi',
    className = '',
    resetKey = 0,
}) => {
    const initialLocation = resolveInitialLocationIds(initialCity, initialWard);
    const [keyword, setKeyword] = useState(initialKeyword);
    const [provinceId, setProvinceId] = useState(initialLocation.provinceId);
    const [wardId, setWardId] = useState(initialLocation.wardId);
    const [nearMe, setNearMe] = useState(false);

    useEffect(() => {
        const location = resolveInitialLocationIds(initialCity, initialWard);
        setKeyword(initialKeyword);
        setProvinceId(location.provinceId);
        setWardId(location.wardId);
        setNearMe(false);
    }, [initialKeyword, initialCity, initialWard, resetKey]);

    const buildPayload = (kw) => {
        const city = nearMe || !provinceId ? '' : findLocationById(provinceId)?.ten || '';
        const ward = nearMe || !wardId ? '' : findLocationById(wardId)?.ten || '';

        return {
            keyword: kw.trim(),
            city,
            ward,
            nearMe,
        };
    };

    const handleProvinceChange = (nextProvinceId) => {
        setProvinceId(nextProvinceId);
        setWardId('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch(buildPayload(keyword));
    };

    return (
        <form className={`job-search-form ${className}`.trim()} onSubmit={handleSubmit}>
            <div className="job-search-form__panel">
                <label className="job-search-form__keyword">
                    <SearchIcon width={20} height={20} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên công việc, công ty..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                    />
                </label>

                <div className="job-search-form__filter-row">
                    <div className="job-search-form__locations">
                        <LocationSearchSelects
                            provinceId={provinceId}
                            wardId={wardId}
                            onProvinceChange={handleProvinceChange}
                            onWardChange={setWardId}
                            disabled={nearMe}
                            fieldClassName="job-search-form__field"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn--primary job-search-form__submit"
                        disabled={loading}
                    >
                        {loading ? 'Đang tìm...' : 'Tìm kiếm'}
                    </button>
                </div>

                <label className="job-search-form__near-me">
                    <input
                        type="checkbox"
                        checked={nearMe}
                        onChange={(e) => setNearMe(e.target.checked)}
                    />
                    <MapPinIcon width={18} height={18} />
                    <span>{nearMeLabel}</span>
                </label>
            </div>
        </form>
    );
};

export default JobSearchForm;
