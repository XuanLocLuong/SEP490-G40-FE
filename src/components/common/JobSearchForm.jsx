import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { SearchIcon, MapPinIcon } from './icons.jsx';
import LocationSearchSelects from './LocationSearchSelects.jsx';
import {
    findLocationById,
    findProvinceByName,
    findWardByName,
    matchProvinceAndWardFromNominatim,
} from '../../modules/location/index.js';
import { getSkills } from '../../apis/CandidateProfileApi.jsx';
import { useAuth } from '../../contexts/authContext.js';
import { JOB_TYPE_OPTIONS } from '../../utils/profileFormat.js';
import { USER_ROLES } from '../../utils/Constants.jsx';
import {
    geocodeAddress,
    getCurrentPosition,
    hasAdvancedFilters,
    reverseGeocodeCoords,
    SCHEDULE_DAY_OPTIONS,
} from '../../utils/jobQuery.js';
import '../../assets/styles/JobSearchForm.css';

/** Catalog seed — dùng khi guest (API skills yêu cầu ROLE_CANDIDATE). */
const FALLBACK_SKILLS = [
    { id: 1, name: 'Pha chế' },
    { id: 2, name: 'Thu ngân' },
    { id: 3, name: 'Phục vụ' },
    { id: 4, name: 'Giao tiếp' },
    { id: 5, name: 'Tiếng Anh' },
    { id: 6, name: 'Bán hàng' },
    { id: 7, name: 'Quản lý kho' },
    { id: 8, name: 'Tin học văn phòng' },
];

const toTimeInputValue = (value) => {
    if (!value) return '';
    return String(value).slice(0, 5);
};

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
    initialJobType = '',
    initialSalaryMin = null,
    initialSalaryMax = null,
    initialSkillIds = [],
    initialSchedules = [],
    initialNearMe = false,
    initialLatitude = null,
    initialLongitude = null,
    nearMeLabel = 'Tìm việc gần tôi',
    className = '',
    resetKey = 0,
}) => {
    const { auth } = useAuth();
    const isCandidate = auth?.role === USER_ROLES.CANDIDATE;
    const initialLocation = resolveInitialLocationIds(initialCity, initialWard);
    const [keyword, setKeyword] = useState(initialKeyword);
    const [provinceId, setProvinceId] = useState(initialLocation.provinceId);
    const [wardId, setWardId] = useState(initialLocation.wardId);
    const [nearMe, setNearMe] = useState(Boolean(initialNearMe));
    const [coords, setCoords] = useState(
        initialLatitude != null && initialLongitude != null
            ? { latitude: Number(initialLatitude), longitude: Number(initialLongitude) }
            : null
    );
    const [locating, setLocating] = useState(false);
    const [jobType, setJobType] = useState(initialJobType || '');
    const [salaryMin, setSalaryMin] = useState(
        initialSalaryMin != null ? String(initialSalaryMin) : ''
    );
    const [salaryMax, setSalaryMax] = useState(
        initialSalaryMax != null ? String(initialSalaryMax) : ''
    );
    const [skillIds, setSkillIds] = useState(initialSkillIds || []);
    const [scheduleDays, setScheduleDays] = useState(
        (initialSchedules || []).map((item) => String(item.dayOfWeek))
    );
    const [scheduleStart, setScheduleStart] = useState(
        toTimeInputValue(initialSchedules?.[0]?.startTime) || ''
    );
    const [scheduleEnd, setScheduleEnd] = useState(
        toTimeInputValue(initialSchedules?.[0]?.endTime) || ''
    );
    const [skillsCatalog, setSkillsCatalog] = useState(FALLBACK_SKILLS);
    const [advancedOpen, setAdvancedOpen] = useState(
        hasAdvancedFilters({
            jobType: initialJobType,
            salaryMin: initialSalaryMin,
            salaryMax: initialSalaryMax,
            skillIds: initialSkillIds,
            schedules: initialSchedules,
        })
    );

    useEffect(() => {
        const location = resolveInitialLocationIds(initialCity, initialWard);
        const skillIdsNext = Array.isArray(initialSkillIds) ? initialSkillIds : [];
        const schedulesNext = Array.isArray(initialSchedules) ? initialSchedules : [];

        setKeyword(initialKeyword);
        setProvinceId(location.provinceId);
        setWardId(location.wardId);
        setNearMe(Boolean(initialNearMe));
        setCoords(
            initialLatitude != null && initialLongitude != null
                ? { latitude: Number(initialLatitude), longitude: Number(initialLongitude) }
                : null
        );
        setJobType(initialJobType || '');
        setSalaryMin(initialSalaryMin != null ? String(initialSalaryMin) : '');
        setSalaryMax(initialSalaryMax != null ? String(initialSalaryMax) : '');
        setSkillIds(skillIdsNext);
        setScheduleDays(schedulesNext.map((item) => String(item.dayOfWeek)));
        setScheduleStart(toTimeInputValue(schedulesNext[0]?.startTime) || '');
        setScheduleEnd(toTimeInputValue(schedulesNext[0]?.endTime) || '');
        setAdvancedOpen(
            hasAdvancedFilters({
                jobType: initialJobType,
                salaryMin: initialSalaryMin,
                salaryMax: initialSalaryMax,
                skillIds: skillIdsNext,
                schedules: isCandidate ? schedulesNext : [],
            })
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        initialKeyword,
        initialCity,
        initialWard,
        initialJobType,
        initialSalaryMin,
        initialSalaryMax,
        JSON.stringify(initialSkillIds || []),
        JSON.stringify(initialSchedules || []),
        initialNearMe,
        initialLatitude,
        initialLongitude,
        resetKey,
        isCandidate,
    ]);

    useEffect(() => {
        if (auth?.role !== USER_ROLES.CANDIDATE) {
            setSkillsCatalog(FALLBACK_SKILLS);
            return undefined;
        }

        let cancelled = false;
        (async () => {
            try {
                const res = await getSkills();
                const list = res?.data?.data ?? res?.data ?? [];
                if (!cancelled && Array.isArray(list) && list.length > 0) {
                    setSkillsCatalog(
                        list.map((skill) => ({ id: skill.id, name: skill.name }))
                    );
                }
            } catch {
                if (!cancelled) setSkillsCatalog(FALLBACK_SKILLS);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [auth?.role]);

    const buildSchedules = () => {
        if (!isCandidate) return [];
        if (!scheduleDays.length || !scheduleStart || !scheduleEnd) return [];
        if (scheduleStart >= scheduleEnd) return [];
        return scheduleDays.map((dayOfWeek) => ({
            dayOfWeek,
            startTime: `${scheduleStart}:00`,
            endTime: `${scheduleEnd}:00`,
        }));
    };

    const buildBasePayload = () => {
        const city = provinceId ? findLocationById(provinceId)?.ten || '' : '';
        const ward = wardId ? findLocationById(wardId)?.ten || '' : '';
        const min = salaryMin.trim() === '' ? null : Number(salaryMin);
        const max = salaryMax.trim() === '' ? null : Number(salaryMax);

        return {
            keyword: keyword.trim(),
            city,
            ward,
            nearMe,
            jobType: jobType || undefined,
            salaryMin: Number.isFinite(min) ? min : null,
            salaryMax: Number.isFinite(max) ? max : null,
            skillIds: [...skillIds],
            schedules: buildSchedules(),
        };
    };

    const applyCoordsToCityWard = async (pos) => {
        setCoords(pos);
        const reversed = await reverseGeocodeCoords(pos.latitude, pos.longitude);
        const matched = matchProvinceAndWardFromNominatim(
            reversed.address,
            reversed.displayName
        );
        if (matched.provinceId) {
            setProvinceId(matched.provinceId);
            setWardId(matched.wardId || '');
        }
        return matched;
    };

    const locateNearMe = async () => {
        const pos = await getCurrentPosition();
        const matched = await applyCoordsToCityWard(pos);
        if (!matched.provinceId) {
            toast.warning('Đã lấy vị trí nhưng chưa khớp được Tỉnh/Phường. Bạn có thể chọn thủ công.');
        } else {
            toast.success('Đã lấy vị trí hiện tại.');
        }
        return pos;
    };

    const handleProvinceChange = (nextProvinceId) => {
        setProvinceId(nextProvinceId);
        setWardId('');
        if (nearMe) setCoords(null);
    };

    const handleWardChange = (nextWardId) => {
        setWardId(nextWardId);
        if (nearMe) setCoords(null);
    };

    const toggleSkill = (id) => {
        setSkillIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const toggleScheduleDay = (day) => {
        setScheduleDays((prev) =>
            prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day]
        );
    };

    const handleNearMeToggle = async (checked) => {
        setNearMe(checked);
        if (!checked) {
            setCoords(null);
            return;
        }

        setLocating(true);
        try {
            await locateNearMe();
        } catch (err) {
            setNearMe(false);
            setCoords(null);
            toast.error(err.message || 'Không thể lấy vị trí.');
        } finally {
            setLocating(false);
        }
    };

    const resolveNearMeCoords = async () => {
        if (coords?.latitude != null && coords?.longitude != null) {
            return coords;
        }

        const city = provinceId ? findLocationById(provinceId)?.ten || '' : '';
        const ward = wardId ? findLocationById(wardId)?.ten || '' : '';
        if (city || ward) {
            const geo = await geocodeAddress([ward, city, 'Việt Nam'].filter(Boolean).join(', '));
            const next = { latitude: geo.latitude, longitude: geo.longitude };
            setCoords(next);
            return next;
        }

        return locateNearMe();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const base = buildBasePayload();

        if (!base.nearMe) {
            onSearch(base);
            return;
        }

        setLocating(true);
        try {
            const resolved = await resolveNearMeCoords();
            onSearch({
                ...base,
                city: provinceId ? findLocationById(provinceId)?.ten || base.city : base.city,
                ward: wardId ? findLocationById(wardId)?.ten || base.ward : base.ward,
                latitude: resolved.latitude,
                longitude: resolved.longitude,
            });
        } catch (err) {
            toast.error(err.message || 'Không thể xác định vị trí để tìm việc gần bạn.');
        } finally {
            setLocating(false);
        }
    };

    const busy = loading || locating;

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
                            onWardChange={handleWardChange}
                            disabled={locating}
                            fieldClassName="job-search-form__field"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn--primary job-search-form__submit"
                        disabled={busy}
                    >
                        {locating ? 'Đang lấy vị trí...' : loading ? 'Đang tìm...' : 'Tìm kiếm'}
                    </button>
                </div>

                <div className="job-search-form__toolbar">
                    <button
                        type="button"
                        className="job-search-form__advanced-toggle"
                        onClick={() => setAdvancedOpen((open) => !open)}
                        aria-expanded={advancedOpen}
                    >
                        {advancedOpen ? 'Ẩn bộ lọc' : 'Thêm bộ lọc'}
                    </button>

                    <label className="job-search-form__near-me">
                        <input
                            type="checkbox"
                            checked={nearMe}
                            onChange={(e) => handleNearMeToggle(e.target.checked)}
                            disabled={locating}
                        />
                        <MapPinIcon width={18} height={18} />
                        <span>{nearMeLabel}</span>
                    </label>
                </div>

                {advancedOpen && (
                    <div className="job-search-form__advanced">
                        <div className="job-search-form__advanced-grid">
                            <label className="job-search-form__select-field">
                                <span>Loại việc</span>
                                <select
                                    value={jobType}
                                    onChange={(e) => setJobType(e.target.value)}
                                >
                                    <option value="">Tất cả</option>
                                    {JOB_TYPE_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="job-search-form__select-field">
                                <span>Lương tối thiểu (/giờ)</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    placeholder="VD: 20000"
                                    value={salaryMin}
                                    onChange={(e) => setSalaryMin(e.target.value)}
                                />
                            </label>

                            <label className="job-search-form__select-field">
                                <span>Lương tối đa (/giờ)</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    placeholder="VD: 35000"
                                    value={salaryMax}
                                    onChange={(e) => setSalaryMax(e.target.value)}
                                />
                            </label>
                        </div>

                        <fieldset className="job-search-form__fieldset">
                            <legend>Kỹ năng</legend>
                            <div className="job-search-form__chips">
                                {skillsCatalog.map((skill) => {
                                    const active = skillIds.includes(skill.id);
                                    return (
                                        <button
                                            key={skill.id}
                                            type="button"
                                            className={`job-search-form__chip${
                                                active ? ' job-search-form__chip--active' : ''
                                            }`}
                                            onClick={() => toggleSkill(skill.id)}
                                            aria-pressed={active}
                                        >
                                            {skill.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </fieldset>

                        {isCandidate && (
                            <fieldset className="job-search-form__fieldset">
                                <legend>Lịch làm việc</legend>
                                <div className="job-search-form__chips">
                                    {SCHEDULE_DAY_OPTIONS.map((day) => {
                                        const active = scheduleDays.includes(day.value);
                                        return (
                                            <button
                                                key={day.value}
                                                type="button"
                                                className={`job-search-form__chip${
                                                    active ? ' job-search-form__chip--active' : ''
                                                }`}
                                                onClick={() => toggleScheduleDay(day.value)}
                                                aria-pressed={active}
                                            >
                                                {day.label}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="job-search-form__time-row">
                                    <label className="job-search-form__select-field">
                                        <span>Từ giờ</span>
                                        <input
                                            type="time"
                                            value={scheduleStart}
                                            onChange={(e) => setScheduleStart(e.target.value)}
                                        />
                                    </label>
                                    <label className="job-search-form__select-field">
                                        <span>Đến giờ</span>
                                        <input
                                            type="time"
                                            value={scheduleEnd}
                                            onChange={(e) => setScheduleEnd(e.target.value)}
                                        />
                                    </label>
                                </div>
                                <p className="job-search-form__hint">
                                    Chọn ngày và khung giờ trùng với ít nhất một ca của tin tuyển
                                    dụng.
                                </p>
                            </fieldset>
                        )}
                    </div>
                )}
            </div>
        </form>
    );
};

export default JobSearchForm;
